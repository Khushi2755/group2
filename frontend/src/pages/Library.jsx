import { useState, useEffect } from 'react';
import axios from 'axios';
import './StudentDashboard.css';
import { useAuth } from '../context/AuthContext';

const Library = () => {
  const { user } = useAuth();
  const [shelves, setShelves] = useState([]);
  const [activeShelf, setActiveShelf] = useState(null);
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [materials, setMaterials] = useState([]);
  const [activeTab, setActiveTab] = useState('library');

  useEffect(() => {
    fetchShelves();
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (activeShelf) fetchShelfBooks(activeShelf);
  }, [activeShelf]);

  const fetchShelves = async () => {
    try {
      const res = await axios.get('/library/shelves');
      setShelves(res.data || []);
      setActiveShelf(res.data?.[0] || null);
    } catch (err) {
      console.error('Error fetching shelves', err);
    }
  };

  const fetchShelfBooks = async (shelf) => {
    try {
      const res = await axios.get(`/library/shelves/${encodeURIComponent(shelf)}/books`);
      setBooks(res.data || []);
    } catch (err) {
      console.error('Error fetching books for shelf', err);
    }
  };

  const handleSearch = async () => {
    try {
      // when searching, clear active shelf so we show all results
      setActiveShelf(null);
      const res = await axios.get('/library/books', { params: { search } });
      setBooks(res.data || []);
    } catch (err) {
      console.error('Search error', err);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await axios.get('/library/course-materials', { params: { year: user?.year } });
      setMaterials(res.data || []);
    } catch (err) {
      console.error('Error fetching materials', err);
    }
  };

  return (
    <div className="student-dashboard library-page">
      <div className="dashboard-layout">
        <div className="dashboard-main">
          <div className="library-tabs">
            <button className={`library-tab ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}>Library Books</button>
            <button className={`library-tab ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>Course Materials</button>
          </div>

          {activeTab === 'library' && (
            <div className="library-container">
              <div className="library-panel" style={{ width: '100%' }}>
                <h2>Library Books</h2>

                <div className="library-search">
                  <input
                  className="search-input"
                  placeholder="Search books by title or author"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className="search-button" onClick={handleSearch}>Search</button>
                </div>

                <div className="library-shelves-books">
                  <div className="shelves">
                    <h4>Shelves</h4>
                    <div className="shelf-list">
                      {shelves.map(s => (
                        <div key={s} className={`shelf ${s === activeShelf ? 'active' : ''}`} onClick={() => setActiveShelf(s)}>{s}</div>
                      ))}
                    </div>
                  </div>

                  <div className="books-list">
                    <h4>{activeShelf || 'All Books'}</h4>
                    {books.length === 0 ? (
                      <div className="empty">No books found</div>
                    ) : (
                      <div className="books-scroll">
                        {books.map(b => (
                          <div key={b._id} className="book-item">
                            <div className="book-info">
                              <div className="book-title">{b.title}</div>
                              <div className="book-meta">{b.author}{b.isbn ? ` • ${b.isbn}` : ''}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <div className={`badge ${b.available ? 'available' : 'unavailable'}`}>{b.available ? 'Available' : 'Not available'}</div>
                              {b.fileUrl && (
                                <>
                                  <a href={`/api${b.fileUrl}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>View</a>
                                  <a href={`/api${b.fileUrl}`} download style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>Download</a>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="library-container">
              <div className="library-panel" style={{ width: '100%' }}>
                <h2>Course Materials</h2>
                <p className="materials-sub">Materials for your year: <strong>{user?.year || 'N/A'}</strong></p>
                {materials.length === 0 ? (
                  <div className="empty">No materials available</div>
                ) : (
                  <ul className="materials-list">
                    {materials.map(m => (
                      <li key={m._id} className="material-item">
                        <a href={m.fileUrl} target="_blank" rel="noreferrer" className="material-link">{m.title}</a>
                        <div className="material-meta">{m.courseId} — {m.courseName} • {m.uploadedBy}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
            </div>
      </div>
    </div>
  );
};

export default Library;
