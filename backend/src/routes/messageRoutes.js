import express from 'express';
import {
  getMessages,
  sendMessage,
  forwardMessage,
  uploadAttachment,
  editMessage,
  deleteMessage,
  toggleStarMessage,
  getStarredMessages,
  addReaction,
  searchMessages,
} from '../controllers/messageController.js';
import { translateMessage } from '../controllers/translationController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.post('/translate', translateMessage);
router.get('/starred', getStarredMessages);
router.get('/search', searchMessages);
router.post('/upload', upload.single('file'), uploadAttachment);
router.post('/forward', forwardMessage);
router.get('/:conversationId', getMessages);
router.post('/', sendMessage);
router.put('/:id', editMessage);
router.delete('/:id', deleteMessage);
router.post('/:id/star', toggleStarMessage);
router.post('/:id/react', addReaction);

export default router;
