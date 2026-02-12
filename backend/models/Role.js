import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Student', 'Teacher', 'Club Coordinator'],
    trim: true
  },
  permissions: {
    type: [String],
    default: []
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const Role = mongoose.model('Role', roleSchema);

export default Role;
