import express from 'express';
import Attendance from '../models/Attendance.js';
import Result from '../models/Result.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

const normalizeDate = (date) => {
  const clean = date ? new Date(date) : new Date();
  if (Number.isNaN(clean.getTime())) throw new Error('Invalid date format');
  return clean.toISOString().slice(0, 10);
};
const getCurrentSemesterTerm = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 8) {
    return 'even';
  }
  return 'odd';
};

const getSemesterNumberByYearAndTerm = (year, term) => {
  if (year === '1st Year') return term === 'even' ? 2 : 1;
  if (year === '2nd Year') return term === 'even' ? 4 : 3;
  if (year === '3rd Year') return term === 'even' ? 6 : 5;
  if (year === '4th Year') return term === 'even' ? 8 : 7;
  return term === 'even' ? 2 : 1;
};

const decodeSemesterFilter = (semester) => {
  if (!semester) return undefined;
  if (['even', 'odd'].includes(semester)) return semester;
  const number = Number(semester);
  if (Number.isInteger(number) && number >= 1 && number <= 8) {
    return number % 2 === 0 ? 'even' : 'odd';
  }
  return undefined;
};
// GET /api/attendance/students?year=&branch=
// teacher selects class and loads students
router.get('/students', protect, authorize('Teacher', 'Club Coordinator', 'Super Admin'), async (req, res) => {
  try {
    const { year, branch } = req.query;

    const studentRole = await Role.findOne({ name: 'Student' });
    if (!studentRole) {
      return res.json([]);
    }

    const criteria = { role: studentRole._id };
    if (year) criteria.year = year;
    if (branch) criteria.department = branch;

    const students = await User.find(criteria).populate('role').lean();

    // attach current attendance % per student
    const studentStats = await Promise.all(students.map(async (student) => {
      const filters = { student: student._id };
      if (year) filters.year = year;
      if (branch) filters.branch = branch;

      const total = await Attendance.countDocuments(filters);
      const present = await Attendance.countDocuments({ ...filters, status: 'present' });
      const percent = total ? (present / total) * 100 : 100;
      return { ...student, attendance: { total, present, absent: total - present, percent: Number(percent.toFixed(2)) } };
    }));

    res.json(studentStats);
  } catch (error) {
    console.error('attendance students error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/attendance/mark
router.post('/mark', protect, authorize('Teacher', 'Club Coordinator', 'Super Admin'), async (req, res) => {
  try {
    const { date, year, branch, semester, course, records } = req.body;
    if (!year || !branch || !Array.isArray(records)) {
      return res.status(400).json({ message: 'year, branch, and records are required' });
    }

    const classDate = normalizeDate(date);
    let absentCount = 0;

    let adjustedSemesterNum;
    const semesterTerm = decodeSemesterFilter(semester);
    if (semesterTerm) {
      adjustedSemesterNum = getSemesterNumberByYearAndTerm(year, semesterTerm);
    }


    for (const rec of records) {
      const { studentId, status } = rec;
      if (!studentId || !['present', 'absent'].includes(status)) continue;
      const student = await User.findById(studentId).populate('role');
      if (!student || student.role?.name !== 'Student') continue;
      if (student.year !== year || student.department !== branch) continue;

      const attendanceStatus = status === 'present' ? 'present' : 'absent';
      if (attendanceStatus === 'absent') absentCount++;

      await Attendance.findOneAndUpdate(
        { student: student._id, date: classDate, course: course || null },
        {
          student: student._id,
          date: classDate,
          year,
          branch,
          semester: adjustedSemesterNum || student.semester,
          course: course || null,
          status: attendanceStatus
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (attendanceStatus === 'absent') {
        await Notification.create({
          user: student._id,
          type: 'attendance_absent',
          title: `You were marked absent on ${classDate}`,
          message: `Attendance marked absent for ${branch} ${year} on ${classDate}`
        });
      }
    }

    // Teacher high-absentee threshold notification
    if (absentCount >= 5) {
      await Notification.create({
        user: req.user._id,
        type: 'attendance_threshold',
        title: `High absence count (${absentCount}) on ${classDate}`,
        message: `More than 5 students absent in ${branch} ${year} on ${classDate}.`,
      });
    }

    // Send low-attendance alerts (student-specific)
    const studentRole = await Role.findOne({ name: 'Student' });
    if (!studentRole) {
      return res.json({ message: 'Attendance updated', absentCount, lowAttendanceNotifications: [] });
    }

    const studentCriteria = { year, department: branch, role: studentRole._id };
    const rosterTerm = decodeSemesterFilter(semester);
    if (rosterTerm) {
      studentCriteria.semester = { $in: rosterTerm === 'even' ? [2, 4, 6, 8] : [1, 3, 5, 7] };
    }
    const studentRoster = await User.find(studentCriteria).lean();
    const notifiedStudents = [];
    for (const student of studentRoster) {
      const total = await Attendance.countDocuments({ student: student._id, year, branch });
      const present = await Attendance.countDocuments({ student: student._id, year, branch, status: 'present' });
      const percent = total ? (present / total) * 100 : 100;

      if (percent < 80) {
        const existingRecent = await Notification.findOne({
          user: student._id,
          type: 'attendance_low',
          'createdAt': { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24) }
        });

        if (!existingRecent) {
          await Notification.create({
            user: student._id,
            type: 'attendance_low',
            title: `Attendance below 80% (${percent.toFixed(2)}%)`,
            message: `Your attendance is ${percent.toFixed(2)}% for ${branch} ${year}. Please improve attendance.`,
          });
        }
        notifiedStudents.push({ studentId: student._id, percent: Number(percent.toFixed(2)) });
      }
    }

    res.json({ message: 'Attendance updated', absentCount, lowAttendanceNotifications: notifiedStudents });
  } catch (error) {
    console.error('attendance mark error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/attendance/mystats  (for enrolled student)
router.get('/mystats', protect, authorize('Student'), async (req, res) => {
  try {
    const student = req.user;
    const total = await Attendance.countDocuments({ student: student._id });
    const present = await Attendance.countDocuments({ student: student._id, status: 'present' });
    const absent = await Attendance.countDocuments({ student: student._id, status: 'absent' });
    const percent = total ? (present / total) * 100 : 100;

    res.json({ total, present, absent, percent: Number(percent.toFixed(2)) });
  } catch (error) {
    console.error('attendance mystats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/attendance/history?year=&branch=&dateFrom=&dateTo=&course=
router.get('/history', protect, authorize('Teacher', 'Club Coordinator', 'Super Admin'), async (req, res) => {
  try {
    const { year, branch, semester, dateFrom, dateTo, course } = req.query;

    const query = {};
    if (year) query.year = year;
    if (branch) query.branch = branch;
    if (course) query.course = course;
    const semesterTerm = decodeSemesterFilter(semester);
    if (semesterTerm) {
      query.semester = { $in: semesterTerm === 'even' ? [2, 4, 6, 8] : [1, 3, 5, 7] };
    }
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = normalizeDate(dateFrom);
      if (dateTo) query.date.$lte = normalizeDate(dateTo);
    }

    const records = await Attendance.find(query)
      .populate('student', 'name studentId year department')
      .populate('course', 'courseName courseCode')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const dto = records.map((item) => ({
      id: item._id,
      date: item.date,
      status: item.status,
      year: item.year,
      semester: item.semester,
      branch: item.branch,
      studentId: item.student?.studentId || 'N/A',
      studentName: item.student?.name || 'N/A',
      courseName: item.course?.courseName || 'N/A',
      courseCode: item.course?.courseCode || 'N/A'
    }));

    res.json(dto);
  } catch (error) {
    console.error('attendance history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/attendance/student/courses
router.get('/student/courses', protect, authorize('Student'), async (req, res) => {
  try {
    const enrolledResults = await Result.find({ student: req.user._id })
      .populate('course', 'courseName courseCode year semester department')
      .sort({ enrolledAt: -1 })
      .lean();

    const courses = enrolledResults
      .filter((item) => item.course)
      .map((item) => ({
        _id: item.course._id,
        courseName: item.course.courseName,
        courseCode: item.course.courseCode,
        year: item.course.year,
        semester: item.course.semester,
        department: item.course.department
      }));

    res.json(courses);
  } catch (error) {
    console.error('attendance student courses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/attendance/student/course/:courseId
router.get('/student/course/:courseId', protect, authorize('Student'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const enrolled = await Result.findOne({ student: req.user._id, course: courseId })
      .populate('course', 'courseName courseCode year semester department')
      .lean();

    if (!enrolled || !enrolled.course) {
      return res.status(404).json({ message: 'Course not enrolled or not found' });
    }

    const records = await Attendance.find({ student: req.user._id, course: courseId })
      .sort({ date: 1 })
      .lean();

    const total = records.length;
    const present = records.filter((item) => item.status === 'present').length;
    const absent = total - present;
    const percent = total ? Number(((present / total) * 100).toFixed(2)) : 0;

    const datewise = records.map((item) => ({
      date: item.date,
      status: item.status
    }));

    const monthlyMap = {};
    records.forEach((item) => {
      const dateObj = new Date(`${item.date}T00:00:00Z`);
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { monthKey, present: 0, absent: 0, total: 0 };
      }
      monthlyMap[monthKey].total += 1;
      monthlyMap[monthKey][item.status] += 1;
    });

    const monthlySummary = Object.values(monthlyMap)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map((item) => ({
        month: new Date(`${item.monthKey}-01`).toLocaleString('default', { month: 'short', year: 'numeric' }),
        present: item.present,
        absent: item.absent,
        total: item.total,
        percent: item.total ? Number(((item.present / item.total) * 100).toFixed(2)) : 0
      }));

    res.json({
      course: enrolled.course,
      stats: {
        total,
        present,
        absent,
        percent
      },
      monthlySummary,
      datewise
    });
  } catch (error) {
    console.error('attendance student course detail error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;