import mongoose from 'mongoose';

const emailOTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['login', 'verify_email', 'reset_password'],
      default: 'login',
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: '10m' }, // MongoDB TTL auto-cleans after 10m
    },
  },
  {
    timestamps: true,
  }
);

const EmailOTP = mongoose.model('EmailOTP', emailOTPSchema);
export default EmailOTP;
