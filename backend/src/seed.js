import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';
import Notification from './models/Notification.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chatapp');
    console.log('[Seed] Connected to database');

    // Clear existing collections
    await User.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    console.log('[Seed] Cleared existing data');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // Create demo users
    const users = await User.create([
      {
        name: 'Sarvani Patel',
        username: 'sarvani',
        email: 'sarvani@example.com',
        passwordHash,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
        bio: 'Senior UX Designer & Tech Enthusiast ✨',
        fullName: 'Sarvani Patel',
        nickname: 'Sarv',
        phoneNumber: '+1 555-234-5678',
        place: 'San Francisco',
        location: 'California, USA',
        country: 'United States',
        isOnline: true,
      },
      {
        name: 'Alex Johnson',
        username: 'alexj',
        email: 'alex@example.com',
        passwordHash,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
        bio: 'Full Stack Developer | Building cool web apps 🚀',
        fullName: 'Alexander Johnson',
        nickname: 'Alex',
        phoneNumber: '+1 555-876-5432',
        place: 'New York',
        location: 'New York, USA',
        country: 'United States',
        isOnline: false,
      },
      {
        name: 'Maria Rodriguez',
        username: 'maria_r',
        email: 'maria@example.com',
        passwordHash,
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
        bio: 'Creative Producer & Music Lover 🎧',
        fullName: 'Maria Fernanda Rodriguez',
        nickname: 'MFBeats',
        phoneNumber: '+1 555-123-4567',
        place: 'Los Angeles',
        location: 'California, USA',
        country: 'United States',
        isOnline: true,
      },
      {
        name: 'Jenny Soldado',
        username: 'jenny',
        email: 'jenny@example.com',
        passwordHash,
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
        bio: 'Product Manager @ CloudSync 📱',
        fullName: 'Jenny Soldado',
        nickname: 'Jen',
        phoneNumber: '+1 555-345-6789',
        place: 'Austin',
        location: 'Texas, USA',
        country: 'United States',
        isOnline: true,
      },
    ]);

    const [sarvani, alex, maria, jenny] = users;

    // Set up mutual contacts
    sarvani.contacts = [alex._id, maria._id, jenny._id];
    alex.contacts = [sarvani._id, maria._id];
    maria.contacts = [sarvani._id, alex._id];
    jenny.contacts = [sarvani._id];

    await sarvani.save();
    await alex.save();
    await maria.save();
    await jenny.save();

    // Create 1-on-1 conversation between Sarvani and Alex
    const conv1 = await Conversation.create({
      participants: [sarvani._id, alex._id],
      isGroup: false,
    });

    const m1 = await Message.create({
      conversationId: conv1._id,
      sender: alex._id,
      receiver: sarvani._id,
      text: 'Hey Sarvani, welcome to Chatify! How is the new release looking?',
      readBy: [alex._id, sarvani._id],
      deliveredTo: [alex._id, sarvani._id],
    });

    const m2 = await Message.create({
      conversationId: conv1._id,
      sender: sarvani._id,
      receiver: alex._id,
      text: 'Hi Alex! Everything is running super smoothly. Real-time messaging and notifications work great!',
      readBy: [sarvani._id],
      deliveredTo: [sarvani._id, alex._id],
    });

    conv1.lastMessage = m2._id;
    await conv1.save();

    // Create Group Conversation
    const groupConv = await Conversation.create({
      participants: [sarvani._id, alex._id, maria._id, jenny._id],
      isGroup: true,
      groupName: 'Design & Engineering Core',
      groupDescription: 'Collaborative channel for Chatify design system and real-time backend updates.',
      groupAvatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&h=150&fit=crop',
      admins: [sarvani._id],
    });

    const gm1 = await Message.create({
      conversationId: groupConv._id,
      sender: sarvani._id,
      text: 'Hello team! Welcome to the official Chatify core group.',
      readBy: [sarvani._id],
      deliveredTo: [sarvani._id, alex._id, maria._id, jenny._id],
    });

    const gm2 = await Message.create({
      conversationId: groupConv._id,
      sender: maria._id,
      text: 'Love the new interface! The animations and dark mode feel very crisp.',
      readBy: [maria._id, sarvani._id],
      deliveredTo: [sarvani._id, alex._id, maria._id, jenny._id],
    });

    groupConv.lastMessage = gm2._id;
    await groupConv.save();

    // Create sample notification
    await Notification.create({
      recipient: sarvani._id,
      sender: alex._id,
      type: 'message',
      message: 'Alex Johnson sent you a direct message',
      conversation: conv1._id,
      isRead: false,
    });

    console.log('[Seed] Database seeded successfully!');
    console.log('--- Demo Accounts (Password for all: password123) ---');
    console.log('1) Sarvani Patel: sarvani@example.com');
    console.log('2) Alex Johnson: alex@example.com');
    console.log('3) Maria Rodriguez: maria@example.com');
    console.log('4) Jenny Soldado: jenny@example.com');

    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
