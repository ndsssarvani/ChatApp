import express from 'express';
import {
  getDashboardOverview,
  getChatAnalytics,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/overview', getDashboardOverview);
router.get('/details', getChatAnalytics);

export default router;
