import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import DeviceSession from '../models/DeviceSession.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'chatapp_jwt_production_grade_secret_key_2026_xyz987', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const emailNormalized = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: emailNormalized });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email address' });
    }

    // Auto-generate username from email
    const baseUsername = emailNormalized.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    let username = baseUsername;
    let count = 1;
    while (await User.findOne({ username })) {
      username = `${baseUsername}${count++}`;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Initial avatar generator URL based on user name
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=51cf66,4dabf7,845ef7`;

    const user = await User.create({
      name,
      username,
      email: emailNormalized,
      passwordHash,
      avatar,
      fullName: name,
    });

    const token = generateToken(user._id);

    // Track initial device session
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    await DeviceSession.create({
      user: user._id,
      device: userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
      browser: userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : userAgent.includes('Safari') ? 'Safari' : 'Web Browser',
      os: userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'macOS' : userAgent.includes('Android') ? 'Android' : userAgent.includes('iPhone') ? 'iOS' : 'Unknown OS',
      ip: req.ip || req.connection.remoteAddress || '127.0.0.1',
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
    res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const emailOrUsername = email.toLowerCase().trim();
    // Allow login with either email or username
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
      browser: userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : userAgent.includes('Safari') ? 'Safari' : 'Web Browser',
      os: userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'macOS' : userAgent.includes('Android') ? 'Android' : userAgent.includes('iPhone') ? 'iOS' : 'Unknown OS',
      ip: req.ip || req.connection.remoteAddress || '127.0.0.1',
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
    res.status(500).json({ success: false, message: error.message || 'Server error during login' });
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

// @desc    Forgot Password - generate token
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    // Generate 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenHash = crypto.createHash('sha256').update(resetCode).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    console.log(`[Forgot Password] Code for ${email}: ${resetCode}`);

    res.status(200).json({
      success: true,
      message: 'Password reset code generated and sent.',
      devCode: process.env.NODE_ENV === 'development' ? resetCode : undefined,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset Password with code
// @route   POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email, code, and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const resetTokenHash = crypto.createHash('sha256').update(code).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now login.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Google OAuth Login / Register
// @route   POST /api/auth/google
export const googleAuth = async (req, res) => {
  try {
    const { credential, email, name, picture, googleId } = req.body;
    let userEmail = email;
    let userName = name;
    let userPicture = picture;
    let userGoogleId = googleId;

    // If Google GIS ID Token credential was provided, decode the payload
    if (credential) {
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
      } catch (e) {
        console.warn('[Google Auth] Could not decode credential token:', e.message);
      }
    }

    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'Google account email is required' });
    }

    const emailNormalized = userEmail.toLowerCase().trim();
    let user = await User.findOne({ email: emailNormalized });

    if (user) {
      // Existing user - update avatar if empty or provided by Google
      if (!user.avatar && userPicture) {
        user.avatar = userPicture;
      }
      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save();
    } else {
      // Create new user from Google profile
      const baseUsername = emailNormalized.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') || 'user';
      let username = baseUsername;
      let count = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${count++}`;
      }

      const randomPassword = crypto.randomBytes(16).toString('hex');
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
      ip: req.ip || req.connection.remoteAddress || '127.0.0.1',
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
    res.status(500).json({ success: false, message: error.message || 'Server error during Google authentication' });
  }
};

