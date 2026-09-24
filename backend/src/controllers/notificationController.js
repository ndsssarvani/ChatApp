import Notification from '../models/Notification.js';

// @desc    Get user notifications with optional category filtering
// @route   GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { recipient: req.user._id };

    if (category === 'messages') {
      filter.type = { $in: ['message', 'mention', 'group_invite', 'reaction'] };
    } else if (category === 'calls') {
      filter.type = { $in: ['call', 'missed_call'] };
    } else if (category === 'system') {
      filter.type = 'system';
    }

    const notifications = await Notification.find(filter)
      .populate('sender', 'name username avatar phoneNumber')
      .populate('conversation', 'groupName isGroup')
      .sort({ createdAt: -1 })
      .limit(100);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    const callsUnreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
      type: { $in: ['call', 'missed_call'] },
    });

    const messagesUnreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
      type: { $in: ['message', 'mention', 'group_invite', 'reaction'] },
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      callsUnreadCount,
      messagesUnreadCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete single notification
// @route   DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications
export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    res.status(200).json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
