import React from 'react';
import './Home.css';
import Navbar from './Navbar';

function sectionMatchesSearch(query, ...textParts) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const blob = textParts.join(' ').toLowerCase();
  return blob.includes(q);
}

function FadeInSection(props) {
  const [isVisible, setVisible] = React.useState(false);
  const domRef = React.useRef();
  
  React.useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      });
    });
    
    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, []);
  
  return (
    <div
      className={`fade-in-section ${isVisible ? 'is-visible' : ''}`}
      ref={domRef}
    >
      {props.children}
    </div>
  );
}

function Home({ onTogglePage, isAuthenticated = false, navSearch = '', onNavSearchChange, navCategory = '', onNavCategoryChange }) {
  const searchQ = String(navSearch || '').trim();
  const filtering = Boolean(searchQ);

  const showF1 = sectionMatchesSearch(
    navSearch,
    'Securely Return Found Items with an Automated Verification Process',
    'Returning a found item to the rightful owner automatically launches a verification process in which various forms of ID can be requested, signatures captured, and notes made regarding how the item is to be returned and if a reward is due.'
  );
  const showF2 = sectionMatchesSearch(
    navSearch,
    'Proactively Manage Unclaimed Property using Notifications',
    'Reduce the strain and expense of managing and storing unclaimed property using automated notifications that signal when items have exceeded a customizable Hold Until date and are ready for disposal. Notifications can be sent immediately or scheduled at regular intervals.'
  );
  const showF3 = sectionMatchesSearch(
    navSearch,
    'Speed Time to Entry Using a System You Configure',
    'Speed the time to capture details about a lost or found item using easily configurable dropdown menus and an unlimited number of selections you create to match the specific terminology and use of individual locations, departments, and teams.'
  );
  const showF4 = sectionMatchesSearch(
    navSearch,
    'Rapidly Reunite Owners with Items using Smart Matching',
    'One-button click initiates an automatic search to smartly match found items to current reports, saving time and reliably pinpointing matches using category, description, and location metadata.'
  );
  const showHero = sectionMatchesSearch(
    navSearch,
    'Smart Lost & Found Management System',
    'Streamline the entire lost and found process. Accurately track, match, verify, and return lost property with ease.'
  );
  const showCta = sectionMatchesSearch(
    navSearch,
    'Ready to upgrade your Lost & Found?',
    'Join organizations everywhere using iLost to simplify property management.'
  );

  const anyFeature = showF1 || showF2 || showF3 || showF4;

  return (
    <div className="home-container">
      {/* Navigation Bar */}
      <Navbar
        onTogglePage={onTogglePage}
        isAuthenticated={isAuthenticated}
        activePage="home"
        searchValue={navSearch}
        onSearchChange={onNavSearchChange}
        activeCategory={navCategory}
        onCategoryChange={onNavCategoryChange}
      />

      {filtering ? (
        <div className="home-search-banner" role="status">
          <span>
            Filtering Home by “<strong>{searchQ}</strong>” — feature blocks that match stay visible.
          </span>
          <button type="button" className="home-search-clear" onClick={() => onNavSearchChange?.('')}>
            Clear search
          </button>
        </div>
      ) : null}

      {/* Hero Section */}
      {showHero || !filtering ? (
      <header className="home-hero">
        <div className="hero-content">
          <h1 className="hero-title">Smart Lost & Found Management System</h1>
          <p className="hero-subtitle">
            Streamline the entire lost and found process. Accurately track, match, verify, and return lost property with ease.
          </p>
          <div className="hero-actions">
            <button onClick={() => onTogglePage('create')} className="hero-btn-primary">Create Account</button>
            <button onClick={() => onTogglePage('login')} className="hero-btn-secondary">Request Demo</button>
          </div>
        </div>
        <div className="hero-image-container">
          <img src={require('../assets/lost_found_bg.png')} alt="Lost and Found Illustration" className="hero-image" />
        </div>
      </header>
      ) : null}

      {/* Features Section */}
      <section className="home-features-detailed">
        {/* Feature 1 */}
        {showF1 || !filtering ? (
        <FadeInSection>
          <div className="feature-row">
            <div className="feature-image-container">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80" alt="Secure Verification" className="feature-row-img" />
            </div>
            <div className="feature-text-container">
              <h2>Securely Return Found Items with an Automated Verification Process</h2>
              <p>Returning a found item to the rightful owner automatically launches a verification process in which various forms of ID can be requested, signatures captured, and notes made regarding how the item is to be returned and if a reward is due.</p>
            </div>
          </div>
        </FadeInSection>
        ) : null}

        {/* Feature 2 (Reversed) */}
        {showF2 || !filtering ? (
        <FadeInSection>
          <div className="feature-row feature-row-reverse" style={{ backgroundColor: '#0f172a', color: 'white' }}>
            <div className="feature-image-container">
              <img src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80" alt="Manage Unclaimed Property" className="feature-row-img" />
            </div>
            <div className="feature-text-container">
              <h2 style={{ color: 'white' }}>Proactively Manage Unclaimed Property using Notifications</h2>
              <p style={{ color: '#cbd5e1' }}>Reduce the strain and expense of managing and storing unclaimed property using automated notifications that signal when items have exceeded a customizable Hold Until date and are ready for disposal. Notifications can be sent immediately or scheduled at regular intervals.</p>
            </div>
          </div>
        </FadeInSection>
        ) : null}

        {/* Feature 3 */}
        {showF3 || !filtering ? (
        <FadeInSection>
          <div className="feature-row">
            <div className="feature-image-container">
              <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80" alt="Speed Time to Entry" className="feature-row-img" />
            </div>
            <div className="feature-text-container">
              <h2>Speed Time to Entry Using a System You Configure</h2>
              <p>Speed the time to capture details about a lost or found item using easily configurable dropdown menus and an unlimited number of selections you create to match the specific terminology and use of individual locations, departments, and teams.</p>
            </div>
          </div>
        </FadeInSection>
        ) : null}

        {/* Feature 4 (Reversed) */}
        {showF4 || !filtering ? (
        <FadeInSection>
          <div className="feature-row feature-row-reverse bg-light-gray">
            <div className="feature-image-container">
              <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80" alt="Smart Matching" className="feature-row-img" />
            </div>
            <div className="feature-text-container">
              <h2>Rapidly Reunite Owners with Items using Smart Matching</h2>
              <p>One-button click initiates an automatic search to smartly match found items to current reports, saving time and reliably pinpointing matches using category, description, and location metadata.</p>
            </div>
          </div>
        </FadeInSection>
        ) : null}

        {filtering && !anyFeature ? (
          <p className="home-search-no-features">No feature sections match “{searchQ}”. Try words like <em>verification</em>, <em>notifications</em>, <em>matching</em>, or <em>entry</em>.</p>
        ) : null}
      </section>

      {/* Call to Action Section */}
      {showCta || !filtering ? (
      <FadeInSection>
        <section className="home-cta">
          <h2>Ready to upgrade your Lost & Found?</h2>
          <p>Join organizations everywhere using iLost to simplify property management.</p>
          <button onClick={() => onTogglePage('create')} className="cta-btn-large">Create an Account Today</button>
        </section>
      </FadeInSection>
      ) : null}

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand">iLost System</div>
          <div className="footer-links">
            <button className="footer-link-btn">Privacy Policy</button>
            <button className="footer-link-btn">Terms of Service</button>
            <button className="footer-link-btn">Contact Us</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
