import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';

// --- Styles ---
const styles = {
  input: { display: "block", width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #ddd", boxSizing: "border-box" },
  button: { width: "100%", padding: "12px", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" },
  th: { padding: "15px", textAlign: "left", borderBottom: "2px solid #ddd" },
  td: { padding: "12px", textAlign: "left" },
  editBtn: { padding: "5px 10px", backgroundColor: "#f1c40f", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginRight: "5px" },
  deleteBtn: { padding: "5px 10px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" },
  nav: { marginBottom: "30px", display: "flex", justifyContent: "center", gap: "25px", background: "#2c3e50", padding: "15px", borderRadius: "10px" },
  navLink: { textDecoration: 'none', color: 'white', fontWeight: 'bold', fontSize: '18px' }
};

function App() {
  const [inputs, setInputs] = useState({
    itemName: '', description: '', category: '', location: '', dateFound: '', contact: ''
  });
  const [items, setItems] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const campusCategories = ["ID Card", "Student Record Book", "Laptop/Charger", "Mobile Phone", "Calculator", "Water Bottle", "Bag/Folder", "Wallet/Purse", "Other"];
  const today = new Date().toISOString().split('T')[0];

  // දත්ත ලබා ගැනීම
  const fetchItems = async () => {
    try {
      const response = await axios.get("http://localhost:5001/api/found-items/all");
      if (Array.isArray(response.data)) {
        setItems(response.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // දත්ත මකා දැමීම
  const deleteItem = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await axios.delete(`http://localhost:5001/api/found-items/delete/${id}`);
        alert("Item deleted successfully!");
        fetchItems();
      } catch (err) {
        alert("Could not delete the item.");
      }
    }
  };

  // --- Main Layout ---
  return (
    <Router>
      <div className="App" style={{ padding: "30px", textAlign: "center", backgroundColor: "#f4f7f6", minHeight: "100vh" }}>
        <h1 style={{ color: "#2c3e50", marginBottom: "30px" }}>Campus Lost & Found System</h1>
        
        {/* Navigation Bar */}
        <nav style={styles.nav}>
          <Link to="/" style={styles.navLink}>Register Item</Link>
          <Link to="/items" style={styles.navLink}>View Items List</Link>
        </nav>

        <Routes>
          {/* Page 1: Registration Form */}
          <Route path="/" element={
            <RegistrationPage 
              inputs={inputs} setInputs={setInputs} 
              isEditing={isEditing} setIsEditing={setIsEditing}
              currentId={currentId} setCurrentId={setCurrentId}
              fetchItems={fetchItems} campusCategories={campusCategories} today={today}
            />
          } />

          {/* Page 2: Items Table */}
          <Route path="/items" element={
            <ListPage 
              items={items} deleteItem={deleteItem} 
              setInputs={setInputs} setIsEditing={setIsEditing} setCurrentId={setCurrentId}
            />
          } />
        </Routes>
      </div>
    </Router>
  );
}

// --- Registration Page Content ---
function RegistrationPage({ inputs, setInputs, isEditing, setIsEditing, currentId, setCurrentId, fetchItems, campusCategories, today }) {
  const navigate = useNavigate();

  const handleChange = (e) => setInputs({ ...inputs, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputs.contact.length !== 10 || !/^\d+$/.test(inputs.contact)) {
      alert("Please enter a valid 10-digit contact number.");
      return;
    }

    try {
      if (isEditing) {
        await axios.put(`http://localhost:5001/api/found-items/update/${currentId}`, inputs);
        alert("Item updated successfully!");
        setIsEditing(false);
        setCurrentId(null);
      } else {
        await axios.post("http://localhost:5001/api/found-items/add", inputs);
        alert("Item added successfully!");
      }
      setInputs({ itemName: '', description: '', category: '', location: '', dateFound: '', contact: '' });
      fetchItems();
      navigate('/items'); // Submit කළ පසු Table එකට යයි
    } catch (err) {
      alert("Error connecting to server.");
    }
  };

  return (
    <div style={{ maxWidth: "450px", margin: "auto", background: "#fff", padding: "30px", borderRadius: "15px", boxShadow: "0px 4px 10px rgba(0,0,0,0.1)" }}>
      <h2 style={{ color: "#34495e" }}>{isEditing ? "Update Item" : "Register Found Item"}</h2>
      <form onSubmit={handleSubmit}>
        <input name="itemName" value={inputs.itemName} placeholder="Item Name" onChange={handleChange} style={styles.input} required />
        <input name="description" value={inputs.description} placeholder="Description" onChange={handleChange} style={styles.input} required />
        <select name="category" value={inputs.category} onChange={handleChange} style={styles.input} required>
          <option value="">-- Select Category --</option>
          {campusCategories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
        </select>
        <input name="location" value={inputs.location} placeholder="Location Found" onChange={handleChange} style={styles.input} required />
        <div style={{textAlign: 'left', fontSize: '12px', color: '#7f8c8d'}}>Date Found:</div>
        <input type="date" name="dateFound" value={inputs.dateFound} max={today} onChange={handleChange} style={styles.input} required />
        <input name="contact" value={inputs.contact} placeholder="Contact Number" onChange={handleChange} style={styles.input} required maxLength="10" />
        <button type="submit" style={{ ...styles.button, backgroundColor: isEditing ? "#3498db" : "#2ecc71" }}>
          {isEditing ? "Update Item" : "Submit Item"}
        </button>
      </form>
    </div>
  );
}

// --- List Page Content ---
function ListPage({ items, deleteItem, setInputs, setIsEditing, setCurrentId }) {
  const navigate = useNavigate();

  const handleEdit = (item) => {
    setIsEditing(true);
    setCurrentId(item._id);
    setInputs({
      itemName: item.itemName,
      description: item.description,
      category: item.category,
      location: item.location,
      dateFound: item.dateFound ? item.dateFound.split('T')[0] : '',
      contact: item.contact
    });
    navigate('/'); // Edit කිරීමට Form එකට යයි
  };

  return (
    <div>
      <h2 style={{ color: "#2c3e50" }}>Reported Found Items</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ margin: "20px auto", width: "95%", borderCollapse: "collapse", backgroundColor: "white" }}>
          <thead>
            <tr style={{ backgroundColor: "#34495e", color: "white" }}>
              <th style={styles.th}>Item</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={styles.td}>{item.itemName}</td>
                <td style={styles.td}>{item.category}</td>
                <td style={styles.td}>{item.location}</td>
                <td style={styles.td}>{item.dateFound ? new Date(item.dateFound).toLocaleDateString() : 'N/A'}</td>
                <td style={styles.td}>{item.contact}</td>
                <td style={styles.td}>
                  <button onClick={() => handleEdit(item)} style={styles.editBtn}>Edit</button>
                  <button onClick={() => deleteItem(item._id)} style={styles.deleteBtn}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;