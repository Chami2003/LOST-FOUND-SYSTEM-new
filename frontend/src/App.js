import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [inputs, setInputs] = useState({
    itemName: '', description: '', category: '', location: '', dateFound: '', contact: ''
  });

  const [items, setItems] = useState([]); 
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // List of categories suitable for a campus environment
  const campusCategories = [
    "ID Card", "Student Record Book", "Laptop/Charger", 
    "Mobile Phone", "Calculator", "Water Bottle", 
    "Bag/Folder", "Wallet/Purse", "Other"
  ];

  // Validation to prevent future date selection
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

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 

    // Validation: Contact Number must be exactly 10 digits
    if (inputs.contact.length !== 10) {
      alert("Please enter a valid 10-digit contact number.");
      return;
    }

    // Validation: Only digits allowed for contact number
    if (!/^\d+$/.test(inputs.contact)) {
      alert("Contact number should only contain digits.");
      return;
    }

    try {
      if (isEditing) {
        // Handle Update
        const response = await axios.put(`http://localhost:5001/api/found-items/update/${currentId}`, inputs);
        if(response.status === 200) {
          alert("Item updated successfully!");
          setIsEditing(false);
          setCurrentId(null);
        }
      } else {
        // Handle Add New
        await axios.post("http://localhost:5001/api/found-items/add", inputs);
        alert("Item added to the database successfully!");
      }

      // Reset form fields
      setInputs({ itemName: '', description: '', category: '', location: '', dateFound: '', contact: '' });
      fetchItems(); 
    } catch (err) {
      console.error("Submission error:", err);
      alert("An error occurred while connecting to the server.");
    }
  };

  const editItem = (item) => {
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
  };

  const deleteItem = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await axios.delete(`http://localhost:5001/api/found-items/delete/${id}`);
        alert("Item deleted successfully!");
        fetchItems();
      } catch (err) {
        console.error("Delete error:", err);
        alert("Could not delete the item.");
      }
    }
  };

  return (
    <div className="App" style={{ padding: "50px", textAlign: "center", backgroundColor: "#f4f7f6", minHeight: "100vh" }}>
      <h1 style={{ color: "#2c3e50" }}>Found Item Form</h1>
      
      <div style={{ maxWidth: "450px", margin: "auto", background: "#fff", padding: "30px", borderRadius: "15px", boxShadow: "0px 4px 10px rgba(0,0,0,0.1)" }}>
        <h2 style={{ marginBottom: "20px", color: "#34495e" }}>{isEditing ? "Update Item Details" : "Register Found Item"}</h2>
        
        <form onSubmit={handleSubmit}>
          <input name="itemName" value={inputs.itemName} placeholder="Item Name (e.g. Dell Laptop)" onChange={handleChange} style={styles.input} required />
          <input name="description" value={inputs.description} placeholder="Short Description" onChange={handleChange} style={styles.input} required />
          
          <select name="category" value={inputs.category} onChange={handleChange} style={styles.input} required>
            <option value="">-- Select Category --</option>
            {campusCategories.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </select>

          <input name="location" value={inputs.location} placeholder="Found Location (e.g. Lab 01)" onChange={handleChange} style={styles.input} required />
          
          <div style={{textAlign: 'left', fontSize: '12px', marginBottom: '5px', color: '#7f8c8d'}}>Date Found:</div>
          <input type="date" name="dateFound" value={inputs.dateFound} max={today} onChange={handleChange} style={styles.input} required />
          
          <input 
            name="contact" 
            value={inputs.contact} 
            placeholder="Contact Number (10 digits)" 
            onChange={handleChange} 
            style={styles.input} 
            required 
            maxLength="10" 
          />
          
          <button type="submit" style={{...styles.button, backgroundColor: isEditing ? "#3498db" : "#2ecc71"}}>
            {isEditing ? "Update Item" : "Submit Found Item"}
          </button>
          
          {isEditing && (
            <button onClick={() => {setIsEditing(false); setInputs({itemName:'', description:'', category:'', location:'', dateFound:'', contact:''})}} 
                    style={{ marginTop: "10px", color: "#e74c3c", border: "none", background: "none", cursor: "pointer", textDecoration: "underline" }}>
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <h2 style={{ marginTop: "40px", color: "#2c3e50" }}>Reported Found Items</h2>
      <div style={{ overflowX: "auto" }}>
          <table style={{ margin: "20px auto", width: "95%", borderCollapse: "collapse", backgroundColor: "white", boxShadow: "0px 0px 10px rgba(0,0,0,0.1)" }}>
            <thead>
              <tr style={{ backgroundColor: "#34495e", color: "white" }}>
                <th style={styles.th}>Item Name</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Location</th>
                <th style={styles.th}>Date Found</th>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item._id} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={styles.td}>{item.itemName}</td>
                    <td style={styles.td}>{item.category}</td>
                    <td style={styles.td}>{item.location}</td>
                    <td style={styles.td}>{item.dateFound ? new Date(item.dateFound).toLocaleDateString() : 'N/A'}</td>
                    <td style={styles.td}>{item.contact}</td>
                    <td style={styles.td}>
                      <button onClick={() => editItem(item)} style={styles.editBtn}>Edit</button>
                      <button onClick={() => deleteItem(item._id)} style={styles.deleteBtn}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ padding: "20px" }}>No items found in the database.</td>
                </tr>
              )}
            </tbody>
          </table>
      </div>
    </div>
  );
}

const styles = {
  input: { display: "block", width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #ddd", boxSizing: "border-box" },
  button: { width: "100%", padding: "12px", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" },
  th: { padding: "15px", textAlign: "left", borderBottom: "2px solid #ddd" },
  td: { padding: "12px", textAlign: "left" },
  editBtn: { padding: "5px 10px", backgroundColor: "#f1c40f", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginRight: "5px" },
  deleteBtn: { padding: "5px 10px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }
};

export default App;