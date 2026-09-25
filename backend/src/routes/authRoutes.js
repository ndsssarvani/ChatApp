import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  forgotPassword,
  validateResetToken,
  resetPassword,
  sendEmailOTP,
  verifyEmailOTP,
  googleAuth,
  getMe,
  logout,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Rate limiter for sensitive auth request endpoints (forgot password, OTP generation)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

const sendOtpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each IP to 5 OTP requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification code requests. Please wait a few minutes before trying again.',
  },
});

const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification attempts. Please try again later.',
  },
});

// Authentication Routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Password Reset Routes
router.post('/forgot-password', authLimiter, forgotPassword);
router.get('/reset-password/validate/:token', validateResetToken);
router.post('/reset-password', authLimiter, resetPassword);

// Email OTP Authentication Routes
router.post('/send-otp', sendOtpLimiter, sendEmailOTP);
router.post('/verify-otp', verifyOtpLimiter, verifyEmailOTP);

// Google OAuth Route
router.post('/google', googleAuth);

// Session Management
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;
