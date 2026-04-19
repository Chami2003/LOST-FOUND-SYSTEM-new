import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import './Home.css';
import { API_PREFIX } from '../apiConfig';
import InteractiveMap from './InteractiveMap';

function CampusMapPage({
  onTogglePage,
  isAuthenticated,
  currentUser,
  navSearch,
  onNavSearchChange,
  navCategory,
  onNavCategoryChange,
}) {
  const [allItems, setAllItems] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const [lostRes, foundRes] = await Promise.all([
          fetch(`${API_PREFIX}/lost-items/all`).catch(() => null),
          fetch(`${API_PREFIX}/found-items/all`).catch(() => null)
        ]);

        let lostData = [];
        let foundData = [];

        if (lostRes && lostRes.ok) lostData = await lostRes.json();
        if (foundRes && foundRes.ok) foundData = await foundRes.json();

        // Standardize items for InteractiveMap
        const formattedLost = (Array.isArray(lostData) ? lostData : []).map(item => ({
          ...item,
          reportType: 'lost'
        }));
        
        const formattedFound = (Array.isArray(foundData) ? foundData : []).map(item => ({
          ...item,
          reportType: 'found'
        }));

        setAllItems([...formattedLost, ...formattedFound]);
      } catch (err) {
        console.error("Failed to load map items", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleMapClick = (coords) => {
    setSelectedPin(coords);
  };

  const startReport = (type) => {
    if (!isAuthenticated) {
      alert("Please login first to report an item.");
      onTogglePage('login');
      return;
    }
    localStorage.setItem('pendingPin', JSON.stringify(selectedPin));
    localStorage.setItem('pendingReportType', type);
    onTogglePage('report');
  };

  return (
    <div className="home-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        onTogglePage={onTogglePage}
        isAuthenticated={isAuthenticated}
        activePage="campus-map"
        searchValue={navSearch}
        onSearchChange={onNavSearchChange}
        activeCategory={navCategory}
        onCategoryChange={onNavCategoryChange}
      />

      <main style={{ padding: '2rem 5%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ color: '#0f172a', marginBottom: '10px' }}>Campus Map</h1>
        <p style={{ color: '#64748b', marginBottom: '20px', textAlign: 'center' }}>
          Explore reported items on campus. Red pins are Lost items, Green pins are Found items.<br/>
          <strong>Click anywhere on the map to drop a pin and quickly start a new report.</strong>
        </p>

        {loading ? (
           <p>Loading map data...</p>
        ) : (
           <div style={{ position: 'relative', width: '100%', maxWidth: '900px' }}>
              <InteractiveMap 
                items={allItems} 
                selectedPin={selectedPin} 
                onMapClick={handleMapClick} 
                readonly={false} 
              />
              
              {selectedPin && (
                 <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                 }}>
                    <strong style={{ color: '#334155' }}>You dropped a pin! What would you like to do?</strong>
                    <div style={{ display: 'flex', gap: '15px' }}>
                       <button onClick={() => startReport('lost')} className="hero-btn-primary" style={{ backgroundColor: '#e74c3c', border: 'none', padding: '0.6rem 1rem' }}>
                         Report Lost Here
                       </button>
                       <button onClick={() => startReport('found')} className="hero-btn-primary" style={{ backgroundColor: '#2ecc71', border: 'none', padding: '0.6rem 1rem' }}>
                         Report Found Here
                       </button>
                    </div>
                 </div>
              )}
           </div>
        )}
      </main>
    </div>
  );
}

export default CampusMapPage;
