import mongoose from 'mongoose';

const courseRegistrationSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  courseCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  faculty: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  credits: {
    type: Number,
    default: 3,
    min: 1,
    max: 6
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
courseRegistrationSchema.index({ year: 1, semester: 1, department: 1 });
courseRegistrationSchema.index({ faculty: 1 });

const CourseRegistration = mongoose.model('CourseRegistration', courseRegistrationSchema);

export default CourseRegistration;

// Made with Bob
