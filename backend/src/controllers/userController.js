import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import DeviceSession from '../models/DeviceSession.js';
import Report from '../models/Report.js';

// @desc    Get all users (search/directory)
// @route   GET /api/users
export const getUsers = async (req, res) => {
  try {
    const search = req.query.search
      ? {
          $and: [
            { _id: { $ne: req.user._id } },
            {
              $or: [
                { name: { $regex: req.query.search, $options: 'i' } },
                { username: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } },
              ],
            },
          ],
        }
      : { _id: { $ne: req.user._id } };

    const users = await User.find(search).select('-passwordHash').limit(50);
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile by ID
// @route   GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      name,
      fullName,
      nickname,
      bio,
      phoneNumber,
      place,
      location,
      country,
      avatar,
      username,
    } = req.body;

    if (name) user.name = name;
    if (fullName !== undefined) user.fullName = fullName;
    if (nickname !== undefined) user.nickname = nickname;
    if (bio !== undefined) user.bio = bio;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (place !== undefined) user.place = place;
    if (location !== undefined) user.location = location;
    if (country !== undefined) user.country = country;
    if (avatar !== undefined) user.avatar = avatar;

    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username: username.toLowerCase().trim() });
      if (usernameExists && usernameExists._id.toString() !== user._id.toString()) {
        return res.status(400).json({ success: false, message: 'Username already taken' });
      }
      user.username = username.toLowerCase().trim();
    }

    const updatedUser = await user.save();
    const userResponse = updatedUser.toObject();
    delete userResponse.passwordHash;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload avatar
// @route   POST /api/users/avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-passwordHash');

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove avatar (reset to default)
// @route   DELETE /api/users/avatar
export const removeAvatar = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: '' },
      { new: true }
    ).select('-passwordHash');

    res.status(200).json({
      success: true,
      message: 'Avatar removed successfully',
      avatarUrl: '',
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update preferences / settings
// @route   PUT /api/users/preferences
export const updatePreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.preferences = {
      ...user.preferences,
      ...req.body,
    };

    await user.save();
    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.preferences,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get contacts
// @route   GET /api/users/contacts
export const getContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('contacts', '-passwordHash');
    res.status(200).json({ success: true, contacts: user.contacts || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add contact
// @route   POST /api/users/contacts/:id
export const addContact = async (req, res) => {
  try {
    const contactId = req.params.id;
    if (contactId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot add yourself as contact' });
    }

    const user = await User.findById(req.user._id);
    if (!user.contacts.includes(contactId)) {
      user.contacts.push(contactId);
      await user.save();
    }

    res.status(200).json({ success: true, message: 'Contact added', contacts: user.contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove contact
// @route   DELETE /api/users/contacts/:id
export const removeContact = async (req, res) => {
  try {
    const contactId = req.params.id;
    const user = await User.findById(req.user._id);
    user.contacts = user.contacts.filter((id) => id.toString() !== contactId);
    await user.save();

    res.status(200).json({ success: true, message: 'Contact removed', contacts: user.contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Block user
// @route   POST /api/users/block/:id
export const blockUser = async (req, res) => {
  try {
    const blockId = req.params.id;
    if (blockId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot block yourself' });
    }

    const user = await User.findById(req.user._id);
    const isAlreadyBlocked = user.blockedUsers.some((id) => id.toString() === blockId.toString());
    if (!isAlreadyBlocked) {
      user.blockedUsers.push(blockId);
      await user.save();
    }

    res.status(200).json({ success: true, message: 'User blocked', blockedUsers: user.blockedUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unblock user
// @route   POST /api/users/unblock/:id
export const unblockUser = async (req, res) => {
  try {
    const blockId = req.params.id;
    const user = await User.findById(req.user._id);
    user.blockedUsers = user.blockedUsers.filter((id) => id.toString() !== blockId.toString());
    await user.save();

    res.status(200).json({ success: true, message: 'User unblocked', blockedUsers: user.blockedUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get blocked users list
// @route   GET /api/users/blocked
export const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('blockedUsers', 'name username email avatar');
    res.status(200).json({ success: true, blockedUsers: user.blockedUsers || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Report user
// @route   POST /api/users/report
export const reportUser = async (req, res) => {
  try {
    const { reportedUserId, reason, details } = req.body;
    if (!reportedUserId || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide user ID and reason' });
    }

    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: reportedUserId,
      reason,
      details: details || '',
    });

    res.status(201).json({ success: true, message: 'Report submitted successfully', report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get active device sessions
// @route   GET /api/users/sessions
export const getDeviceSessions = async (req, res) => {
  try {
    const sessions = await DeviceSession.find({ user: req.user._id, isActive: true }).sort({ lastActive: -1 });
    res.status(200).json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Log out specific session or other sessions
// @route   POST /api/users/sessions/logout-other
export const logoutOtherSessions = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const currentToken = authHeader ? authHeader.split(' ')[1] : null;

    await DeviceSession.updateMany(
      { user: req.user._id, token: { $ne: currentToken } },
      { isActive: false }
    );

    res.status(200).json({ success: true, message: 'Other sessions logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete account
// @route   DELETE /api/users/account
export const deleteAccount = async (req, res) => {
  try {
    await DeviceSession.deleteMany({ user: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.status(200).json({ success: true, message: 'Account deleted permanently' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
