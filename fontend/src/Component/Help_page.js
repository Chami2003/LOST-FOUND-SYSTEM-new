import React, { useState, useRef, useEffect } from 'react';
import Navbar from './Navbar';
import './Home.css';

const CONTACTS = [
  { name: 'Chamidu', phone: '715613967', display: '71 561 3967' },
  { name: 'Rashmi', phone: '786797411', display: '78 679 7411' },
  { name: 'Kaveesha', phone: '777779477', display: '77 777 9477' },
  { name: 'Ahsan', phone: '778111030', display: '77 811 1030' },
];

function botReply(userText) {
  const t = userText.toLowerCase().trim();
  if (!t) return 'Ask me about lost items, found items, reporting, matching, or auctions.';
  if (/hello|hi\b|hey/.test(t)) return 'Hello! I am the iLost assistant. How can I help you today?';
  if (/lost|lost item/.test(t)) return 'To report a lost item, go to Report Item → choose “I Lost Something” and fill the form. You can add photos and location.';
  if (/found|found item/.test(t)) return 'To report something you found, use Report Item → “I Found Something” and submit details with contact and photos.';
  if (/match|smart match/.test(t)) return 'Smart Match compares lost and found listings by category, name, description, and location. Open Smart match from the nav to see possible pairs.';
  if (/auction|bid/.test(t)) return 'Unmatched items may appear under Auction. Start an auction and place bids; the highest bid wins when the auction ends.';
  if (/contact|phone|call|support|help|human/.test(t)) {
    return 'For direct support, call our team: Chamidu, Rashmi, Kaveesha, or Ahsan — numbers are listed under Contacts on this page.';
  }
  if (/otp|login|password/.test(t)) return 'Use Login with your email and password. OTP is sent to your email for verification. Check spam folder if you do not see it.';
  if (/thank/.test(t)) return 'You are welcome! If you need anything else, type another question or call a contact.';
  return 'I can help with lost/found reporting, matching, auctions, and contacts. Try asking about “report lost”, “smart match”, or “auction”.';
}

function HelpPage({
  onTogglePage,
  isAuthenticated = false,
  navSearch = '',
  onNavSearchChange,
  navCategory = '',
  onNavCategoryChange,
}) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I am the iLost help chatbot. Ask a question or type a keyword (lost, found, match, auction, contact).' },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'bot', text: botReply(text) }]);
    }, 300);
  };

  return (
    <div className="home-container">
      <Navbar
        onTogglePage={onTogglePage}
        isAuthenticated={isAuthenticated}
        activePage="help"
        searchValue={navSearch}
        onSearchChange={onNavSearchChange}
        activeCategory={navCategory}
        onCategoryChange={onNavCategoryChange}
      />

      <main style={{ padding: '2rem 5%', maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ margin: 0, color: '#0f172a' }}>Help & Support</h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Chat with the assistant or reach our team by phone.</p>

        <section style={{ marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#334155', marginBottom: '0.75rem' }}>Chatbot</h2>
          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              background: '#fff',
              overflow: 'hidden',
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
            }}
          >
            <div style={{ padding: '1rem', maxHeight: 320, overflowY: 'auto', background: '#f8fafc', minHeight: 200 }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: '0.65rem',
                    textAlign: msg.role === 'user' ? 'right' : 'left',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      maxWidth: '85%',
                      padding: '0.55rem 0.85rem',
                      borderRadius: 12,
                      background: msg.role === 'user' ? '#2563eb' : '#e2e8f0',
                      color: msg.role === 'user' ? '#fff' : '#1e293b',
                      fontSize: '0.95rem',
                      lineHeight: 1.45,
                    }}
                  >
                    {msg.text}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={send} style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                style={{ flex: 1, padding: '0.65rem 0.85rem', borderRadius: 8, border: '1px solid #cbd5e1' }}
                aria-label="Chat message"
              />
              <button type="submit" className="hero-btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
                Send
              </button>
            </form>
          </div>
        </section>

        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#334155', marginBottom: '0.75rem' }}>Contacts</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.65rem' }}>
            {CONTACTS.map((c) => (
              <li
                key={c.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  padding: '0.85rem 1rem',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                }}
              >
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</span>
                <a href={`tel:+94${c.phone}`} style={{ color: '#2563eb', fontWeight: 600 }}>
                  {c.display}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

export default HelpPage;
