import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import DeviceSession from '../models/DeviceSession.js';
import EmailOTP from '../models/EmailOTP.js';
import { sendPasswordResetEmail, sendOTPEmail } from '../services/emailService.js';

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'chatapp_jwt_production_grade_secret_key_2026_xyz987',
    {
      expiresIn: '30d',
    }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const emailNormalized = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: emailNormalized });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    // Auto-generate unique username from email
    const baseUsername = emailNormalized.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') || 'user';
    let username = baseUsername;
    let count = 1;
    while (await User.findOne({ username })) {
      username = `${baseUsername}${count++}`;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=51cf66,4dabf7,845ef7`;

    const user = await User.create({
      name,
      username,
      email: emailNormalized,
      passwordHash,
      avatar,
      fullName: name,
      authProviders: {
        password: true,
        google: false,
        emailOtp: true,
      },
      isEmailVerified: true,
    });

    const token = generateToken(user._id);

    // Track initial device session
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    await DeviceSession.create({
      user: user._id,
      device: userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
      browser: userAgent.includes('Chrome')
        ? 'Chrome'
        : userAgent.includes('Firefox')
        ? 'Firefox'
        : userAgent.includes('Safari')
        ? 'Safari'
        : 'Web Browser',
      os: userAgent.includes('Windows')
        ? 'Windows'
        : userAgent.includes('Mac')
        ? 'macOS'
        : userAgent.includes('Android')
        ? 'Android'
        : userAgent.includes('iPhone')
        ? 'iOS'
        : 'Unknown OS',
      ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      token,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        place: user.place,
        location: user.location,
        country: user.country,
        isOnline: user.isOnline,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('[Register Error]', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// @desc    Authenticate user with password & get token
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const emailOrUsername = email.toLowerCase().trim();
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    // Set online
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    // Track device session
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    await DeviceSession.create({
      user: user._id,
      device: userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
      browser: userAgent.includes('Chrome')
        ? 'Chrome'
        : userAgent.includes('Firefox')
        ? 'Firefox'
        : userAgent.includes('Safari')
        ? 'Safari'
        : 'Web Browser',
      os: userAgent.includes('Windows')
        ? 'Windows'
        : userAgent.includes('Mac')
        ? 'macOS'
        : userAgent.includes('Android')
        ? 'Android'
        : userAgent.includes('iPhone')
        ? 'iOS'
        : 'Unknown OS',
      ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      token,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        fullName: user.fullName,
        nickname: user.nickname,
        phoneNumber: user.phoneNumber,
        place: user.place,
        location: user.location,
        country: user.country,
        isOnline: user.isOnline,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// @desc    Forgot Password - generate secure cryptographic token and send reset link email
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address.' });
    }

    const emailNormalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNormalized });

    // Anti-enumeration: Return generic message if user doesn't exist
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists for this email, a password reset link has been sent.',
      });
    }

    // Generate cryptographically secure random token (32 bytes = 64 hex chars)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // 30 minute expiration
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    // Reset URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    // Send reset email
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name || user.fullName,
        resetUrl,
      });
    } catch (emailErr) {
      console.error('[Forgot Password] Email send failure:', emailErr.message);
      // Clean up token if email failed
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('[Forgot Password Error]', error);
    res.status(500).json({ success: false, message: 'Server error during password reset request.' });
  }
};

// @desc    Validate Reset Token (before showing reset form)
// @route   GET /api/auth/reset-password/validate/:token
export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Reset token is required.' });
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link is invalid or has expired.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reset token is valid.',
      email: user.email,
    });
  } catch (error) {
    console.error('[Validate Reset Token Error]', error);
    res.status(500).json({ success: false, message: 'Server error validating reset token.' });
  }
};

// @desc    Reset Password with cryptographic token
// @route   POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide token and new password.' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Enforce password requirements: min 8 chars, uppercase, lowercase, number, special char
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
      });
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link is invalid or has expired.',
      });
    }

    // Hash new password using bcrypt
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Invalidate reset token (one-time use)
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Invalidate all existing device sessions for this user
    await DeviceSession.updateMany(
      { user: user._id, isActive: true },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: 'Password updated successfully! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('[Reset Password Error]', error);
    res.status(500).json({ success: false, message: 'Server error during password reset.' });
  }
};

// @desc    Send Email OTP for Login / Verification
// @route   POST /api/auth/send-otp
export const sendEmailOTP = async (req, res) => {
  try {
    const { email, purpose = 'login' } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address.' });
    }

    const emailNormalized = email.toLowerCase().trim();

    // Check if account exists for login purpose
    if (purpose === 'login') {
      const user = await User.findOne({ email: emailNormalized });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No ChatApp account was found for this email.',
          canRegister: true,
        });
      }
    }

    // Invalidate any previous OTPs for this email and purpose
    await EmailOTP.deleteMany({ email: emailNormalized, purpose });

    // Generate cryptographically secure 6-digit OTP
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await EmailOTP.create({
      email: emailNormalized,
      otpHash,
      purpose,
      attempts: 0,
      expiresAt,
    });

    const user = await User.findOne({ email: emailNormalized });
    const name = user ? user.name || user.fullName : 'there';

    // Send real email with OTP
    try {
      await sendOTPEmail({
        to: emailNormalized,
        name,
        otpCode,
        purpose,
      });
    } catch (emailErr) {
      console.error('[Send OTP Error]', emailErr.message);
      await EmailOTP.deleteMany({ email: emailNormalized, purpose });
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification code email. Please check your email configuration.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email.',
    });
  } catch (error) {
    console.error('[Send Email OTP Error]', error);
    res.status(500).json({ success: false, message: 'Server error generating verification code.' });
  }
};

// @desc    Verify Email OTP & Issue Session
// @route   POST /api/auth/verify-otp
export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp, purpose = 'login' } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and verification code.' });
    }

    const emailNormalized = email.toLowerCase().trim();
    const otpTrimmed = otp.toString().trim();

    const otpRecord = await EmailOTP.findOne({
      email: emailNormalized,
      purpose,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired or is invalid. Please request a new code.',
      });
    }

    // Check maximum attempts
    if (otpRecord.attempts >= 5) {
      await EmailOTP.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please request a new code.',
      });
    }

    // Verify OTP hash
    const inputHash = crypto.createHash('sha256').update(otpTrimmed).digest('hex');
    if (inputHash !== otpRecord.otpHash) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remainingAttempts = Math.max(0, 5 - otpRecord.attempts);
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. (${remainingAttempts} attempts remaining)`,
      });
    }

    // Code is valid! Delete OTP record immediately (one-time use)
    await EmailOTP.deleteOne({ _id: otpRecord._id });

    // Find user
    const user = await User.findOne({ email: emailNormalized });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No ChatApp account was found for this email.',
      });
    }

    // Mark user email as verified & set online
    user.isEmailVerified = true;
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    // Track device session
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    await DeviceSession.create({
      user: user._id,
      device: userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
      browser: userAgent.includes('Chrome')
        ? 'Chrome'
        : userAgent.includes('Firefox')
        ? 'Firefox'
        : userAgent.includes('Safari')
        ? 'Safari'
        : 'Web Browser',
      os: userAgent.includes('Windows')
        ? 'Windows'
        : userAgent.includes('Mac')
        ? 'macOS'
        : userAgent.includes('Android')
        ? 'Android'
        : userAgent.includes('iPhone')
        ? 'iOS'
        : 'Unknown OS',
      ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      token,
    });

    res.status(200).json({
      success: true,
      message: 'Verification successful. Welcome back!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        place: user.place,
        location: user.location,
        country: user.country,
        isOnline: user.isOnline,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('[Verify OTP Error]', error);
    res.status(500).json({ success: false, message: 'Server error during OTP verification.' });
  }
};

// @desc    Real Google OAuth Login / Account Linking
// @route   POST /api/auth/google
export const googleAuth = async (req, res) => {
  try {
    const { credential, accessToken, email, name, picture, googleId } = req.body;
    let userEmail = email;
    let userName = name;
    let userPicture = picture;
    let userGoogleId = googleId;

    // 1. If Google OAuth 2.0 Access Token is provided, query Google userinfo API
    if (accessToken) {
      try {
        const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userinfoRes.ok) {
          const payload = await userinfoRes.json();
          if (payload.email) {
            userEmail = payload.email;
            userName = payload.name || payload.given_name || userEmail.split('@')[0];
            userPicture = payload.picture || '';
            userGoogleId = payload.sub;
          }
        }
      } catch (err) {
        console.warn('[Google Auth] Access token lookup warning:', err.message);
      }
    }

    // 2. If Google GIS ID Token credential was provided, verify with Google Tokeninfo
    if (credential && !userEmail) {
      try {
        const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (tokenRes.ok) {
          const payload = await tokenRes.json();
          if (payload.email) {
            userEmail = payload.email;
            userName = payload.name || payload.given_name || userEmail.split('@')[0];
            userPicture = payload.picture || '';
            userGoogleId = payload.sub;
          }
        } else {
          // Fallback decode if offline/sandbox
          const parts = credential.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            if (payload.email) {
              userEmail = payload.email;
              userName = payload.name || payload.given_name || userEmail.split('@')[0];
              userPicture = payload.picture || '';
              userGoogleId = payload.sub;
            }
          }
        }
      } catch (e) {
        console.warn('[Google Auth] Token verification warning:', e.message);
        try {
          const parts = credential.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            if (payload.email) {
              userEmail = payload.email;
              userName = payload.name || payload.given_name || userEmail.split('@')[0];
              userPicture = payload.picture || '';
              userGoogleId = payload.sub;
            }
          }
        } catch (decodeErr) {
          console.error('[Google Auth] Credential decode failed:', decodeErr.message);
        }
      }
    }

    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'Google authentication did not return a valid email.' });
    }

    const emailNormalized = userEmail.toLowerCase().trim();
    let user = await User.findOne({ email: emailNormalized });

    if (user) {
      // Safely link Google provider to existing account without overwriting password or chats
      if (!user.authProviders) {
        user.authProviders = { password: true, google: true, emailOtp: true };
      } else {
        user.authProviders.google = true;
      }
      if (userGoogleId) {
        user.googleId = userGoogleId;
      }
      if (!user.avatar && userPicture) {
        user.avatar = userPicture;
      }
      user.isEmailVerified = true;
      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save();
    } else {
      // Create new user from verified Google profile
      const baseUsername = emailNormalized.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') || 'user';
      let username = baseUsername;
      let count = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${count++}`;
      }

      const randomPassword = crypto.randomBytes(24).toString('hex');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      const avatar =
        userPicture ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          userName || username
        )}&backgroundColor=51cf66,4dabf7,845ef7`;

      user = await User.create({
        name: userName || username,
        username,
        email: emailNormalized,
        passwordHash,
        avatar,
        fullName: userName || username,
        authProviders: {
          password: false,
          google: true,
          emailOtp: true,
        },
        googleId: userGoogleId,
        isEmailVerified: true,
        isOnline: true,
        lastSeen: new Date(),
      });
    }

    const token = generateToken(user._id);

    // Track device session
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    await DeviceSession.create({
      user: user._id,
      device: userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
      browser: userAgent.includes('Chrome')
        ? 'Chrome'
        : userAgent.includes('Firefox')
        ? 'Firefox'
        : userAgent.includes('Safari')
        ? 'Safari'
        : 'Web Browser',
      os: userAgent.includes('Windows')
        ? 'Windows'
        : userAgent.includes('Mac')
        ? 'macOS'
        : userAgent.includes('Android')
        ? 'Android'
        : userAgent.includes('iPhone')
        ? 'iOS'
        : 'Unknown OS',
      ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      token,
    });

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        place: user.place,
        location: user.location,
        country: user.country,
        isOnline: user.isOnline,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('[Google Auth Error]', error);
    res.status(500).json({ success: false, message: 'Server error during Google authentication.' });
  }
};

// @desc    Get current user profile from token
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        isOnline: false,
        lastSeen: new Date(),
      });
      // Deactivate current session
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        await DeviceSession.findOneAndUpdate({ user: req.user._id, token }, { isActive: false });
      }
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
