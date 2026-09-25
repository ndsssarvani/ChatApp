import express from 'express';
import { translateMessage } from '../controllers/translationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', translateMessage);

export default router;
