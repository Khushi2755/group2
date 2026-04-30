import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Attendance from '../models/Attendance.js';

dotenv.config();

const PASSWORD = 'khushi456';

const buildStudents = () => {
  const accounts = [];

  const branches = [
    { prefix: '110', dept: 'CSE' },
    { prefix: '120', dept: 'ECE' }
  ];

  const yearConfigs = [
    { code: '25', label: '1st Year' },
    { code: '24', label: '2nd Year' },
    { code: '23', label: '3rd Year' },
    { code: '22', label: '4th Year' }
  ];

  for (const year of yearConfigs) {
    for (const branch of branches) {
      for (let i = 1; i <= 30; i++) {
        const suffix = i < 10 ? `0${i}` : `${i}`;
        const studentId = `${year.code}${branch.prefix}${suffix}`;

        const semester = year.label === '1st Year' ? (Math.random() < 0.5 ? 1 : 2)
          : year.label === '2nd Year' ? (Math.random() < 0.5 ? 3 : 4)
          : year.label === '3rd Year' ? (Math.random() < 0.5 ? 5 : 6)
          : (Math.random() < 0.5 ? 7 : 8);

        accounts.push({
          studentId,
          email: `${studentId}@iiitt.ac.in`,
          name: `Student ${studentId}`,
          department: branch.dept,
          year: year.label,
          semester
        });
      }
    }
  }

  return accounts;
};

const reseed = async () => {
  try {
    await connectDB();
    console.log('DB connected');

    let studentRole = await Role.findOne({ name: 'Student' });
    if (!studentRole) {
      studentRole = await Role.create({ name: 'Student', permissions: [] });
      console.log('Created Student role');
    }

    const students = buildStudents();
    const studentIds = students.map((student) => student.studentId);

    const existingSeededUsers = await User.find(
      { studentId: { $in: studentIds } },
      { _id: 1, studentId: 1 }
    );

    const userObjectIds = existingSeededUsers.map((user) => user._id);

    const deletedAttendanceResult = userObjectIds.length
      ? await Attendance.deleteMany({ student: { $in: userObjectIds } })
      : { deletedCount: 0 };

    const deletedUsersResult = await User.deleteMany({ studentId: { $in: studentIds } });

    console.log(`Deleted ${deletedUsersResult.deletedCount} seeded users`);
    console.log(`Deleted ${deletedAttendanceResult.deletedCount} attendance records`);

    let insertedUsers = 0;
    for (const student of students) {
      await User.create({
        name: student.name,
        email: student.email,
        password: PASSWORD,
        role: studentRole._id,
        studentId: student.studentId,
        department: student.department,
        year: student.year,
        semester: student.semester,
        semesterLastUpdated: new Date(),
        isActive: true
      });

      insertedUsers += 1;
    }

    console.log(`Inserted ${insertedUsers} students with password ${PASSWORD}`);

    const today = new Date().toISOString().slice(0, 10);
    const reseededUsers = await User.find({ studentId: { $in: studentIds } });

    let attendanceInsert = 0;
    for (const student of reseededUsers) {
      const status = Math.random() < 0.85 ? 'present' : 'absent';

      await Attendance.create({
        student: student._id,
        date: today,
        year: student.year,
        semester: student.semester,
        branch: student.department,
        status
      });

      attendanceInsert += 1;
    }

    console.log(`Inserted ${attendanceInsert} attendance records for ${today}`);
    process.exit(0);
  } catch (err) {
    console.error('Reseed failed', err);
    process.exit(1);
  }
};

reseed();

// Made with Bob
