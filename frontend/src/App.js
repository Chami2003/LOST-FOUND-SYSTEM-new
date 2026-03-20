
import './App.css';

function App() {
  return (
    <div style={{ 
      textAlign: 'center', 
      marginTop: '100px', 
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      backgroundColor: '#f4f7f6',
      height: '100vh'
    }}>
      <h1 style={{ color: '#2c3e50', fontSize: '3.5rem', marginBottom: '10px' }}>
        Lost & Found System
      </h1>
      <p style={{ fontSize: '1.3rem', color: '#34495e', maxWidth: '600px', margin: '0 auto 30px' }}>
        Peace of mind - Helping you recover what you've lost.
      </p>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <button style={{ 
          padding: '15px 30px', 
          backgroundColor: '#3498db', 
          color: 'white', 
          border: 'none', 
          borderRadius: '30px',
          fontSize: '1rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)',
          transition: '0.3s'
        }}>
          Lost Items
        </button>
        
        <button style={{ 
          padding: '15px 30px', 
          backgroundColor: '#2ecc71', 
          color: 'white', 
          border: 'none', 
          borderRadius: '30px',
          fontSize: '1rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)',
          transition: '0.3s'
        }}>
          Found Items
        </button>
      </div>
    </div>
  );
}

export default App;
