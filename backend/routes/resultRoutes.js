import express from 'express';
import CourseRegistration from '../models/CourseRegistration.js';
import Result from '../models/Result.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

const yearNameToNumber = {
  '1st Year': 1,
  '2nd Year': 2,
  '3rd Year': 3,
  '4th Year': 4
};

const yearNumberToName = {
  1: '1st Year',
  2: '2nd Year',
  3: '3rd Year',
  4: '4th Year'
};

const parseGradeValue = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? undefined : numeric;
};

// GET /api/results/student/available - Get available courses for the logged-in student
router.get('/student/available', protect, authorize('Student'), async (req, res) => {
  try {
    const yearNumber = yearNameToNumber[req.user.year];
    if (!yearNumber || !req.user.department) {
      return res.json([]);
    }

    const enrolledCourseIds = await Result.find({ student: req.user._id }).distinct('course');

    const availableCourses = await CourseRegistration.find({
      year: yearNumber,
      department: req.user.department,
      _id: { $nin: enrolledCourseIds }
    })
      .sort({ year: 1, semester: 1, courseName: 1 })
      .lean();

    res.json(availableCourses);
  } catch (error) {
    console.error('Get available results error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/results/student - Get enrolled result records for the student
router.get('/student', protect, authorize('Student'), async (req, res) => {
  try {
    const results = await Result.find({ student: req.user._id })
      .populate('course', 'courseName courseCode year semester department')
      .sort({ enrolledAt: -1 })
      .lean();

    res.json(results);
  } catch (error) {
    console.error('Get student results error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/results/enroll - Enroll current student in a course result tracker
router.post('/enroll', protect, authorize('Student'), async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required' });
    }

    const course = await CourseRegistration.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const yearNumber = yearNameToNumber[req.user.year];
    if (!yearNumber || course.year !== yearNumber || course.department !== req.user.department) {
      return res.status(403).json({ message: 'You can only enroll in courses for your year and branch' });
    }

    const existing = await Result.findOne({ student: req.user._id, course: courseId });
    if (existing) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    const result = await Result.create({
      student: req.user._id,
      course: course._id,
      year: course.year,
      semester: course.semester,
      department: course.department
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Enroll result error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/results/teacher/course/:courseId/students - Get class students and existing marks for a teacher course
router.get('/teacher/course/:courseId/students', protect, authorize('Teacher', 'Super Admin'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await CourseRegistration.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role?.name === 'Teacher') {
      const isAssigned = course.faculty.some((fac) => fac.toString() === req.user._id.toString());
      if (!isAssigned) {
        return res.status(403).json({ message: 'You are not assigned to this course' });
      }
    }

    const studentRole = await Role.findOne({ name: 'Student' });
    if (!studentRole) {
      return res.json({ course: {}, students: [] });
    }

    const yearName = yearNumberToName[course.year];
    const students = await User.find({
      role: studentRole._id,
      year: yearName,
      department: course.department
    })
      .select('name studentId year department')
      .sort({ name: 1 })
      .lean();

    const savedResults = await Result.find({
      course: course._id,
      student: { $in: students.map((s) => s._id) }
    }).lean();

    const resultsByStudent = savedResults.reduce((acc, item) => {
      acc[item.student.toString()] = item;
      return acc;
    }, {});

    const responseStudents = students.map((student) => {
      const existing = resultsByStudent[student._id.toString()];
      return {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
        year: student.year,
        department: student.department,
        ct1: existing?.ct1 ?? null,
        ct2: existing?.ct2 ?? null,
        endsem: existing?.endsem ?? null,
        enrolled: Boolean(existing)
      };
    });

    res.json({
      course: {
        _id: course._id,
        courseName: course.courseName,
        courseCode: course.courseCode,
        year: course.year,
        semester: course.semester,
        department: course.department
      },
      students: responseStudents
    });
  } catch (error) {
    console.error('Get teacher course students error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/results/teacher/grades - Submit grades for class students
router.post('/teacher/grades', protect, authorize('Teacher', 'Super Admin'), async (req, res) => {
  try {
    const { courseId, records } = req.body;
    if (!courseId || !Array.isArray(records)) {
      return res.status(400).json({ message: 'courseId and records are required' });
    }

    const course = await CourseRegistration.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role?.name === 'Teacher') {
      const isAssigned = course.faculty.some((fac) => fac.toString() === req.user._id.toString());
      if (!isAssigned) {
        return res.status(403).json({ message: 'You are not assigned to this course' });
      }
    }

    const studentRole = await Role.findOne({ name: 'Student' });
    if (!studentRole) {
      return res.status(400).json({ message: 'Student role not defined' });
    }

    const validStudentIds = records
      .map((item) => item.studentId)
      .filter((id) => typeof id === 'string');

    const eligibleStudents = await User.find({
      _id: { $in: validStudentIds },
      role: studentRole._id,
      year: yearNumberToName[course.year],
      department: course.department
    }).lean();

    const eligibleSet = new Set(eligibleStudents.map((s) => s._id.toString()));
    const updatedResults = [];

    for (const record of records) {
      const { studentId, ct1, ct2, endsem } = record;
      if (!studentId || !eligibleSet.has(studentId)) {
        continue;
      }

      const gradeUpdate = {};
      const parsedCt1 = parseGradeValue(ct1);
      const parsedCt2 = parseGradeValue(ct2);
      const parsedEndsem = parseGradeValue(endsem);

      if (parsedCt1 !== undefined) gradeUpdate.ct1 = parsedCt1;
      if (parsedCt2 !== undefined) gradeUpdate.ct2 = parsedCt2;
      if (parsedEndsem !== undefined) gradeUpdate.endsem = parsedEndsem;
      if (Object.keys(gradeUpdate).length === 0) {
        continue;
      }

      gradeUpdate.year = course.year;
      gradeUpdate.semester = course.semester;
      gradeUpdate.department = course.department;

      const result = await Result.findOneAndUpdate(
        { student: studentId, course: course._id },
        { $set: gradeUpdate },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      updatedResults.push(result);

      await Notification.create({
        user: studentId,
        type: 'result_update',
        title: `Result updated for ${course.courseCode}`,
        message: `Marks updated for ${course.courseName}: ${parsedCt1 !== undefined ? `CT1 ${parsedCt1}` : ''}${parsedCt2 !== undefined ? ` CT2 ${parsedCt2}` : ''}${parsedEndsem !== undefined ? ` EndSem ${parsedEndsem}` : ''}`.trim()
      });
    }

    res.json({
      message: 'Grades saved successfully',
      updatedCount: updatedResults.length
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
