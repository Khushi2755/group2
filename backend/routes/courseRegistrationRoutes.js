import express from 'express';
import CourseRegistration from '../models/CourseRegistration.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/course-registration - Get all course registrations with filters
router.get('/', protect, authorize('Super Admin', 'Teacher'), async (req, res) => {
  try {
    const { year, semester, department, facultyId } = req.query;
    
    const query = {};
    if (year) query.year = Number(year);
    if (semester) query.semester = Number(semester);
    if (department) query.department = department;
    if (facultyId) query.faculty = facultyId;

    const courses = await CourseRegistration.find(query)
      .populate('faculty', 'name email department')
      .sort({ year: 1, semester: 1, courseName: 1 })
      .lean();

    res.json(courses);
  } catch (error) {
    console.error('Get course registrations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/course-registration/faculty/:facultyId - Get courses for specific faculty
router.get('/faculty/:facultyId', protect, async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    const courses = await CourseRegistration.find({ faculty: facultyId })
      .sort({ year: 1, semester: 1, courseName: 1 })
      .lean();

    res.json(courses);
  } catch (error) {
    console.error('Get faculty courses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/course-registration - Create new course registration
router.post('/', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const { courseName, courseCode, year, semester, department, faculty, credits, description } = req.body;

    if (!courseName || !courseCode || !year || !semester || !department) {
      return res.status(400).json({ message: 'Required fields: courseName, courseCode, year, semester, department' });
    }

    // Validate faculty IDs if provided
    if (faculty && Array.isArray(faculty) && faculty.length > 0) {
      const teacherRole = await Role.findOne({ name: 'Teacher' });
      const validFaculty = await User.find({ 
        _id: { $in: faculty }, 
        role: teacherRole._id 
      });
      
      if (validFaculty.length !== faculty.length) {
        return res.status(400).json({ message: 'One or more invalid faculty IDs' });
      }
    }

    const course = await CourseRegistration.create({
      courseName,
      courseCode,
      year: Number(year),
      semester: Number(semester),
      department,
      faculty: faculty || [],
      credits: credits || 3,
      description: description || ''
    });

    const populatedCourse = await CourseRegistration.findById(course._id)
      .populate('faculty', 'name email department');

    res.status(201).json(populatedCourse);
  } catch (error) {
    console.error('Create course registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/course-registration/:id - Update course registration
router.put('/:id', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { courseName, courseCode, year, semester, department, faculty, credits, description } = req.body;

    const course = await CourseRegistration.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course registration not found' });
    }

    // Validate faculty IDs if provided
    if (faculty && Array.isArray(faculty) && faculty.length > 0) {
      const teacherRole = await Role.findOne({ name: 'Teacher' });
      const validFaculty = await User.find({ 
        _id: { $in: faculty }, 
        role: teacherRole._id 
      });
      
      if (validFaculty.length !== faculty.length) {
        return res.status(400).json({ message: 'One or more invalid faculty IDs' });
      }
    }

    if (courseName) course.courseName = courseName;
    if (courseCode) course.courseCode = courseCode;
    if (year) course.year = Number(year);
    if (semester) course.semester = Number(semester);
    if (department) course.department = department;
    if (faculty !== undefined) course.faculty = faculty;
    if (credits) course.credits = Number(credits);
    if (description !== undefined) course.description = description;

    await course.save();

    const updatedCourse = await CourseRegistration.findById(id)
      .populate('faculty', 'name email department');

    res.json(updatedCourse);
  } catch (error) {
    console.error('Update course registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/course-registration/:id - Delete course registration
router.delete('/:id', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const course = await CourseRegistration.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course registration not found' });
    }

    await CourseRegistration.findByIdAndDelete(id);

    res.json({ message: 'Course registration deleted successfully' });
  } catch (error) {
    console.error('Delete course registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/course-registration/teachers - Get all teachers for assignment
router.get('/teachers/list', protect, authorize('Super Admin'), async (req, res) => {
  try {
    const teacherRole = await Role.findOne({ name: 'Teacher' });
    if (!teacherRole) {
      return res.json([]);
    }

    const teachers = await User.find({ role: teacherRole._id })
      .select('name email department')
      .sort({ name: 1 })
      .lean();

    res.json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

// Made with Bob
