import mongoose from 'mongoose';

const nominationRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  rollNo: {
    type: String,
    required: true
  },
  cgpa: {
    type: Number,
    required: true
  },
  hasActiveBacklog: {
    type: Boolean,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const candidateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  department: {
    type: String
  },
  year: {
    type: String
  },
  nominatedByStudent: {
    type: Boolean,
    default: false
  },
  votes: {
    type: Number,
    default: 0
  },
  notaVotes: {
    type: Number,
    default: 0
  }
});

const postSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: [
      'President',
      'Vice President',
      'Cultural Secretary',
      'Vice Cultural Secretary',
      'Technical Secretary',
      'Vice Technical Secretary',
      'Sports Secretary',
      'Vice Sports Secretary',
      'Joint Secretary'
    ]
  },
  maxVotes: {
    type: Number,
    default: 1
  },
  candidates: [candidateSchema],
  nominationRequests: [nominationRequestSchema],
  voters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  notaVotes: {
    type: Number,
    default: 0
  }
});

const electionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide election title'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide end date']
  },
  posts: [postSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Validate that endDate is after startDate
electionSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Method to check if election is currently active
electionSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && now >= this.startDate && now <= this.endDate;
};

// Method to get results for a post
electionSchema.methods.getPostResults = function(postName) {
  const post = this.posts.find(p => p.name === postName);
  if (!post) return null;
  
  const sortedCandidates = [...post.candidates].sort((a, b) => b.votes - a.votes);
  const maxVotes = post.maxVotes || 1;
  const winners = sortedCandidates.slice(0, maxVotes);
  
  return {
    postName: post.name,
    maxVotes,
    totalVoters: post.voters.length,
    candidates: sortedCandidates,
    winners
  };
};

// Method to get all results
electionSchema.methods.getAllResults = function() {
  return this.posts.map(post => {
    const sortedCandidates = [...post.candidates].sort((a, b) => b.votes - a.votes);
    const maxVotes = post.maxVotes || 1;
    const winners = sortedCandidates.slice(0, maxVotes);
    
    return {
      postName: post.name,
      maxVotes,
      totalVoters: post.voters.length,
      candidates: sortedCandidates,
      winners
    };
  });
};

const Election = mongoose.model('Election', electionSchema);

export default Election;

