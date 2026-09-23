import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// @desc    Get dashboard overview statistics
// @route   GET /api/analytics/overview
export const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    // Total conversations
    const totalConversations = await Conversation.countDocuments({
      participants: userId,
    });

    // Total unread messages
    const unreadMessages = await Message.countDocuments({
      sender: { $ne: userId },
      readBy: { $ne: userId },
      deletedFor: { $ne: userId },
    });

    // Total messages sent by user
    const messagesSent = await Message.countDocuments({
      sender: userId,
    });

    // Total messages received by user
    const messagesReceived = await Message.countDocuments({
      sender: { $ne: userId },
      deletedFor: { $ne: userId },
    });

    // Active contacts / online count
    const userConvs = await Conversation.find({ participants: userId }).select('participants');
    const participantIds = new Set();
    userConvs.forEach((c) => {
      c.participants.forEach((p) => {
        if (p.toString() !== userId.toString()) {
          participantIds.add(p.toString());
        }
      });
    });

    const onlineContactsCount = await User.countDocuments({
      _id: { $in: Array.from(participantIds) },
      isOnline: true,
    });

    // Recent 5 active conversations
    const recentConversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name avatar isOnline')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalConversations,
        unreadMessages,
        messagesSent,
        messagesReceived,
        totalContacts: participantIds.size,
        onlineContactsCount,
        recentConversations,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed chat analytics (7-day activity, peak hours)
// @route   GET /api/analytics/details
export const getChatAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Aggregate messages sent per day over last 7 days
    const dailyActivity = await Message.aggregate([
      {
        $match: {
          sender: userId,
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build complete 7-day array
    const resultDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const found = dailyActivity.find((item) => item._id === dateStr);
      resultDays.push({
        date: dateStr,
        day: dayName,
        count: found ? found.count : 0,
      });
    }

    const totalSent = await Message.countDocuments({ sender: userId });
    const totalReceived = await Message.countDocuments({
      sender: { $ne: userId },
      deletedFor: { $ne: userId },
    });
    const mediaShared = await Message.countDocuments({
      sender: userId,
      'attachments.0': { $exists: true },
    });

    res.status(200).json({
      success: true,
      analytics: {
        dailyActivity: resultDays,
        totalSent,
        totalReceived,
        mediaShared,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
