import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/notificationController.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getNotifications).delete(clearAllNotifications);
router.route('/read-all').put(markAllAsRead);
router.route('/:id/read').put(markAsRead);
router.route('/:id').delete(deleteNotification);

export default router;
