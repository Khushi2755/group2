import { useState, useEffect } from 'react';
import axios from 'axios';
import './StudentDashboard.css';

const AdminLibrary = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', author: '', isbn: '', shelf: 'Shelf A', available: true });
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/library/books');
      setBooks(res.data || []);
    } catch (err) {
      console.error('Error fetching books', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: '', author: '', isbn: '', shelf: 'Shelf A', available: true });
    setFile(null);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('author', form.author);
      fd.append('isbn', form.isbn);
      fd.append('shelf', form.shelf);
      fd.append('available', form.available);
      if (file) fd.append('file', file);

      if (editingId) {
        const res = await axios.patch(`/library/books/${editingId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setBooks(books.map(b => b._id === editingId ? res.data : b));
      } else {
        const res = await axios.post('/library/books', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setBooks([res.data, ...books]);
      }
      resetForm();
    } catch (err) {
      console.error('Submit error', err);
      alert(err.response?.data?.message || 'Failed to submit');
    }
  };

  const handleEdit = (book) => {
    setEditingId(book._id);
    setForm({ title: book.title || '', author: book.author || '', isbn: book.isbn || '', shelf: book.shelf || 'Shelf A', available: book.available });
    setFile(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this book?')) return;
    try {
      await axios.delete(`/library/books/${id}`);
      setBooks(books.filter(b => b._id !== id));
    } catch (err) {
      console.error('Delete error', err);
      alert('Failed to delete');
    }
  };

  return (
    <div className="student-dashboard">
      <div className="dashboard-layout">
        <div className="dashboard-main">
          <div className="library-container">
            <div className="library-left">
              <div className="library-panel">
                <h2>Manage Library</h2>
                <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" required />
                    <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Author" />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} placeholder="ISBN" />
                    <select value={form.shelf} onChange={e => setForm({ ...form, shelf: e.target.value })}>
                      <option>Shelf A</option>
                      <option>Shelf B</option>
                      <option>Shelf C</option>
                      <option>Shelf D</option>
                      <option>Shelf E</option>
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="checkbox" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} /> Available
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
                    <button type="submit" className="search-button">{editingId ? 'Update Book' : 'Add Book'}</button>
                    {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
                  </div>
                </form>

                <div className="books-list">
                  <h4>All Books</h4>
                  {loading ? <div>Loading...</div> : (
                    <div className="books-scroll">
                      {books.map(b => (
                        <div key={b._id} className="book-item">
                          <div>
                            <div className="book-title">{b.title}</div>
                            <div className="book-meta">{b.author} {b.isbn ? `• ${b.isbn}` : ''}</div>
                            {b.fileUrl && <a href={`/api${b.fileUrl}`} target="_blank" rel="noreferrer">View PDF</a>}
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div className={`badge ${b.available ? 'available' : 'unavailable'}`}>{b.available ? 'Available' : 'Not available'}</div>
                            <button onClick={() => handleEdit(b)}>Edit</button>
                            <button onClick={() => handleDelete(b._id)} style={{ color: 'red' }}>Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="library-right">
              <div className="library-panel">
                <h2>Info</h2>
                <p>Use this interface to add, update, or remove library books. Upload a PDF for each physical/digital copy.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLibrary;
