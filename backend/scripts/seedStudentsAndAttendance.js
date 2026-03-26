import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Attendance from '../models/Attendance.js';

dotenv.config();

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

        accounts.push({
          studentId,
          email: `${studentId}@iiitt.ac.in`,
          name: `Student ${studentId}`,
          department: branch.dept,
          year: year.label
        });
      }
    }
  }

  return accounts;
};

const seed = async () => {
  try {
    await connectDB();
    console.log('DB connected');

    let studentRole = await Role.findOne({ name: 'Student' });
    if (!studentRole) {
      studentRole = await Role.create({ name: 'Student', permissions: [] });
      console.log('Created Student role');
    }

    const students = buildStudents();

    let count = 0;
    for (const student of students) {
      const existing = await User.findOne({ studentId: student.studentId });
      if (existing) continue;

      const semester = student.year === '1st Year' ? (Math.random() < 0.5 ? 1 : 2)
        : student.year === '2nd Year' ? (Math.random() < 0.5 ? 3 : 4)
        : student.year === '3rd Year' ? (Math.random() < 0.5 ? 5 : 6)
        : (Math.random() < 0.5 ? 7 : 8);

      await User.create({
        name: student.name,
        email: student.email,
        password: 'Password123',
        role: studentRole._id,
        studentId: student.studentId,
        department: student.department,
        year: student.year,
        semester,
        semesterLastUpdated: new Date(),
        isActive: true
      });

      count += 1;
    }

    console.log(`Inserted ${count} students`);

    // optionally create sample attendance records for each student for current date
    const today = new Date().toISOString().slice(0, 10);
    const studentDocs = await User.find({ role: studentRole._id });

    let attendanceInsert = 0;
    for (const student of studentDocs) {
      const existing = await Attendance.findOne({ student: student._id, date: today });
      if (existing) continue;

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
    console.error('Seed failed', err);
    process.exit(1);
  }
};

seed();
