import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { translateText, clearTranslationCacheForMessage } from '../services/translationService.js';

// @desc    Translate a message or custom text
// @route   POST /api/translate OR POST /api/messages/translate
// @access  Private
export const translateMessage = async (req, res) => {
  try {
    const { messageId, text, targetLanguage, sourceLanguage } = req.body;

    if (!targetLanguage) {
      return res.status(400).json({
        success: false,
        message: 'Target language is required (e.g. "te", "hi", "en", "es")',
      });
    }

    let textToTranslate = text;
    let foundMessage = null;

    if (messageId) {
      foundMessage = await Message.findById(messageId);
      if (!foundMessage) {
        return res.status(404).json({
          success: false,
          message: 'Message not found',
        });
      }

      // Check if message was deleted
      if (foundMessage.isDeletedForEveryone || (foundMessage.deletedFor && foundMessage.deletedFor.some(id => id.toString() === req.user._id.toString()))) {
        return res.status(400).json({
          success: false,
          message: 'This message was deleted',
          isDeleted: true,
        });
      }

      // Validate conversation membership for authorization
      if (foundMessage.conversationId) {
        const conversation = await Conversation.findById(foundMessage.conversationId);
        if (conversation && conversation.participants) {
          const isParticipant = conversation.participants.some(
            (p) => p.toString() === req.user._id.toString()
          );
          if (!isParticipant) {
            return res.status(403).json({
              success: false,
              message: 'You are not authorized to view or translate this message',
            });
          }
        }
      }

      textToTranslate = foundMessage.text || text;

      // Check if translation for this targetLanguage is already stored in message.translations
      if (foundMessage.translations && foundMessage.translations.length > 0) {
        const existing = foundMessage.translations.find(
          (t) => t.language.toLowerCase() === targetLanguage.toLowerCase()
        );
        if (existing) {
          return res.status(200).json({
            success: true,
            translatedText: existing.translatedText,
            sourceLanguage: existing.sourceLanguage || 'auto',
            sourceLanguageName: existing.sourceLanguage || 'Original',
            targetLanguage,
            targetLanguageName: targetLanguage,
            fromCache: true,
            messageId: foundMessage._id,
          });
        }
      }
    }

    if (!textToTranslate || !textToTranslate.trim()) {
      return res.status(400).json({
        success: false,
        message: 'No text available to translate',
      });
    }

    const result = await translateText({
      text: textToTranslate,
      targetLanguage,
      sourceLanguage: sourceLanguage || 'auto',
      messageId: foundMessage?._id ? foundMessage._id.toString() : null,
    });

    // Optionally persist translation to message document cache if messageId exists
    if (foundMessage) {
      if (!foundMessage.translations) {
        foundMessage.translations = [];
      }
      const alreadySaved = foundMessage.translations.some(
        (t) => t.language.toLowerCase() === targetLanguage.toLowerCase()
      );
      if (!alreadySaved) {
        foundMessage.translations.push({
          language: targetLanguage.toLowerCase(),
          translatedText: result.translatedText,
          sourceLanguage: result.sourceLanguage,
          createdAt: new Date(),
        });
        // Limit stored translations per message to top 5 to prevent unbounded growth
        if (foundMessage.translations.length > 5) {
          foundMessage.translations.shift();
        }
        await foundMessage.save().catch((err) => console.warn('Could not save translation to message document:', err.message));
      }
    }

    return res.status(200).json({
      success: true,
      translatedText: result.translatedText,
      sourceLanguage: result.sourceLanguage,
      sourceLanguageName: result.sourceLanguageName,
      targetLanguage: result.targetLanguage,
      targetLanguageName: result.targetLanguageName,
      fromCache: result.fromCache,
      messageId: foundMessage?._id || null,
    });
  } catch (error) {
    console.error('[Translation Controller Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Translation failed. Please try again.',
    });
  }
};

export default {
  translateMessage,
};
