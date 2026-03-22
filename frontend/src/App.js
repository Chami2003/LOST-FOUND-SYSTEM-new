import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from 'react-router-dom';

// Campus background photo
import campusBg from './campus.jpg'; 

// --- 1. NEW & ENHANCED LANDING PAGE (First Page) ---
function LandingPage() {
  const navigate = useNavigate();

  const containerStyle = {
    backgroundImage: `url(${campusBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    position: 'relative',
  };

  const overlayStyle = {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 26, 51, 0.7)', // Dark blue overlay for professional look
    zIndex: 0
  };

  const headerStyle = {
    zIndex: 1,
    width: '100%',
    padding: '20px 50px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxSizing: 'border-box'
  };

  const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)', // Glass effect
    padding: '40px 30px',
    borderRadius: '20px',
    width: '320px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.4s ease',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <div style={containerStyle}>
      <div style={overlayStyle} />
      
      {/* Top Navigation / Branding */}
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: '#e67e22', color: 'white', padding: '10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '20px' }}>🔍</div>
          <h2 style={{ color: '#e67e22' }}>Lost & Found System</h2>
        </div>
      </header>

      {/* Hero Section */}
      <div style={{ zIndex: 1, textAlign: 'center', marginTop: '60px', padding: '0 20px' }}>
        <h1 style={{ color: 'white', fontSize: '50px', fontWeight: '800', marginBottom: '15px', textShadow: '2px 2px 10px rgba(0,0,0,0.3)' }}>
          How can we help you today?
        </h1>
        <p style={{ color: '#ccc', fontSize: '20px', marginBottom: '50px', maxWidth: '700px', margin: '0 auto 60px auto', lineHeight: '1.6' }}>
          Welcome to the University's official lost and found portal. Reconnecting you with your misplaced belongings quickly and easily.
        </p>
        
        <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* Option 1: Lost Item */}
          <div 
            style={cardStyle} 
            onClick={() => navigate('/report-form')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.borderColor = '#e67e22';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <div style={{ backgroundColor: '#e67e22', color: 'white', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '35px', marginBottom: '20px', boxShadow: '0 0 20px rgba(230, 126, 34, 0.5)' }}>✕</div>
            <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '24px' }}>I Lost Something</h3>
            <p style={{ color: '#eee', fontSize: '15px', lineHeight: '1.4' }}>Submit a report for your lost item to our campus database.</p>
            <button style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '30px', border: 'none', backgroundColor: '#e67e22', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Report Lost</button>
          </div>

          {/* Option 2: Found Item (Inactive for now as requested) */}
          <div style={{ ...cardStyle, opacity: 0.6, cursor: 'not-allowed' }}>
            <div style={{ backgroundColor: '#003366', color: 'white', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '35px', marginBottom: '20px', border: '2px solid #e67e22' }}>✓</div>
            <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '24px' }}>I Found Something</h3>
            <p style={{ color: '#eee', fontSize: '15px', lineHeight: '1.4' }}>Help a fellow student by reporting an item you've found.</p>
            <button style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '30px', border: '1px solid white', backgroundColor: 'transparent', color: 'white', fontWeight: 'bold', cursor: 'not-allowed' }}>Report Found</button>
          </div>
        </div>
      </div>

      {/* Info Stats (Visual enhancement only) */}
      <div style={{ zIndex: 1, display: 'flex', gap: '80px', marginTop: '80px', color: 'white' }}>
        <div style={{ textAlign: 'center' }}><h2 style={{ color: '#e67e22', margin: '0' }}>100+</h2><p style={{ fontSize: '14px', margin: '0' }}>Items Reported</p></div>
        <div style={{ textAlign: 'center' }}><h2 style={{ color: '#e67e22', margin: '0' }}>50+</h2><p style={{ fontSize: '14px', margin: '0' }}>Returned Successfully</p></div>
      </div>

      <footer style={{ zIndex: 1, marginTop: 'auto', padding: '30px', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
        © 2026 Campus Lost & Found System | Secure Student Portal
      </footer>
    </div>
  );
}

// --- 2. Form Page --
function FormPage() {
  const [formData, setFormData] = useState({
    itemName: '', description: '', category: '', location: '', dateLost: '', contact: ''
  });
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.itemName || !formData.description || !formData.category || !formData.location || !formData.dateLost || !formData.contact) {
      alert("Please fill all the fields before reporting.");
      return;
    }
    if (formData.contact.length !== 10) {
      alert("Please enter a valid 10-digit contact number.");
      return;
    }
    try {
      await axios.post('http://localhost:5001/api/lost-items/add', formData);
      alert("Item Reported Successfully! 🎉");
      navigate('/items'); 
    } catch (err) { alert("Failed to submit."); }
  };

  return (
    <div style={pageBackgroundStyle}>
      <div style={fullOverlayStyle} /> 
      <div style={formContainerStyle}>
        <Link to="/" style={{ color: '#003366', fontWeight: 'bold', textDecoration: 'none', marginBottom: '15px', display: 'inline-block', fontSize: '13px' }}>← Back to Home</Link>
        <h1 style={{ textAlign: 'center', color: '#003366', marginBottom: '5px' }}>🎓 REPORT LOST ITEM</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '25px', fontSize: '14px' }}>Lost Something? We are here to help you</p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
          <input type="text" placeholder="Item Name" value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} required style={inputStyle} />
          <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required style={inputStyle}>
            <option value="">Select Category</option>
            <option value="Student ID / Documents">Student ID / Documents</option>
            <option value="Electronics (Laptop/Phone)">Electronics (Laptop/Phone)</option>
            <option value="Books / Stationery">Books / Stationery</option>
          </select>
          <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required style={{...inputStyle, height: '80px', resize: 'none'}} />
          <input type="text" placeholder="Location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required style={inputStyle} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Date it was lost:</label>
            <input type="date" max={today} value={formData.dateLost} onChange={(e) => setFormData({...formData, dateLost: e.target.value})} required style={inputStyle} />
          </div>
          <input type="tel" placeholder="Contact Number (10 Digits)" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} required style={inputStyle} />
          <button type="submit" style={btnStyle}>Report Item</button>
        </form>
        <Link to="/items" style={{ display: 'block', textAlign: 'center', marginTop: '20px', color: '#003366', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>View All Reported Items →</Link>
      </div>
    </div>
  );
}

// --- 3. List Page  ---
function ListPage() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/lost-items/all');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        await axios.delete(`http://localhost:5001/api/lost-items/delete/${id}`);
        fetchItems();
      } catch (err) { alert("Delete failed"); }
    }
  };

  const handleUpdate = async (id) => {
    if (!editFormData.itemName || !editFormData.description || !editFormData.location || !editFormData.contact) {
      alert("Fields cannot be empty. Please fill in all details before saving.");
      return;
    }
    if (editFormData.contact.length !== 10) {
      alert("Please enter a valid 10-digit contact number.");
      return;
    }
    try {
      await axios.put(`http://localhost:5001/api/lost-items/update/${id}`, editFormData);
      setEditingId(null);
      fetchItems();
    } catch (err) { alert("Update failed"); }
  };

  return (
    <div style={pageBackgroundStyle}>
      <div style={fullOverlayStyle} />
      <div style={{ position: 'relative', width: '100%', padding: '40px', zIndex: 1 }}>
        <Link to="/" style={{ color: '#003366', fontWeight: 'bold', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
          ← Back to Home
        </Link>
        <h2 style={{ textAlign: 'center', color: '#003366', fontSize: '32px', fontWeight: 'bold', marginBottom: '40px' }}>
          Recent Reported Items
        </h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '25px' }}>
          {items.map(item => (
            <div key={item._id} style={cardStyleList}>
              {editingId === item._id ? (
                <div style={{ display: 'grid', gap: '6px', height: '100%', overflowY: 'auto' }}>
                  <input style={smallInput} value={editFormData.itemName} onChange={(e) => setEditFormData({...editFormData, itemName: e.target.value})} required />
                  <select style={smallInput} value={editFormData.category} onChange={(e) => setEditFormData({...editFormData, category: e.target.value})} required>
                    <option value="Student ID / Documents">Student ID / Documents</option>
                    <option value="Electronics (Laptop/Phone)">Electronics (Laptop/Phone)</option>
                    <option value="Books / Stationery">Books / Stationery</option>
                  </select>
                  <textarea style={{...smallInput, height: '50px'}} value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} required />
                  <input style={smallInput} value={editFormData.location} onChange={(e) => setEditFormData({...editFormData, location: e.target.value})} required />
                  <input style={smallInput} value={editFormData.contact} onChange={(e) => setEditFormData({...editFormData, contact: e.target.value})} required />
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => handleUpdate(item._id)} style={{ ...actionBtn, backgroundColor: '#003366' }}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{ ...actionBtn, backgroundColor: '#95a5a6' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}> 
                    <span style={badgeStyle}>{item.category}</span>
                    <h4 style={{ margin: '10px 0 5px 0', color: '#333' }}>{item.itemName}</h4>
                    <p style={{ fontSize: '13px', color: '#e67e22' }}>📍 {item.location}</p>
                    <p style={{ fontSize: '12px', color: '#666' }}>{item.description}</p>
                  </div>
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'bold' }}>📞 {item.contact}</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button onClick={() => { setEditingId(item._id); setEditFormData(item); }} style={{ ...actionBtn, backgroundColor: '#f39c12' }}>Edit</button>
                      <button onClick={() => handleDelete(item._id)} style={{ ...actionBtn, backgroundColor: '#003366' }}>Delete</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Existing Styles  ---
const pageBackgroundStyle = { backgroundImage: `url(${campusBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'Segoe UI', sans-serif" };
const fullOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.4)', zIndex: 0 };
const formContainerStyle = { position: 'relative', maxWidth: '500px', width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', margin: '20px', zIndex: 1 };
const cardStyleList = { backgroundColor: 'white', padding: '15px', borderRadius: '12px', width: '280px', height: '320px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' };
const btnStyle = { padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#003366', color: 'white', fontWeight: 'bold', cursor: 'pointer' };
const badgeStyle = { backgroundColor: '#e1f5fe', color: '#01579b', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' };
const actionBtn = { border: 'none', color: 'white', padding: '8px', borderRadius: '5px', cursor: 'pointer', flex: 1, fontSize: '12px', fontWeight: 'bold' };
const smallInput = { padding: '6px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '12px', width: '100%' };

// --- App Navigation ---
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/report-form" element={<FormPage />} />
        <Route path="/items" element={<ListPage />} />
      </Routes>
    </Router>
  );
}