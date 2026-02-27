import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import LibraryBook from '../models/LibraryBook.js';
import CourseMaterial from '../models/CourseMaterial.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Notification from '../models/Notification.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ensure upload dir
const uploadDir = path.join(process.cwd(), 'uploads', 'library');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Always ensure a .pdf extension so the browser recognizes the file correctly
    let ext = path.extname(file.originalname || '').toLowerCase();
    if (!ext) ext = '.pdf';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const isPdf = ext === '.pdf' || file.mimetype === 'application/pdf';
    if (!isPdf) {
      return cb(new Error('Only PDFs are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 20 * 1024 * 1024 }
});

const router = express.Router();

// Simple static shelves list
const SHELVES = ['Shelf A', 'Shelf B', 'Shelf C', 'Shelf D', 'Shelf E'];

// GET /api/library/shelves
router.get('/shelves', protect, (req, res) => {
  res.json(SHELVES);
});

// GET /api/library/shelves/:shelf/books
router.get('/shelves/:shelf/books', protect, async (req, res) => {
  try {
    const { shelf } = req.params;
    const books = await LibraryBook.find({ shelf });
    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/library/books - search across titles/authors
router.get('/books', protect, async (req, res) => {
  try {
    const { search, shelf } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }
    if (shelf) query.shelf = shelf;
    const books = await LibraryBook.find(query);
    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/library/books - add a new book (Librarian only)
router.post('/books', protect, authorize('Librarian'), upload.single('file'), async (req, res) => {
  try {
    const { title, author, isbn, shelf, available } = req.body;
    
    // Check if file was uploaded and has size > 0
    if (!req.file) {
      return res.status(400).json({ message: 'PDF file is required' });
    }
    
    if (req.file.size === 0) {
      return res.status(400).json({ message: 'PDF file is empty' });
    }
    
    const fileUrl = `/uploads/library/${req.file.filename}`;
    //console.log(`[Library] Uploaded file: ${req.file.filename}, Size: ${req.file.size} bytes`);
    
    const book = await LibraryBook.create({ 
      title, 
      author, 
      isbn, 
      shelf, 
      available: available !== 'false' && available !== false ? true : false, 
      fileUrl, 
      addedBy: req.user._id 
    });

    // Notify all students about the new book
    try {
      const studentRole = await Role.findOne({ name: 'Student' });
      if (studentRole) {
        const students = await User.find({ role: studentRole._id }).select('_id').lean();
        const notifications = students.map((s) => ({
          user: s._id,
          type: 'library_book_added',
          title: 'New library book added',
          message: `"${title}" has been added to ${shelf} and is now available in the library.`
        }));
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    } catch (notifErr) {
      console.error('Library add book notifications error:', notifErr.message);
    }

    res.status(201).json(book);
  } catch (error) {
    console.error('[Library] Upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/library/books/:id - update availability (Librarian only)
router.patch('/books/:id', protect, authorize('Librarian'), upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (typeof updates.available !== 'undefined') {
      updates.available = updates.available !== 'false' && updates.available !== false ? true : false;
    }
    if (req.file) {
      updates.fileUrl = `/uploads/library/${req.file.filename}`;
    }
    const book = await LibraryBook.findById(id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const previousAvailable = book.available;

    // if replacing file, remove old
    if (req.file && book.fileUrl) {
      const existingPath = path.join(process.cwd(), book.fileUrl.replace(/^\//, ''));
      if (fs.existsSync(existingPath)) {
        fs.unlink(existingPath, (err) => { if (err) console.error('Failed to delete old file', err); });
      }
    }

    Object.assign(book, updates);
    await book.save();

    // If availability changed, notify all students
    if (typeof updates.available !== 'undefined' && previousAvailable !== book.available) {
      try {
        const studentRole = await Role.findOne({ name: 'Student' });
        if (studentRole) {
          const students = await User.find({ role: studentRole._id }).select('_id').lean();
          const statusText = book.available ? 'now available' : 'currently not available';
          const notifications = students.map((s) => ({
            user: s._id,
            type: 'library_book_status_changed',
            title: 'Library book status updated',
            message: `"${book.title}" is ${statusText} in the library.`
          }));
          if (notifications.length > 0) {
            await Notification.insertMany(notifications);
          }
        }
      } catch (notifErr) {
        console.error('Library book status notifications error:', notifErr.message);
      }
    }

    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/library/books/:id
router.delete('/books/:id', protect, authorize('Librarian'), async (req, res) => {
  try {
    const { id } = req.params;
    const book = await LibraryBook.findById(id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    
    // Delete file if it exists
    if (book.fileUrl) {
      const existingPath = path.join(process.cwd(), book.fileUrl.replace(/^\//, ''));
      if (fs.existsSync(existingPath)) {
        fs.unlinkSync(existingPath);
      }
    }
    
    // Use findByIdAndDelete instead of deprecated remove()
    await LibraryBook.findByIdAndDelete(id);

    // Notify all students that a book was removed
    try {
      const studentRole = await Role.findOne({ name: 'Student' });
      if (studentRole) {
        const students = await User.find({ role: studentRole._id }).select('_id').lean();
        const notifications = students.map((s) => ({
          user: s._id,
          type: 'library_book_deleted',
          title: 'Library book removed',
          message: `"${book.title}" has been removed from the library collection.`
        }));
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    } catch (notifErr) {
      console.error('Library delete book notifications error:', notifErr.message);
    }

    res.json({ message: 'Book deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Course materials
// GET /api/library/course-materials?year=2nd%20Year
router.get('/course-materials', protect, async (req, res) => {
  try {
    const { year } = req.query;
    const query = {};
    if (year) query.year = year;
    const materials = await CourseMaterial.find(query).populate('uploadedBy', 'name');
    res.json(materials.map(m => ({
      _id: m._id,
      title: m.title,
      courseId: m.courseId,
      courseName: m.courseName,
      year: m.year,
      fileUrl: m.fileUrl,
      uploadedBy: m.uploadedBy?.name || 'Unknown'
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/library/course-materials - teacher uploads material
router.post('/course-materials', protect, authorize('Teacher'), async (req, res) => {
  try {
    const { title, courseId, courseName, year, fileUrl } = req.body;
    const material = await CourseMaterial.create({ title, courseId, courseName, year, fileUrl, uploadedBy: req.user._id });
    res.status(201).json(material);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
