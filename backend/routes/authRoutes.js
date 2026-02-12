import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { generateToken } from '../utils/generateToken.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['Student', 'Teacher', 'Club Coordinator']).withMessage('Invalid role'),
  body('studentId').optional().trim(),
  body('department').optional().trim(),
  body('year').optional().isIn(['1st Year', '2nd Year', '3rd Year', '4th Year']).withMessage('Invalid year')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, studentId, department, year } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Check if studentId already exists (if provided)
    if (studentId) {
      const studentIdExists = await User.findOne({ studentId });
      if (studentIdExists) {
        return res.status(400).json({ message: 'Student ID already exists' });
      }
    }

    // Find or create role
    let userRole = await Role.findOne({ name: role });
    if (!userRole) {
      userRole = await Role.create({ name: role });
    }

    // Generate unique coordinatorId for Club Coordinators
    let coordinatorId = undefined;
    if (role === 'Club Coordinator') {
      let isUnique = false;
      while (!isUnique) {
        coordinatorId = `CC${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const exists = await User.findOne({ coordinatorId });
        if (!exists) {
          isUnique = true;
        }
      }
    }

    // Create user - only include year if role is Student or Club Coordinator
    const userData = {
      name,
      email,
      password,
      role: userRole._id,
      department: department || undefined
    };

    if (role === 'Student') {
      userData.studentId = studentId || undefined;
      userData.year = year || undefined;
    } else if (role === 'Club Coordinator') {
      userData.coordinatorId = coordinatorId;
      userData.year = year || undefined;
    }
    // Teacher role - no studentId, coordinatorId, or year

    const user = await User.create(userData);

    // Populate role for response
    await user.populate('role');

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      studentId: user.studentId,
      coordinatorId: user.coordinatorId,
      department: user.department,
      year: user.year,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check for user and include password for comparison
    const user = await User.findOne({ email }).select('+password').populate('role');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'User account is deactivated' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      studentId: user.studentId,
      coordinatorId: user.coordinatorId,
      department: user.department,
      year: user.year,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('role');
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      studentId: user.studentId,
      coordinatorId: user.coordinatorId,
      department: user.department,
      year: user.year,
      lastLogin: user.lastLogin
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
