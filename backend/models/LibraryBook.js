import mongoose from 'mongoose';

const libraryBookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, trim: true },
  isbn: { type: String, trim: true },
  shelf: { type: String, trim: true },
  year: { type: String, trim: true, enum: ['1st Year', '2nd Year', '3rd Year', '4th Year'], required: true },
  semester: { type: String, trim: true, enum: ['1st Semester', '2nd Semester'], required: true },
  available: { type: Boolean, default: true },
  fileUrl: { type: String, trim: true },
  fileName: { type: String, trim: true },
  link: { type: String, trim: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {  timestamps: true
});

const LibraryBook = mongoose.model('LibraryBook', libraryBookSchema);

export default LibraryBook;
