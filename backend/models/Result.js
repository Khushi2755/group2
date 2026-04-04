import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseRegistration',
    required: true,
    index: true
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
    trim: true,
    required: true
  },
  ct1: {
    type: Number,
    min: 0,
    max: 100
  },
  ct2: {
    type: Number,
    min: 0,
    max: 100
  },
  endsem: {
    type: Number,
    min: 0,
    max: 100
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

resultSchema.index({ student: 1, course: 1 }, { unique: true });

const Result = mongoose.model('Result', resultSchema);

export default Result;
