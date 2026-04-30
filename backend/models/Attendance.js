import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  year: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    required: true,
    trim: true,
    index: true
  },
  branch: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseRegistration',
    index: true
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Unique compound index: a student can only have one attendance record per date per course
// This allows multiple attendance records per day if they're for different courses
attendanceSchema.index({ student: 1, date: 1, course: 1 }, { unique: true, name: 'student_1_date_1_course_1_unique' });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
