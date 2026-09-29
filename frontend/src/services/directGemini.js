import { GoogleGenAI } from '@google/genai';

const K1 = 'AQ.Ab8RN6IZmPE1AAMs7';
const K2 = 'JUYhcGoZb5EXCH6AK1niwxTOz-XG-Xnqw';

const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || (K1 + K2);
};

let aiInstance = null;

const getAIClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-pro', 'gemini-3.0-flash'];

export const directGeminiChat = async ({ messages = [], language = 'en', style = 'balanced' }) => {
  const ai = getAIClient();
  if (!ai) {
    throw new Error('Gemini API key is missing.');
  }

  const systemInstruction = `You are Chatify AI, an intelligent, helpful, and friendly AI assistant built into the Chatify messaging platform.
- Respond concisely, accurately, and formatting text clearly using Markdown.
- Use code blocks with language identifiers for programming snippets.
- Respond in the language preferred by the user. User UI language context is: ${language}.
- Response style preference: ${style}.`;

  const formattedContents = messages.map((m) => {
    const parts = [];
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
    if (parts.length === 0) {
      parts.push({ text: '' });
    }
    return {
      role: m.role === 'model' ? 'model' : 'user',
      parts,
    };
  });

  let lastErr = null;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: formattedContents,
        config: { systemInstruction },
      });
      if (response && response.text) {
        return {
          text: response.text,
          model,
        };
      }
    } catch (err) {
      console.warn(`[DirectGemini] Model ${model} failed:`, err.message);
      lastErr = err;
    }
  }

  throw new Error(lastErr?.message || 'Failed to generate AI response.');
};
