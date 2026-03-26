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

const getCurrentSemester = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 8) {
    return 'even';
  }
  return 'odd';
};

const getNextSemesterAndYear = (semester, year) => {
  let nextSemester = semester + 1;
  let nextYear = year;

  if (nextSemester > 8) {
    nextSemester = 1;
    if (year === '1st Year') nextYear = '2nd Year';
    else if (year === '2nd Year') nextYear = '3rd Year';
    else if (year === '3rd Year') nextYear = '4th Year';
    else if (year === '4th Year') nextYear = '4th Year';
  }

  return { nextSemester, nextYear };
};

const performSemesterSync = async (user) => {
  if (!user) return;

  const now = new Date();
  const prettySession = getCurrentSemester();

  // set default semester if missing
  if (!user.semester) {
    if (user.year === '1st Year') user.semester = 2;
    else if (user.year === '2nd Year') user.semester = 4;
    else if (user.year === '3rd Year') user.semester = 6;
    else if (user.year === '4th Year') user.semester = 8;
    else user.semester = prettySession === 'even' ? 2 : 1;
    user.semesterLastUpdated = now;
  }

  if (!user.semesterLastUpdated) {
    user.semesterLastUpdated = now;
  }

  const lastUpdated = new Date(user.semesterLastUpdated);
  let monthsElapsed = (now.getFullYear() - lastUpdated.getFullYear()) * 12 + (now.getMonth() - lastUpdated.getMonth());

  // If the current month has not reached the same day in existing count, subtract partial month
  if (now.getDate() < lastUpdated.getDate()) {
    monthsElapsed -= 1;
  }

  const cycles = Math.floor(monthsElapsed / 6);
  if (cycles > 0) {
    let currentSemester = user.semester || 1;
    let currentYear = user.year || '1st Year';

    for (let i = 0; i < cycles; i++) {
      const { nextSemester, nextYear } = getNextSemesterAndYear(currentSemester, currentYear);
      currentSemester = nextSemester;
      currentYear = nextYear;
    }

    user.semester = currentSemester;
    user.year = currentYear;
    user.semesterLastUpdated = now;
  }

  await user.save();
};

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

    // Derive semester from registration month (even/odd), with year mapping
    let computedSemester;
    if (year === '1st Year') {
      computedSemester = getCurrentSemester() === 'even' ? 2 : 1;
    } else if (year === '2nd Year') {
      computedSemester = getCurrentSemester() === 'even' ? 4 : 3;
    } else if (year === '3rd Year') {
      computedSemester = getCurrentSemester() === 'even' ? 6 : 5;
    } else if (year === '4th Year') {
      computedSemester = getCurrentSemester() === 'even' ? 8 : 7;
    } else {
      computedSemester = getCurrentSemester() === 'even' ? 2 : 1;
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

    const now = new Date();
    const userData = {
      name,
      email,
      password,
      role: userRole._id,
      department: department || undefined,
      studentId: studentId || undefined,
      year: year || undefined,
      semester: computedSemester,
      semesterLastUpdated: now
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
      semester: user.semester,
      semesterTerm: user.semester % 2 === 0 ? 'even' : 'odd',
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

    // Sync semester/year before responding
    await performSemesterSync(user);

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

// @route   GET /api/auth/created-users
// @desc    Get all users created by super admin (for history display)
// @access  Private (Super Admin only)
router.get('/created-users', protect, authorize('Super Admin'), async (req, res) => {
  try {
    // Get roles to filter
    const teacherRole = await Role.findOne({ name: 'Teacher' });
    const coordinatorRole = await Role.findOne({ name: 'Club Coordinator' });
    const librarianRole = await Role.findOne({ name: 'Librarian' });
    
    const roleIds = [teacherRole?._id, coordinatorRole?._id, librarianRole?._id].filter(Boolean);

    const users = await User.find({ role: { $in: roleIds } })
      .populate('role', 'name')
      .select('name email department createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role?.name || 'N/A',
      department: user.department || 'N/A',
      createdAt: new Date(user.createdAt).toLocaleString()
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Get created users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/auth/user/:id
// @desc    Delete a user (Super Admin only)
// @access  Private (Super Admin only)
router.delete('/user/:id', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).populate('role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting Super Admin
    if (user.role?.name === 'Super Admin') {
      return res.status(403).json({ message: 'Cannot delete Super Admin' });
    }

    await User.findByIdAndDelete(id);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    let user = await User.findById(req.user._id).populate('role');

    // Sync semester/year if needed based on elapsed time
    await performSemesterSync(user);

    user = await User.findById(req.user._id).populate('role');

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      studentId: user.studentId,
      coordinatorId: user.coordinatorId,
      department: user.department,
      year: user.year,
      semester: user.semester,
      semesterTerm: user.semester % 2 === 0 ? 'even' : 'odd',
      lastLogin: user.lastLogin
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
