import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['new_club', 'new_event', 'library_book_added', 'library_book_deleted', 'library_book_status_changed'],
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    trim: true,
    default: ''
  },
  read: {
    type: Boolean,
    default: false
  },
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
  eventTitle: { type: String },
  eventDate: { type: Date }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
