import express from 'express';
import {
  getConversations,
  getOrCreateOneToOne,
  createGroup,
  updateGroup,
  addGroupMembers,
  removeGroupMember,
  getOrCreateInviteLink,
  regenerateInviteLink,
  toggleInviteStatus,
  getInviteInfo,
  joinGroupViaInvite,
  setTemporaryTimer,
  deleteConversation,
} from '../controllers/conversationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public / Optional-auth invite query endpoint
router.get('/invite/:token', getInviteInfo);

// Protected routes
router.use(protect);

// Join via invite token (must be authenticated)
router.post('/invite/:token/join', joinGroupViaInvite);

// Conversations
router.get('/', getConversations);
router.post('/one-to-one', getOrCreateOneToOne);
router.post('/group', createGroup);
router.get('/:id/invite', getOrCreateInviteLink);
router.post('/:id/invite/regenerate', regenerateInviteLink);
router.put('/:id/invite/status', toggleInviteStatus);
router.delete('/:id', deleteConversation);
router.put('/:id/group', updateGroup);
router.post('/:id/members', addGroupMembers);
router.delete('/:id/members/:userId', removeGroupMember);
router.put('/:id/temporary', setTemporaryTimer);

export default router;
