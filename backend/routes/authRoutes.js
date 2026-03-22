import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { generateToken } from '../utils/generateToken.js';
import { sendEmail } from '../utils/sendEmail.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

const SUPER_ADMIN_EMAIL = 'superadmin@iiitt.ac.in';
const SUPER_ADMIN_PASSWORD = 'coder2324';

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  // role will be enforced as Student for public sign-up
  body('role').optional().isString(),
  body('studentId').optional().trim(),
  body('department').optional().trim(),
  // Treat empty string as missing so roles that don't use `year` (e.g. Librarian) won't fail validation
  body('year').optional({ checkFalsy: true }).isIn(['1st Year', '2nd Year', '3rd Year', '4th Year']).withMessage('Invalid year')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role = 'Student', studentId, department, year } = req.body;

    // Only students can self-register
    if (role !== 'Student') {
      return res.status(400).json({ message: 'Self registration is only available for Students' });
    }

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

    // Find or create student role
    let userRole = await Role.findOne({ name: 'Student' });
    if (!userRole) {
      userRole = await Role.create({ name: 'Student' });
    }

    const userData = {
      name,
      email,
      password,
      role: userRole._id,
      department: department || undefined,
      studentId: studentId || undefined,
      year: year || undefined
    };

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

    // Super Admin hard-coded login provision
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
      let superAdminRole = await Role.findOne({ name: 'Super Admin' });
      if (!superAdminRole) {
        superAdminRole = await Role.create({ name: 'Super Admin' });
      }

      let superAdminUser = await User.findOne({ email }).select('+password').populate('role');

      if (!superAdminUser) {
        superAdminUser = await User.create({
          name: 'Super Admin',
          email,
          password,
          role: superAdminRole._id
        });
        await superAdminUser.populate('role');
      } else {
        if (superAdminUser.role?.name !== 'Super Admin') {
          superAdminUser.role = superAdminRole._id;
          await superAdminUser.save();
          await superAdminUser.populate('role');
        }
      }

      superAdminUser.lastLogin = new Date();
      await superAdminUser.save();

      return res.json({
        _id: superAdminUser._id,
        name: superAdminUser.name,
        email: superAdminUser.email,
        role: 'Super Admin',
        token: generateToken(superAdminUser._id)
      });
    }

    // Check for regular user and include password for comparison
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

// @route   POST /api/auth/create-user
// @desc    Super Admin creates teacher/coordinator/librarian users
// @access  Private (Super Admin only)
router.post('/create-user', protect, authorize('Super Admin'), [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['Teacher', 'Club Coordinator', 'Librarian']).withMessage('Invalid role'),
  body('name').optional().trim()
], async (req, res) => {
  try {
    console.log('Create-user request:', {
      userId: req.user?._id,
      userName: req.user?.name,
      userRole: req.user?.role?.name,
      body: req.body
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, department } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    let userRole = await Role.findOne({ name: role });
    if (!userRole) {
      userRole = await Role.create({ name: role });
    }

    let coordinatorId;
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

    const newUserData = {
      name: name || `${role} User`,
      email,
      password,
      role: userRole._id,
      coordinatorId: coordinatorId || undefined,
      department: role === 'Teacher' && department ? department : undefined
    };

    const newUser = await User.create(newUserData);
    await newUser.populate('role');

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?email=${encodeURIComponent(email)}`;

    try {
      const emailResult = await sendEmail({
        to: email,
        subject: 'Academix account created',
        text: `Your account as ${role} has been created. Use this link to reset password: ${resetLink}`,
        html: `<p>Your account as <strong>${role}</strong> has been created.</p><p>Click the link to set your password: <a href="${resetLink}">${resetLink}</a></p>`
      });
      console.info('Email sent:', emailResult);
    } catch (emailError) {
      console.warn('Could not send email to user', email, emailError);
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role.name,
        coordinatorId: newUser.coordinatorId,
        department: newUser.department
      },
      resetLink,
      note: 'Send this link to the user for password reset'
    });
  } catch (error) {
    console.error('Create user error:', error);
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
