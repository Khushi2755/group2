import express from 'express';
import { body, validationResult } from 'express-validator';
import Club from '../models/Club.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Role from '../models/Role.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/clubs
// @desc    Get all clubs
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const clubs = await Club.find()
      .populate('coordinator', 'name email coordinatorId')
      .populate('members', 'name email studentId')
      .sort({ createdAt: -1 });
    res.json(clubs);
  } catch (error) {
    console.error('Get clubs error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/clubs/:id
// @desc    Get single club
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('coordinator', 'name email coordinatorId')
      .populate('members', 'name email studentId');
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    res.json(club);
  } catch (error) {
    console.error('Get club error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/clubs
// @desc    Create a new club
// @access  Private (Club Coordinator only)
router.post('/', [
  protect,
  authorize('Club Coordinator'),
  body('name').trim().notEmpty().withMessage('Club name is required'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    // Check if club already exists
    const clubExists = await Club.findOne({ name });
    if (clubExists) {
      return res.status(400).json({ message: 'Club with this name already exists' });
    }

    const club = await Club.create({
      name,
      description: description || '',
      coordinator: req.user._id,
      members: []
    });

    await club.populate('coordinator', 'name email coordinatorId');

    // Notify all students about the new club
    try {
      const studentRole = await Role.findOne({ name: 'Student' });
      if (studentRole) {
        const students = await User.find({ role: studentRole._id }).select('_id').lean();
        const notifications = students.map((s) => ({
          user: s._id,
          type: 'new_club',
          title: 'New club added',
          message: `"${name}" is now available. Enroll from your dashboard to join.`,
          club: club._id
        }));
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    } catch (notifErr) {
      console.error('Create club notifications error:', notifErr.message);
    }

    res.status(201).json(club);
  } catch (error) {
    console.error('Create club error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/clubs/:id
// @desc    Update a club
// @access  Private (Club Coordinator - owner only)
router.put('/:id', [
  protect,
  authorize('Club Coordinator'),
  body('name').optional().trim(),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const club = await Club.findById(req.params.id);
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Check if user is the coordinator
    if (club.coordinator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this club' });
    }

    const { name, description } = req.body;
    
    if (name) club.name = name;
    if (description !== undefined) club.description = description;

    await club.save();
    await club.populate('coordinator', 'name email coordinatorId');
    await club.populate('members', 'name email studentId');

    res.json(club);
  } catch (error) {
    console.error('Update club error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/clubs/:id
// @desc    Delete a club
// @access  Private (Club Coordinator - owner only)
router.delete('/:id', [protect, authorize('Club Coordinator')], async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Check if user is the coordinator
    if (club.coordinator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this club' });
    }

    await Club.findByIdAndDelete(req.params.id);
    res.json({ message: 'Club deleted successfully' });
  } catch (error) {
    console.error('Delete club error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/clubs/:id/members
// @desc    Add a member to a club
// @access  Private (Club Coordinator - owner only)
router.post('/:id/members', [
  protect,
  authorize('Club Coordinator'),
  body('studentId').trim().notEmpty().withMessage('Student ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const club = await Club.findById(req.params.id);
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Check if user is the coordinator
    if (club.coordinator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add members to this club' });
    }

    const { studentId } = req.body;
    const Role = (await import('../models/Role.js')).default;
    const studentRole = await Role.findOne({ name: 'Student' });
    
    if (!studentRole) {
      return res.status(500).json({ message: 'Student role not found' });
    }
    
    const student = await User.findOne({ studentId, role: studentRole._id });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (club.members.includes(student._id)) {
      return res.status(400).json({ message: 'Student is already a member of this club' });
    }

    club.members.push(student._id);
    await club.save();
    
    await club.populate('coordinator', 'name email coordinatorId');
    await club.populate('members', 'name email studentId');

    res.json(club);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/clubs/:id/members/:memberId
// @desc    Remove a member from a club
// @access  Private (Club Coordinator - owner only)
router.delete('/:id/members/:memberId', [protect, authorize('Club Coordinator')], async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Check if user is the coordinator
    if (club.coordinator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to remove members from this club' });
    }

    club.members = club.members.filter(
      memberId => memberId.toString() !== req.params.memberId
    );
    
    await club.save();
    await club.populate('coordinator', 'name email coordinatorId');
    await club.populate('members', 'name email studentId');

    res.json(club);
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/clubs/:id/events
// @desc    Add an event to a club
// @access  Private (Club Coordinator - owner only)
router.post('/:id/events', [
  protect,
  authorize('Club Coordinator'),
  body('title').trim().notEmpty().withMessage('Event title is required'),
  body('description').optional().trim(),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('location').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const club = await Club.findById(req.params.id);
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Check if user is the coordinator
    if (club.coordinator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add events to this club' });
    }

    const { title, description, date, location } = req.body;

    const newEvent = {
      title,
      description: description || '',
      date: new Date(date),
      location: location || '',
      attendees: []
    };

    club.events.push(newEvent);

    await club.save();
    await club.populate('coordinator', 'name email coordinatorId');
    await club.populate('members', 'name email studentId');

    // Create in-app notifications for all club members
    try {
      const memberIds = club.members.map((m) => (m._id ? m._id : m));
      const notifications = memberIds.map((userId) => ({
        user: userId,
        type: 'new_event',
        title: `New event in ${club.name}`,
        message: `${newEvent.title} – ${new Date(newEvent.date).toLocaleString()}${newEvent.location ? ` at ${newEvent.location}` : ''}`,
        club: club._id,
        eventTitle: newEvent.title,
        eventDate: newEvent.date
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error('Event notifications error:', notifErr.message);
    }

    res.json(club);
  } catch (error) {
    console.error('Add event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/clubs/:id/events/:eventIndex
// @desc    Delete an event from a club
// @access  Private (Club Coordinator - owner only)
router.delete('/:id/events/:eventIndex', [protect, authorize('Club Coordinator')], async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Check if user is the coordinator
    if (club.coordinator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete events from this club' });
    }

    const eventIndex = parseInt(req.params.eventIndex);
    if (eventIndex < 0 || eventIndex >= club.events.length) {
      return res.status(400).json({ message: 'Invalid event index' });
    }

    club.events.splice(eventIndex, 1);
    await club.save();
    
    await club.populate('coordinator', 'name email coordinatorId');
    await club.populate('members', 'name email studentId');

    res.json(club);
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/clubs/:id/enroll
// @desc    Student self-enroll into a club
// @access  Private (Student only)
router.post('/:id/enroll', [protect, authorize('Student')], async (req, res) => {
  try {
    const club = await Club.findById(req.params.id).populate('members', 'name email studentId');

    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Check if already a member
    if (club.members.some((m) => m._id.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'You are already a member of this club' });
    }

    club.members.push(req.user._id);
    await club.save();
    await club.populate('coordinator', 'name email coordinatorId');
    await club.populate('members', 'name email studentId');

    res.json(club);
  } catch (error) {
    console.error('Self-enroll error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
