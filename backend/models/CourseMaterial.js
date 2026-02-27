import mongoose from 'mongoose';

const courseMaterialSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  courseId: { type: String, trim: true, required: true },
  courseName: { type: String, trim: true },
  year: { type: String, trim: true },
  fileUrl: { type: String, trim: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

const CourseMaterial = mongoose.model('CourseMaterial', courseMaterialSchema);

export default CourseMaterial;
