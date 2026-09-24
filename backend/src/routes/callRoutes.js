import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getCalls,
  logCall,
  deleteCall,
  clearCallHistory,
} from '../controllers/callController.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getCalls).post(logCall).delete(clearCallHistory);
router.route('/:id').delete(deleteCall);

export default router;
