import { GoogleGenAI } from '@google/genai';

let aiInstance = null;

const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

// Candidate models in priority order
const MODELS = ['gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-3.8-flash'];

/**
 * Call Gemini with multi-model fallback & retry
 */
const callGeminiWithFallback = async ({ contents, config }) => {
  const ai = getAIClient();
  if (!ai) {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in backend/.env');
  }

  let lastError = null;

  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });

      if (response && response.text) {
        return {
          text: response.text,
          model,
        };
      }
    } catch (err) {
      console.warn(`[GeminiService] Model ${model} encountered error:`, err.message);
      lastError = err;
      // If 503 (high demand) or 404, try next model in priority order
    }
  }

  throw new Error(
    lastError?.message ||
      'AI service is currently busy or experiencing high demand. Please try again in a moment.'
  );
};

/**
 * Generate Multi-turn AI Chat Response
 */
export const generateAIChatResponse = async ({
  messages = [],
  language = 'en',
  style = 'balanced',
}) => {
  const systemInstruction = `You are Chatify AI, an intelligent, helpful, and friendly AI assistant built into the Chatify messaging platform.
- Respond concisely, accurately, and formatting text clearly using Markdown.
- Use code blocks with language identifiers for programming snippets.
- If the user asks in Telugu, respond in Telugu. If in Hindi, respond in Hindi. If in English, respond in English. User UI language context is: ${language}.
- Response style preference: ${style}.`;

  // Format multi-turn history for Gemini with multimodal support
  const formattedContents = messages.map((m) => {
    const parts = [];

    // Add attachments first if any
    if (m.attachments && Array.isArray(m.attachments)) {
      for (const att of m.attachments) {
        if (att.base64Data && att.mimeType) {
          const cleanBase64 = att.base64Data.includes('base64,')
            ? att.base64Data.split('base64,')[1]
            : att.base64Data;
          parts.push({
            inlineData: {
              data: cleanBase64,
              mimeType: att.mimeType,
            },
          });
        } else if (att.textContent) {
          parts.push({
            text: `[Attached Document: ${att.fileName || 'file'}]\n${att.textContent}`,
          });
        }
      }
    }

    if (m.content && m.content.trim()) {
      parts.push({ text: m.content });
    }

    // Ensure at least one part exists
    if (parts.length === 0) {
      parts.push({ text: '' });
    }

    return {
      role: m.role === 'model' ? 'model' : 'user',
      parts,
    };
  });

  const result = await callGeminiWithFallback({
    contents: formattedContents,
    config: {
      systemInstruction,
    },
  });

  return result;
};

/**
 * Specialized AI Tools (Summarize, Code Assistant, Translate, etc.)
 */
export const generateAIToolResponse = async ({
  tool,
  input,
  context = '',
  language = 'en',
  targetLang = 'English',
}) => {
  let prompt = '';
  let systemInstruction = 'You are Chatify AI, a versatile and high-performance assistant.';

  switch (tool) {
    case 'summarize':
      prompt = `Summarize the following text clearly with key bullet points:\n\n${input}`;
      break;

    case 'explain_code':
      prompt = `Explain the following code clearly, step by step, highlighting key logic and concepts:\n\n\`\`\`\n${input}\n\`\`\``;
      break;

    case 'debug_code':
      prompt = `Review this code for bugs, errors, and performance issues. Explain what is wrong and provide the corrected code with comments:\n\n\`\`\`\n${input}\n\`\`\`\n\nAdditional error context: ${context || 'None'}`;
      break;

    case 'translate':
      prompt = `Translate the following text accurately into ${targetLang}. Preserve tone and formatting:\n\n${input}`;
      break;

    case 'interview_prep':
      prompt = `Provide 5 realistic technical and behavioral interview questions and sample high-scoring answers for the topic: "${input}".`;
      break;

    case 'rewrite':
      prompt = `Rewrite and polish the following text to make it professional, engaging, and clear:\n\n${input}`;
      break;

    default:
      prompt = input;
  }

  const result = await callGeminiWithFallback({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction,
    },
  });

  return result;
};

/**
 * Check if Gemini API is configured
 */
export const checkGeminiConfig = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn('[GeminiService] ⚠️ GEMINI_API_KEY is not configured in backend/.env');
    return false;
  }
  console.log('[GeminiService] ✓ Gemini API client initialized with configured key.');
  return true;
};
