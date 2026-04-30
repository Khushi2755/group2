import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';

dotenv.config();

const fixIndexes = async () => {
  try {
    await connectDB();

    const db = mongoose.connection.db;
    const collection = db.collection('attendances');

    // Get existing indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    // Drop the old duplicate index if it exists
    try {
      await collection.dropIndex('student_1_date_1');
      console.log('Dropped old index: student_1_date_1');
    } catch (err) {
      console.log('Index student_1_date_1 does not exist or already dropped');
    }

    // Drop the existing non-unique compound index
    try {
      await collection.dropIndex('student_1_date_1_course_1');
      console.log('Dropped old index: student_1_date_1_course_1');
    } catch (err) {
      console.log('Index student_1_date_1_course_1 does not exist or already dropped');
    }

    // Create the new unique compound index
    await collection.createIndex(
      { student: 1, date: 1, course: 1 },
      { unique: true, name: 'student_1_date_1_course_1_unique' }
    );
    console.log('Created new unique index: student_1_date_1_course_1_unique');

    // Verify new indexes
    const newIndexes = await collection.indexes();
    console.log('Updated indexes:', JSON.stringify(newIndexes, null, 2));

    console.log('Index fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
};

fixIndexes();

// Made with Bob
