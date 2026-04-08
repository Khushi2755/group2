import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const cleanupUsers = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Delete all users except superadmin
    const deleteResult = await User.deleteMany({ email: { $ne: 'superadmin@iiitt.ac.in' } });
    console.log(`Deleted ${deleteResult.deletedCount} users`);

    // Update superadmin password to coder2324
    const superAdmin = await User.findOne({ email: 'superadmin@iiitt.ac.in' }).select('+password');
    if (superAdmin) {
      superAdmin.password = 'coder2324';
      await superAdmin.save();
      console.log('Updated superadmin password to coder2324');
    } else {
      console.log('Superadmin not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

cleanupUsers();