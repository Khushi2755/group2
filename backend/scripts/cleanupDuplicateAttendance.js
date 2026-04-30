import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Attendance from '../models/Attendance.js';

dotenv.config();

const cleanupDuplicates = async () => {
  try {
    await connectDB();

    // Find all attendance records
    const allRecords = await Attendance.find({}).sort({ student: 1, date: 1, course: 1, createdAt: 1 }).lean();
    
    console.log(`Total attendance records: ${allRecords.length}`);

    // Group by student + date + course to find duplicates
    const groupMap = new Map();
    const duplicatesToDelete = [];

    for (const record of allRecords) {
      const key = `${record.student}_${record.date}_${record.course || 'null'}`;
      
      if (groupMap.has(key)) {
        // This is a duplicate - mark for deletion (keep the first one)
        duplicatesToDelete.push(record._id);
        console.log(`Duplicate found: student=${record.student}, date=${record.date}, course=${record.course}, id=${record._id}`);
      } else {
        groupMap.set(key, record);
      }
    }

    if (duplicatesToDelete.length > 0) {
      console.log(`\nDeleting ${duplicatesToDelete.length} duplicate records...`);
      const result = await Attendance.deleteMany({ _id: { $in: duplicatesToDelete } });
      console.log(`Deleted ${result.deletedCount} duplicate records`);
    } else {
      console.log('\nNo duplicate records found!');
    }

    console.log('\nCleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    process.exit(1);
  }
};

cleanupDuplicates();

// Made with Bob
