// Translation Service with Multi-Engine Support, Auto-Detection, and In-Memory + DB Caching

const LANGUAGE_NAMES = {
  en: 'English',
  te: 'Telugu',
  hi: 'Hindi',
  ta: 'Tamil',
  kn: 'Kannada',
  ml: 'Malayalam',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
  pa: 'Punjabi',
  ur: 'Urdu',
  ar: 'Arabic',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
  ko: 'Korean',
  tr: 'Turkish',
  nl: 'Dutch',
  pl: 'Polish',
  sv: 'Swedish',
  vi: 'Vietnamese',
  th: 'Thai',
  id: 'Indonesian',
};

// In-memory cache for fast repeated lookups: key = `${messageId || hash}_${targetLanguage}`
const translationCache = new Map();
const MAX_CACHE_SIZE = 1000;

export const getLanguageName = (code) => {
  if (!code) return 'Unknown';
  const cleanCode = code.toLowerCase().split('-')[0];
  return LANGUAGE_NAMES[cleanCode] || code.toUpperCase();
};

export const clearTranslationCacheForMessage = (messageId) => {
  if (!messageId) return;
  const prefix = `${messageId}_`;
  for (const key of translationCache.keys()) {
    if (key.startsWith(prefix)) {
      translationCache.delete(key);
    }
  }
};

/**
 * Translates text into targetLanguage and auto-detects sourceLanguage.
 * @param {Object} options
 * @param {string} options.text
 * @param {string} options.targetLanguage - ISO code (e.g. 'te', 'hi', 'en', 'es')
 * @param {string} [options.sourceLanguage] - Optional source language code (defaults to 'auto')
 * @param {string} [options.messageId] - Optional messageId for caching
 * @returns {Promise<{ translatedText: string, sourceLanguage: string, sourceLanguageName: string, targetLanguage: string, targetLanguageName: string, fromCache: boolean }>}
 */
export const translateText = async ({ text, targetLanguage, sourceLanguage = 'auto', messageId = null }) => {
  if (!text || !text.trim()) {
    throw new Error('Text to translate cannot be empty');
  }

  const trimmedText = text.trim();
  if (trimmedText.length > 5000) {
    throw new Error('Message is too long for translation (max 5,000 characters)');
  }

  const normalizedTarget = (targetLanguage || 'en').toLowerCase().trim();
  const normalizedSource = (sourceLanguage || 'auto').toLowerCase().trim();

  const cacheKey = messageId
    ? `${messageId}_${normalizedTarget}`
    : `${trimmedText.slice(0, 100)}_${trimmedText.length}_${normalizedTarget}`;

  // Check cache
  if (translationCache.has(cacheKey)) {
    const cached = translationCache.get(cacheKey);
    return { ...cached, fromCache: true };
  }

  let translatedText = '';
  let detectedSource = normalizedSource !== 'auto' ? normalizedSource : 'auto';

  // 1. Primary Engine: Google GTX Engine
  try {
    const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${normalizedSource}&tl=${normalizedTarget}&dt=t&q=${encodeURIComponent(
      trimmedText
    )}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(gtxUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        translatedText = data[0]
          .map((item) => (item && item[0] ? item[0] : ''))
          .join('');
        if (data[2] && typeof data[2] === 'string') {
          detectedSource = data[2];
        }
      }
    }
  } catch (err) {
    console.warn('[Translation Service] Primary Google GTX attempt failed, trying fallback...', err.message);
  }

  // 2. Fallback Engine: MyMemory Translation API
  if (!translatedText) {
    try {
      const pair = normalizedSource === 'auto' ? `autodetect|${normalizedTarget}` : `${normalizedSource}|${normalizedTarget}`;
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        trimmedText
      )}&langpair=${pair}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(myMemoryUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.responseData && data.responseData.translatedText) {
          translatedText = data.responseData.translatedText;
          if (data.responseData.detectedLanguage) {
            detectedSource = data.responseData.detectedLanguage;
          }
        }
      }
    } catch (err) {
      console.warn('[Translation Service] MyMemory fallback failed:', err.message);
    }
  }

  if (!translatedText) {
    throw new Error('Translation failed. Please check your internet connection or try again.');
  }

  const result = {
    translatedText,
    sourceLanguage: detectedSource,
    sourceLanguageName: getLanguageName(detectedSource),
    targetLanguage: normalizedTarget,
    targetLanguageName: getLanguageName(normalizedTarget),
    fromCache: false,
  };

  // Cache result
  if (translationCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = translationCache.keys().next().value;
    translationCache.delete(oldestKey);
  }
  translationCache.set(cacheKey, result);

  return result;
};

export default {
  translateText,
  getLanguageName,
  clearTranslationCacheForMessage,
};
