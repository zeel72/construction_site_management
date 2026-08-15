/**
 * Auth Controller
 */
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    const error = new Error('User already exists');
    error.statusCode = 400;
    throw error;
  }

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: role || 'viewer', // Default to viewer if not provided
  });

  if (user) {
    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } else {
    const error = new Error('Invalid user data');
    error.statusCode = 400;
    throw error;
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } else {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }
};

// @desc    Get logged in user info
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  // req.user is already set by the auth middleware
  const user = await User.findById(req.user.id);
  
  if (!user) {
     const error = new Error('User not found');
     error.statusCode = 404;
     throw error;
  }
  
  res.json({
    success: true,
    user,
  });
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(currentPassword))) {
    const error = new Error('Incorrect current password');
    error.statusCode = 401;
    throw error;
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password updated successfully',
    token: generateToken(user._id),
  });
};
