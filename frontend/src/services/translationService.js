import api from './api';

export const translationService = {
  /**
   * Translates a message or arbitrary text to targetLanguage.
   * @param {Object} params
   * @param {string} [params.messageId]
   * @param {string} [params.text]
   * @param {string} params.targetLanguage (e.g. 'te', 'hi', 'en', 'es')
   * @param {string} [params.sourceLanguage='auto']
   * @returns {Promise<{ success: boolean, translatedText: string, sourceLanguage: string, sourceLanguageName: string, targetLanguage: string, targetLanguageName: string, fromCache: boolean, messageId?: string }>}
   */
  async translateMessage({ messageId, text, targetLanguage, sourceLanguage = 'auto' }) {
    const res = await api.post('/translate', {
      messageId,
      text,
      targetLanguage,
      sourceLanguage,
    });
    return res.data;
  },
};

export default translationService;
