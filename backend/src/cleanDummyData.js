import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';
import Notification from './models/Notification.js';

dotenv.config();

const cleanDummyData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Clean] Connected to MongoDB Atlas');

    const dummyEmails = [
      'sarvani@example.com',
      'alex@example.com',
      'maria@example.com',
      'jenny@example.com'
    ];

    // Find dummy users
    const dummyUsers = await User.find({ email: { $in: dummyEmails } });
    const dummyUserIds = dummyUsers.map(u => u._id);
    console.log(`[Clean] Found ${dummyUsers.length} dummy users:`, dummyUsers.map(u => u.email));

    // Delete dummy users
    if (dummyUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: dummyUserIds } });
      console.log(`[Clean] Removed ${dummyUserIds.length} dummy users`);

      // Remove dummy user IDs from contacts list of any real users
      await User.updateMany(
        {},
        { $pull: { contacts: { $in: dummyUserIds }, blockedUsers: { $in: dummyUserIds } } }
      );
      console.log('[Clean] Cleaned contact references');
    }

    // Find dummy conversations (conversations with only dummy users or named 'Design & Engineering Core')
    const dummyConvs = await Conversation.find({
      $or: [
        { groupName: 'Design & Engineering Core' },
        { participants: { $not: { $elemMatch: { $nin: dummyUserIds } } } }
      ]
    });
    const dummyConvIds = dummyConvs.map(c => c._id);
    console.log(`[Clean] Found ${dummyConvs.length} dummy conversations`);

    if (dummyConvIds.length > 0) {
      await Conversation.deleteMany({ _id: { $in: dummyConvIds } });
      console.log(`[Clean] Removed ${dummyConvIds.length} dummy conversations`);
    }

    // Delete dummy messages
    const deleteMsgsRes = await Message.deleteMany({
      $or: [
        { sender: { $in: dummyUserIds } },
        { receiver: { $in: dummyUserIds } },
        { conversationId: { $in: dummyConvIds } }
      ]
    });
    console.log(`[Clean] Removed ${deleteMsgsRes.deletedCount} dummy messages`);

    // Clean notifications involving dummy users
    const deleteNotifRes = await Notification.deleteMany({
      $or: [
        { user: { $in: dummyUserIds } },
        { sender: { $in: dummyUserIds } }
      ]
    });
    console.log(`[Clean] Removed ${deleteNotifRes.deletedCount} dummy notifications`);

    // Print remaining active database status
    const remainingUsers = await User.find({}, { name: 1, email: 1 });
    const remainingConvs = await Conversation.find({}, { isGroup: 1, groupName: 1 });
    const remainingMsgs = await Message.find({}, { text: 1 });

    console.log('\n--- REMAINING CLEAN PRODUCTION DATA ---');
    console.log('Real Users:', remainingUsers);
    console.log('Real Conversations:', remainingConvs);
    console.log('Real Messages Count:', remainingMsgs.length);

    process.exit(0);
  } catch (err) {
    console.error('[Clean] Error cleaning dummy data:', err);
    process.exit(1);
  }
};

cleanDummyData();
