import React, { useRef } from 'react';

// Using public folder image to avoid React compile errors if the file is missing
const campusImg = "/campus-map.jpg"; 

const InteractiveMap = ({ items = [], selectedPin = null, onMapClick, readonly = false }) => {
  const mapRef = useRef(null);

  const handleImageClick = (e) => {
    if (readonly || !onMapClick) return;

    // Get the dimensions and position of the map image
    const rect = mapRef.current.getBoundingClientRect();
    
    // Calculate click coordinates relative to the top-left of the image
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to percentages so it scales properly on different screen sizes
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    onMapClick({ x: xPercent, y: yPercent });
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '900px', margin: '0 auto', overflow: 'hidden', borderRadius: '12px', border: '2px solid #ddd', cursor: readonly ? 'default' : 'crosshair', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      {/* Background Campus Map */}
      <img
        ref={mapRef}
        src={campusImg}
        alt="Campus Map"
        onClick={handleImageClick}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />

      {/* Render all existing items */}
      {items.map((item, index) => {
        if (!item.mapCoordinates || item.mapCoordinates.x == null || item.mapCoordinates.y == null) return null;
        
        const isLost = item.reportType === 'lost' || !item.dateFound; 
        const pinColor = isLost ? '#e74c3c' : '#2ecc71'; // Red for lost, Green for found

        return (
          <div
            key={item._id || index}
            title={`${item.itemName || 'Item'} - ${item.location || ''}`}
            style={{
              position: 'absolute',
              left: `${item.mapCoordinates.x}%`,
              top: `${item.mapCoordinates.y}%`,
              transform: 'translate(-50%, -100%)', // Anchor pin at the bottom tip
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            {/* Simple CSS Pin */}
            <div style={{
              width: '20px',
              height: '30px',
              backgroundColor: pinColor,
              borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '-2px 2px 5px rgba(0,0,0,0.3)',
              border: '2px solid white'
            }}>
               <div style={{
                   width: '8px',
                   height: '8px',
                   backgroundColor: 'white',
                   borderRadius: '50%',
               }} />
            </div>
            {/* Optional text label beneath the pin */}
            {readonly && (
                <div style={{
                    position: 'absolute',
                    top: '32px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(255,255,255,0.9)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    whiteSpace: 'nowrap',
                    fontWeight: 'bold',
                    color: '#333',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}>
                    {item.itemName}
                </div>
            )}
          </div>
        );
      })}

      {/* Render actively selected pin (when user is creating a report) */}
      {selectedPin && selectedPin.x != null && selectedPin.y != null && (
        <div
          style={{
            position: 'absolute',
            left: `${selectedPin.x}%`,
            top: `${selectedPin.y}%`,
            transform: 'translate(-50%, -100%)', 
            zIndex: 20
          }}
        >
          {/* Active Drop Pin */}
          <div style={{
            width: '24px',
            height: '34px',
            backgroundColor: '#3498db', // Blue for pending selection
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '-2px 2px 5px rgba(0,0,0,0.5)',
            border: '2px solid white',
            animation: 'bounce 1s infinite alternate'
          }}>
             <div style={{ width: '10px', height: '10px', backgroundColor: 'white', borderRadius: '50%' }} />
          </div>
          <div style={{
             position: 'absolute', top: '38px', left: '50%', transform: 'translateX(-50%)',
             background: '#3498db', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', whiteSpace: 'nowrap', fontWeight: 'bold'
          }}>
              Your Pin
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
            0% { transform: translateY(0); }
            100% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

export default InteractiveMap;
