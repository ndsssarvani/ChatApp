import AIConversation from '../models/AIConversation.js';
import { generateAIChatResponse, generateAIToolResponse } from '../services/geminiService.js';

// @desc    Send a message to Chatify AI (Multi-turn chat)
// @route   POST /api/ai/chat
export const sendMessage = async (req, res) => {
  try {
    const { message, conversationId, language, style, attachments } = req.body;

    const trimmedMsg = typeof message === 'string' ? message.trim() : '';
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!trimmedMsg && !hasAttachments) {
      return res.status(400).json({ success: false, message: 'Message or attachment is required.' });
    }

    if (trimmedMsg.length > 8000) {
      return res.status(400).json({
        success: false,
        message: 'Message exceeds maximum length of 8000 characters.',
      });
    }

    let conversation = null;

    if (conversationId) {
      conversation = await AIConversation.findOne({
        _id: conversationId,
        user: req.user._id,
      });

      if (!conversation) {
        return res.status(404).json({ success: false, message: 'Conversation not found.' });
      }
    } else {
      // Auto-generate title from first prompt or attachment
      let initialTitle = 'New AI Chat';
      if (trimmedMsg) {
        initialTitle = trimmedMsg.length > 36 ? `${trimmedMsg.substring(0, 36)}...` : trimmedMsg;
      } else if (hasAttachments) {
        initialTitle = `File: ${attachments[0].fileName || 'Attachment'}`;
      }

      conversation = new AIConversation({
        user: req.user._id,
        title: initialTitle,
        messages: [],
      });
    }

    // Add user message with attachments
    conversation.messages.push({
      role: 'user',
      content: trimmedMsg || (hasAttachments ? 'Please analyze the attached file.' : ''),
      attachments: hasAttachments ? attachments : [],
      createdAt: new Date(),
    });

    // Prepare context history (limit to last 16 turns to keep context fast and high-quality)
    const recentMessages = conversation.messages.slice(-16).map((m) => ({
      role: m.role,
      content: m.content,
      attachments: m.attachments,
    }));

    // Generate response from Gemini
    const aiResult = await generateAIChatResponse({
      messages: recentMessages,
      language: language || req.user?.preferences?.language || 'en',
      style: style || 'balanced',
    });

    // Add model response
    conversation.messages.push({
      role: 'model',
      content: aiResult.text,
      createdAt: new Date(),
    });

    await conversation.save();

    res.status(200).json({
      success: true,
      reply: aiResult.text,
      conversationId: conversation._id,
      title: conversation.title,
      model: aiResult.model,
    });
  } catch (error) {
    console.error('[AI Chat Controller Error]', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'AI is temporarily unavailable. Please try again.',
    });
  }
};

// @desc    Get all AI conversations for current user
// @route   GET /api/ai/conversations
export const getConversations = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { user: req.user._id };

    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    const conversations = await AIConversation.find(query)
      .select('_id title updatedAt createdAt messages')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    const formatted = conversations.map((c) => ({
      _id: c._id,
      title: c.title,
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
      messageCount: c.messages ? c.messages.length : 0,
      lastMessage:
        c.messages && c.messages.length > 0
          ? c.messages[c.messages.length - 1].content.substring(0, 60)
          : '',
    }));

    res.status(200).json({
      success: true,
      conversations: formatted,
    });
  } catch (error) {
    console.error('[Get AI Conversations Error]', error.message);
    res.status(500).json({ success: false, message: 'Failed to load conversations.' });
  }
};

// @desc    Get single AI conversation with full messages
// @route   GET /api/ai/conversations/:id
export const getConversation = async (req, res) => {
  try {
    const conversation = await AIConversation.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('[Get Single AI Conversation Error]', error.message);
    res.status(500).json({ success: false, message: 'Failed to load conversation details.' });
  }
};

// @desc    Delete AI conversation
// @route   DELETE /api/ai/conversations/:id
export const deleteConversation = async (req, res) => {
  try {
    const conversation = await AIConversation.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully.',
    });
  } catch (error) {
    console.error('[Delete AI Conversation Error]', error.message);
    res.status(500).json({ success: false, message: 'Failed to delete conversation.' });
  }
};

// @desc    Rename AI conversation
// @route   PUT /api/ai/conversations/:id
export const renameConversation = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    const conversation = await AIConversation.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title: title.trim() },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    res.status(200).json({
      success: true,
      title: conversation.title,
    });
  } catch (error) {
    console.error('[Rename AI Conversation Error]', error.message);
    res.status(500).json({ success: false, message: 'Failed to rename conversation.' });
  }
};

// @desc    Execute AI Tool (Summarize, Code Assistant, Translate, etc.)
// @route   POST /api/ai/tool
export const runAITool = async (req, res) => {
  try {
    const { tool, input, context, language, targetLang } = req.body;

    if (!input || !input.trim()) {
      return res.status(400).json({ success: false, message: 'Input text is required for AI tools.' });
    }

    const toolResult = await generateAIToolResponse({
      tool,
      input: input.trim(),
      context: context ? context.trim() : '',
      language: language || req.user?.preferences?.language || 'en',
      targetLang: targetLang || 'English',
    });

    res.status(200).json({
      success: true,
      result: toolResult.text,
      model: toolResult.model,
    });
  } catch (error) {
    console.error('[Run AI Tool Error]', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'AI Tool execution failed. Please try again.',
    });
  }
};
