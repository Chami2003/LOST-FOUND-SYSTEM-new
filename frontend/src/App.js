import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from 'react-router-dom';

// --- 1. Form පෙන්වන පිටුව ---
function FormPage() {
  const [formData, setFormData] = useState({
    itemName: '', description: '', category: '', location: '', dateLost: '', contact: ''
  });
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation: දුරකථන අංකය ඉලක්කම් 10ක් විය යුතුයි
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
    <div style={{ padding: '40px', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#eef2f7', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', color: '#003366', marginBottom: '10px' }}>🎓 REPORT LOST ITEM</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Lost Something? We are here to help you</p>
      
      <div style={{ maxWidth: '600px', margin: 'auto', backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
          <input type="text" placeholder="Item Name" value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} required style={inputStyle} />
          <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required style={inputStyle}>
            <option value="">Select Category</option>
            <option value="Student ID / Documents">Student ID / Documents</option>
            <option value="Electronics (Laptop/Phone)">Electronics (Laptop/Phone)</option>
            <option value="Books / Stationery">Books / Stationery</option>
          </select>
          <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required style={{...inputStyle, height: '80px'}} />
          <input type="text" placeholder="Location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required style={inputStyle} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Date it was lost:</label>
            <input type="date" max={today} value={formData.dateLost} onChange={(e) => setFormData({...formData, dateLost: e.target.value})} required style={inputStyle} />
          </div>
          <input type="tel" placeholder="Your Contact Number" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} required style={inputStyle} />
          <button type="submit" style={btnStyle}>Report Item</button>
        </form>
        <Link to="/items" style={{ display: 'block', textAlign: 'center', marginTop: '20px', color: '#003366', textDecoration: 'none', fontWeight: 'bold' }}>View All Reported Items →</Link>
      </div>
    </div>
  );
}

// --- 2. ලැයිස්තුව පෙන්වන සහ සියලුම විස්තර Validations සහිතව Update කළ හැකි පිටුව ---
function ListPage() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const today = new Date().toISOString().split('T')[0];

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/lost-items/all');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await axios.delete(`http://localhost:5001/api/lost-items/delete/${id}`);
        fetchItems();
      } catch (err) { alert("Delete failed"); }
    }
  };

  const handleUpdate = async (id) => {
    // Validation: Update කිරීමේදීත් අංකය පරීක්ෂා කිරීම
    if (editFormData.contact.length !== 10) {
      alert("Please enter a valid 10-digit contact number.");
      return;
    }
    try {
      await axios.put(`http://localhost:5001/api/lost-items/update/${id}`, editFormData);
      alert("Update Successful! ✅");
      setEditingId(null);
      fetchItems();
    } catch (err) { alert("Update failed"); }
  };

  return (
    <div style={{ padding: '40px', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#eef2f7', minHeight: '100vh' }}>
      <Link to="/" style={{ color: '#003366', fontWeight: 'bold', textDecoration: 'none' }}>← Back to Report Form</Link>
      <h2 style={{ textAlign: 'center', color: '#003366' }}>Recent Lost Items</h2>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
        {items.map(item => (
          <div key={item._id} style={cardStyle}>
            {editingId === item._id ? (
              <div style={{ display: 'grid', gap: '8px' }}>
                <input style={smallInput} value={editFormData.itemName} onChange={(e) => setEditFormData({...editFormData, itemName: e.target.value})} />
                
                <select style={smallInput} value={editFormData.category} onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}>
                  <option value="Student ID / Documents">Student ID / Documents</option>
                  <option value="Electronics (Laptop/Phone)">Electronics (Laptop/Phone)</option>
                  <option value="Books / Stationery">Books / Stationery</option>
                </select>

                <input style={smallInput} value={editFormData.location} onChange={(e) => setEditFormData({...editFormData, location: e.target.value})} />
                
                <textarea style={{...smallInput, height: '50px'}} value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} />
                
                {/* Date Validation in Update */}
                <input type="date" max={today} style={smallInput} value={editFormData.dateLost ? editFormData.dateLost.split('T')[0] : ""} onChange={(e) => setEditFormData({...editFormData, dateLost: e.target.value})} />

                <input style={smallInput} value={editFormData.contact} onChange={(e) => setEditFormData({...editFormData, contact: e.target.value})} />

                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => handleUpdate(item._id)} style={{ ...actionBtn, backgroundColor: '#27ae60' }}>Save</button>
                  <button onClick={() => setEditingId(null)} style={{ ...actionBtn, backgroundColor: '#95a5a6' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <span style={badgeStyle}>{item.category}</span>
                <h4 style={{ margin: '15px 0 5px 0' }}>{item.itemName}</h4>
                <p style={{ fontSize: '14px', color: '#d35400' }}>📍 {item.location}</p>
                <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>{item.description}</p>
                <p style={{ fontSize: '12px', fontWeight: 'bold' }}>📞 {item.contact}</p>
                <p style={{ fontSize: '11px', color: '#999' }}>📅 {new Date(item.dateLost).toDateString()}</p>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button onClick={() => { setEditingId(item._id); setEditFormData(item); }} style={{ ...actionBtn, backgroundColor: '#f39c12' }}>Edit</button>
                  <button onClick={() => handleDelete(item._id)} style={{ ...actionBtn, backgroundColor: '#e74c3c' }}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- 3. Main App ---
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FormPage />} />
        <Route path="/items" element={<ListPage />} />
      </Routes>
    </Router>
  );
}

// Styles
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '15px' };
const btnStyle = { padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#003366', color: 'white', fontWeight: 'bold', cursor: 'pointer' };
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '12px', width: '280px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', position: 'relative' };
const badgeStyle = { position: 'absolute', top: '15px', right: '15px', backgroundColor: '#e1f5fe', color: '#01579b', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' };
const actionBtn = { border: 'none', color: 'white', padding: '8px', borderRadius: '5px', cursor: 'pointer', flex: 1, fontSize: '12px', fontWeight: 'bold' };
const smallInput = { padding: '8px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '13px', width: '100%' };