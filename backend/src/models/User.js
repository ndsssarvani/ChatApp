import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: 'Hey there! I am using Chatify.',
      trim: true,
    },
    fullName: {
      type: String,
      default: '',
      trim: true,
    },
    nickname: {
      type: String,
      default: '',
      trim: true,
    },
    phoneNumber: {
      type: String,
      default: '',
      trim: true,
    },
    place: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    country: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      default: 'Available',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
      language: { type: String, default: 'en' },
      profileLock: { type: Boolean, default: false },
      notificationSound: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      doNotDisturb: { type: Boolean, default: false },
      chatWallpaper: { type: String, default: 'default' },
      fontSize: { type: String, default: 'medium' },
      privacyLastSeen: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
      privacyOnline: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
      privacyReadReceipts: { type: Boolean, default: true },
      privacyProfilePhoto: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
    },
    authProviders: {
      password: { type: Boolean, default: true },
      google: { type: Boolean, default: false },
      emailOtp: { type: Boolean, default: true },
    },
    googleId: {
      type: String,
      sparse: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: true,
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Match user-entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Index for search optimization
userSchema.index({ name: 'text', username: 'text', email: 'text' });

const User = mongoose.model('User', userSchema);
export default User;
