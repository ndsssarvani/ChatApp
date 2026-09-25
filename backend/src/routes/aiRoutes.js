import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  sendMessage,
  getConversations,
  getConversation,
  deleteConversation,
  renameConversation,
  runAITool,
} from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Rate limiter for AI generation (prevent abuse)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 requests per 15 mins per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI requests. Please wait a few minutes before sending more.',
  },
});

// All AI routes require user authentication
router.use(protect);

router.post('/chat', aiLimiter, sendMessage);
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversation);
router.delete('/conversations/:id', deleteConversation);
router.put('/conversations/:id', renameConversation);
router.post('/tool', aiLimiter, runAITool);

export default router;
