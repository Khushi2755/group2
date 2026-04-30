import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const run = async () => {
  await connectDB();

  // Change this to the email of the user you want to reset
  const userEmail = '221144@iiitt.ac.in';
  const newPassword = 'khushi456';

  const user = await User.findOne({ email: userEmail });
  if (!user) {
    console.log('User not found with email:', userEmail);
    return process.exit(1);
  }

  user.password = newPassword; // This will be hashed by the pre-save hook
  await user.save();

  console.log('Password reset for user:', user.email);
  console.log('New password:', newPassword);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});