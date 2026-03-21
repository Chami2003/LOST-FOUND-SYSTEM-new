import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [formData, setFormData] = useState({
    itemName: '', description: '', category: '', location: '', dateLost: '', contact: ''
  });
  const [items, setItems] = useState([]);

  // අද දිනය ලබා ගැනීම (අනාගත දින වැළැක්වීමට)
  const today = new Date().toISOString().split('T')[0];

  const fetchItems = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/lost-items/all');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Fetch error:", err); }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // දුරකථන අංකය පරීක්ෂා කිරීම (ශ්‍රී ලංකාවේ අංක සඳහා)
    if (formData.contact.length < 10) {
      alert("Please enter a valid 10-digit contact number.");
      return;
    }

    try {
      await axios.post('http://localhost:5001/api/lost-items/add', formData);
      alert("Item Reported Successfully! 🎉");
      setFormData({ itemName: '', description: '', category: '', location: '', dateLost: '', contact: '' });
      fetchItems();
    } catch (err) { alert("Failed to submit. Please check your data."); }
  };

  return (
    <div style={{ padding: '40px', fontFamily: "'Segoe UI', sans-serif", backgroundColor: '#eef2f7', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', color: '#003366', marginBottom: '10px' }}>🎓 REPORT LOST ITEM</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>Lost Something? We are here to help </p>
      
      <div style={{ maxWidth: '600px', margin: 'auto', backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
          
          <input 
            type="text" placeholder="Item Name (e.g. ID Card, Wallet)" 
            value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} 
            required style={inputStyle} 
          />

          <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} required style={inputStyle}>
            <option value="">Select Category</option>
            <option value="Student ID / Documents">Student ID / Documents</option>
            <option value="Electronics (Laptop/Phone)">Electronics (Laptop/Phone)</option>
            <option value="Books / Stationery">Books / Stationery</option>
            <option value="Clothing / Bags">Clothing / Bags</option>
            <option value="Keys / Accessories">Keys / Accessories</option>
          </select>

          <textarea placeholder="Description (Color, Brand, etc.)" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required style={{...inputStyle, height: '80px'}} />
          
          <input type="text" placeholder="Location where it was lost (e.g. Library, Canteen)" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required style={inputStyle} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#555' }}>Date it was lost:</label>
            <input 
              type="date" 
              max={today} // අනාගත දින තේරීම අවහිර කරයි
              value={formData.dateLost} onChange={(e) => setFormData({...formData, dateLost: e.target.value})} 
              required style={inputStyle} 
            />
          </div>

          <input 
            type="tel" placeholder="Your Contact Number" 
            value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} 
            required style={inputStyle} 
          />

          <button type="submit" style={btnStyle}>Report Item</button>
        </form>
      </div>

      <h2 style={{ textAlign: 'center', marginTop: '50px', color: '#003366' }}>Recent Reports</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
        {items.map(item => (
          <div key={item._id} style={cardStyle}>
            <span style={badgeStyle}>{item.category}</span>
            <h4 style={{ margin: '15px 0 5px 0' }}>{item.itemName}</h4>
            <p style={{ fontSize: '14px', color: '#d35400' }}>📍 {item.location}</p>
            <p style={{ fontSize: '13px', color: '#666' }}>{item.description}</p>
            <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '10px', fontSize: '12px' }}>
              <strong>📞 Contact:</strong> {item.contact} <br/>
              <strong>📅 Date:</strong> {new Date(item.dateLost).toDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '15px' };
const btnStyle = { padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#003366', color: 'white', fontWeight: 'bold', cursor: 'pointer' };
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '12px', width: '280px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', position: 'relative' };
const badgeStyle = { position: 'absolute', top: '15px', right: '15px', backgroundColor: '#e1f5fe', color: '#01579b', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' };

export default App;