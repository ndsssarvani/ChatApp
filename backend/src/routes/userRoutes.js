import express from 'express';
import {
  getUsers,
  getUserById,
  updateProfile,
  uploadAvatar,
  updatePreferences,
  changePassword,
  getContacts,
  addContact,
  removeContact,
  blockUser,
  unblockUser,
  getBlockedUsers,
  reportUser,
  getDeviceSessions,
  logoutOtherSessions,
  deleteAccount,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.get('/', getUsers);
router.get('/profile/:id', getUserById);
router.put('/profile', updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.put('/preferences', updatePreferences);
router.put('/change-password', changePassword);
router.get('/contacts', getContacts);
router.post('/contacts/:id', addContact);
router.delete('/contacts/:id', removeContact);
router.post('/block/:id', blockUser);
router.post('/unblock/:id', unblockUser);
router.get('/blocked', getBlockedUsers);
router.post('/report', reportUser);
router.get('/sessions', getDeviceSessions);
router.post('/sessions/logout-other', logoutOtherSessions);
router.delete('/account', deleteAccount);

export default router;
