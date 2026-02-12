import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  maxScore: {
    type: Number,
    required: true,
    min: 0
  },
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: {
      type: Date
    },
    fileUrl: {
      type: String
    },
    score: {
      type: Number,
      min: 0
    },
    feedback: {
      type: String
    },
    status: {
      type: String,
      enum: ['Pending', 'Submitted', 'Graded'],
      default: 'Pending'
    }
  }],
  attachments: [{
    name: String,
    url: String
  }]
}, {
  timestamps: true
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
