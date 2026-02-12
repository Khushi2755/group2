import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  schedule: {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    time: String,
    room: String
  },
  semester: {
    type: String,
    enum: ['Fall', 'Spring', 'Summer'],
    required: true
  },
  year: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

const Course = mongoose.model('Course', courseSchema);

export default Course;
