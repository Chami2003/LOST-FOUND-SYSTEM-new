import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import sliitCampusImg from './sliit-campus.jpg'; 

// --- Styles ---
const styles = {
  input: { display: "block", width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #ddd", boxSizing: "border-box" },
  button: { width: "100%", padding: "12px", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" },
  th: { padding: "15px", textAlign: "left", borderBottom: "2px solid #ddd" },
  td: { padding: "12px", textAlign: "left" },
  editBtn: { padding: "5px 10px", backgroundColor: "#f18f0f", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginRight: "5px" },
  deleteBtn: { padding: "5px 10px", backgroundColor: "#2c3e50", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" },
  nav: { marginBottom: "30px", display: "flex", justifyContent: "center", gap: "25px", background: "rgba(44, 62, 80, 0.9)", padding: "15px", borderRadius: "10px" },
  navLink: { textDecoration: 'none', color: 'white', fontWeight: 'bold', fontSize: '18px' },
  // Home Page Styles
  heroSection: { color: "white", padding: "60px 20px", borderRadius: "15px" },
  cardContainer: { display: "flex", justifyContent: "center", gap: "30px", marginTop: "40px", flexWrap: "wrap" },
  card: { background: "rgba(255, 255, 255, 0.15)", backdropFilter: "blur(10px)", padding: "40px", borderRadius: "20px", width: "300px", border: "1px solid rgba(255,255,255,0.2)", textAlign: "center", color: "white" }
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

  return (
    <Router>
      <div className="App" style={{ 
        padding: "30px", 
        textAlign: "center", 
        minHeight: "100vh",
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${sliitCampusImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        
        {/* show navigation bar all pages*/}
        <nav style={styles.nav}>
          <Link to="/" style={styles.navLink}>Home</Link>
          <Link to="/register" style={styles.navLink}>Register Item</Link>
          <Link to="/items" style={styles.navLink}>View Items List</Link>
        </nav>

        <Routes>
          {/* 1st Page: Home Page */}
          <Route path="/" element={<HomePage />} />

          {/* Registration Form Page */}
          <Route path="/register" element={
            <RegistrationPage 
              inputs={inputs} setInputs={setInputs} 
              isEditing={isEditing} setIsEditing={setIsEditing}
              currentId={currentId} setCurrentId={setCurrentId}
              fetchItems={fetchItems} campusCategories={campusCategories} today={today}
            />
          } />

          <Route path="/items" element={
            <ListPage 
              items={items} deleteItem={deleteItem} 
              setInputs={setInputs} setIsEditing={setIsEditing} setCurrentId={setCurrentId}
            />
          } />

          <Route path="/success" element={<SuccessPage />} />
        </Routes>
      </div>
    </Router>
  );
}

// --- 1st Page: HomePage Content ---
function HomePage() {
  const navigate = useNavigate();

  return (
    <div style={styles.heroSection}>
      <h1 style={{ fontSize: "3rem", marginBottom: "10px" }}>How can we help you today?</h1>
      <p style={{ fontSize: "1.2rem", opacity: "0.9" }}>
        Welcome to the University's official lost and found portal. Reconnecting you with your misplaced belongings quickly and easily.
      </p>

      <div style={styles.cardContainer}>
        {/* I Lost Something Card */}
        <div style={styles.card}>
          <div style={{ fontSize: "50px", marginBottom: "20px" }}>❌</div>
          <h3>I Lost Something</h3>
          <p style={{ fontSize: "14px", margin: "15px 0" }}>Submit a report for your lost item to our campus database.</p>
          <button onClick={() => alert("Lost Item feature coming soon!")} style={{ ...styles.button, backgroundColor: "#e67e22" }}>Report Lost</button>
        </div>

        {/* I Found Something Card */}
        <div style={styles.card}>
          <div style={{ fontSize: "50px", marginBottom: "20px" }}>✔️</div>
          <h3>I Found Something</h3>
          <p style={{ fontSize: "14px", margin: "15px 0" }}>Help a fellow student by reporting an item you've found.</p>
          <button onClick={() => navigate('/register')} style={{ ...styles.button, background: "rgba(255,255,255,0.2)", border: "1px solid white" }}>Report Found</button>
        </div>
      </div>

      <div style={{ marginTop: "50px", display: "flex", justifyContent: "center", gap: "40px", fontSize: "1.5rem" }}>
        <div><strong>100+</strong> <p style={{ fontSize: "14px" }}>Items Reported</p></div>
        <div><strong>50+</strong> <p style={{ fontSize: "14px" }}>Returned Successfully</p></div>
      </div>
      <footer style={{ marginTop: "40px", fontSize: "12px", opacity: "0.7" }}>
        © 2026 Campus Lost & Found System | Secure Student Portal
      </footer>
    </div>
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
        navigate('/items'); 
      } else {
        await axios.post("http://localhost:5001/api/found-items/add", inputs);
        setInputs({ itemName: '', description: '', category: '', location: '', dateFound: '', contact: '' });
        fetchItems();
        navigate('/success'); 
      }
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
        <button type="submit" style={{ ...styles.button, backgroundColor: "#2c3e50" }}>
          {isEditing ? "Update Item" : "Submit Item"}
        </button>
      </form>
    </div>
  );
}

// --- Success Page Content ---
function SuccessPage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto", textAlign: "center", background: "#fff", padding: "40px", borderRadius: "20px", boxShadow: "0px 10px 30px rgba(0,0,0,0.1)" }}>
      <div style={{ fontSize: "60px", color: "#f1c40f", marginBottom: "20px" }}>🕒</div>
      <h1 style={{ color: "#27ae60", marginBottom: "10px" }}>Report Submitted!</h1>
      <p style={{ color: "#7f8c8d", fontSize: "16px" }}>Your report is currently under review</p>

      <div style={{ background: "#fdfefe", border: "1px solid #e1e8ed", borderRadius: "15px", padding: "20px", marginTop: "30px", textAlign: "left" }}>
        <h4 style={{ color: "#2c3e50", display: "flex", alignItems: "center", gap: "10px", margin: "0 0 15px 0" }}>
          <span style={{ color: "#27ae60" }}>✔</span> Verification Process
        </h4>
        <div style={{ background: "#fff9db", padding: "15px", borderRadius: "10px", borderLeft: "5px solid #f1c40f", marginBottom: "20px" }}>
          <strong style={{ color: "#856404" }}>Your report is under review by Admin</strong>
          <p style={{ fontSize: "13px", color: "#856404", marginTop: "5px", margin: 0 }}>
            Our administrators will verify your submission and check for any policy violations. This process typically takes 1-2 business days.
          </p>
        </div>
        <p style={{ fontWeight: "bold", color: "#2c3e50", fontSize: "14px", marginBottom: "10px" }}>What happens next?</p>
        <ul style={{ color: "#34495e", lineHeight: "1.8", fontSize: "13px", paddingLeft: "20px" }}>
          <li>Admin reviews your report for completeness and accuracy</li>
          <li>Your item will be published to the public listing upon approval</li>
          <li>You'll receive notifications about any matches or updates</li>
        </ul>
      </div>

      <div style={{ marginTop: "30px", display: "flex", gap: "15px", justifyContent: "center" }}>
        <button onClick={() => navigate('/items')} style={{ padding: "12px 25px", background: "#2c3e50", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
          Done
        </button>
        <button onClick={() => navigate('/')} style={{ padding: "12px 25px", background: "#fff", color: "#2c3e50", border: "1px solid #ddd", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
          Back to Dashboard
        </button>
      </div>
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
    navigate('/register'); 
  };

  return (
    <div>
      <h2 style={{ color: "white" }}>Reported Found Items</h2>
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