import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const run = async () => {
  await connectDB();
  const u = await User.findOne({ email: '221121@iiitt.ac.in' });
  if (!u) {
    console.log('no user 221121');
    return process.exit(0);
  }
  u.name = 'Khushi Lohan';
  u.year = '4th Year';
  u.department = 'CSE';
  await u.save();
  console.log('updated user', u.email, u.year, u.department);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
