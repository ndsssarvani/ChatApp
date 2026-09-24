import express from 'express';
import {
  getConversations,
  getOrCreateOneToOne,
  createGroup,
  updateGroup,
  addGroupMembers,
  removeGroupMember,
  setTemporaryTimer,
  deleteConversation,
} from '../controllers/conversationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getConversations);
router.post('/one-to-one', getOrCreateOneToOne);
router.post('/group', createGroup);
router.delete('/:id', deleteConversation);
router.put('/:id/group', updateGroup);
router.post('/:id/members', addGroupMembers);
router.delete('/:id/members/:userId', removeGroupMember);
router.put('/:id/temporary', setTemporaryTimer);

export default router;
