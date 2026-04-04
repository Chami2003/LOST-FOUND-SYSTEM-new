import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import './Matching.css';
import defaultItemImg from '../assets/lost_found_bg.png';
import { API_PREFIX } from '../apiConfig';

async function parseJsonArrayResponse(res, label) {
  const text = await res.text();
  const trimmed = text.trimStart();
  if (trimmed.startsWith('<')) {
    throw new Error(
      'The app received a web page instead of API data. Start the backend on port 5001 and refresh.'
    );
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${label} returned invalid JSON.`);
  }
  return data;
}
const MESSAGE_THRESHOLD = 70;

function digitsOnly(raw) {
  return String(raw || '').replace(/\D/g, '');
}

/** WhatsApp */
function toWhatsAppDigits(raw) {
  const d = digitsOnly(raw);
  if (!d) return '';
  if (d.length === 10 && d.startsWith('0')) return `94${d.slice(1)}`;
  if (d.length === 9) return `94${d}`;
  if (d.length === 11 && d.startsWith('94')) return d;
  return d;
}

function buildIntroMessage(lost, found, score) {
  return `Hi — iLost possible match (${score}%): lost “${lost.itemName}” ↔ found “${found.itemName}”. Can we verify?`;
}

function ContactMatchActions({ lost, found, score }) {
  const intro = buildIntroMessage(lost, found, score);
  const text = encodeURIComponent(intro);
  const lostD = digitsOnly(lost.contact);
  const foundD = digitsOnly(found.contact);
  const lostWa = toWhatsAppDigits(lost.contact);
  const foundWa = toWhatsAppDigits(found.contact);

  const smsLost = lostD ? `sms:${lostD}?body=${text}` : null;
  const smsFound = foundD ? `sms:${foundD}?body=${text}` : null;
  const waLost = lostWa ? `https://wa.me/${lostWa}?text=${text}` : null;
  const waFound = foundWa ? `https://wa.me/${foundWa}?text=${text}` : null;

  return (
    <div className="matching-card-footer">
      <p className="matching-card-footer-title">
        Match {MESSAGE_THRESHOLD}%+ — contact owner or finder
      </p>
      <div className="matching-contact-grid">
        <div className="matching-contact-col">
          <span className="matching-contact-label">Owner (reported lost)</span>
          <div className="matching-contact-btns">
            {waLost ? (
              <a className="matching-msg-btn matching-msg-btn--wa" href={waLost} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            ) : null}
            {smsLost ? (
              <a className="matching-msg-btn" href={smsLost}>
                SMS
              </a>
            ) : (
              <span className="matching-msg-muted">No phone</span>
            )}
          </div>
        </div>
        <div className="matching-contact-col">
          <span className="matching-contact-label">Finder (reported found)</span>
          <div className="matching-contact-btns">
            {waFound ? (
              <a className="matching-msg-btn matching-msg-btn--wa" href={waFound} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            ) : null}
            {smsFound ? (
              <a className="matching-msg-btn" href={smsFound}>
                SMS
              </a>
            ) : (
              <span className="matching-msg-muted">No phone</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const PLACEHOLDER_BY_KEYWORD = [
  { test: /laptop|phone|mobile|calculator|charger|electronic|gadget/i, src: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80' },
  { test: /id|document|card|wallet|record|book|stationery/i, src: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80' },
  { test: /bag|bottle|water|folder|backpack/i, src: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80' },
];

function resolveItemImage(item) {
  if (Array.isArray(item?.imageUrls) && item.imageUrls.length) {
    const first = String(item.imageUrls[0] || '').trim();
    if (first) return first;
  }
  const url = item?.imageUrl;
  if (typeof url === 'string' && url.trim()) return url.trim();
  const text = `${item?.category || ''} ${item?.itemName || ''} ${item?.description || ''}`;
  for (const { test, src } of PLACEHOLDER_BY_KEYWORD) {
    if (test.test(text)) return src;
  }
  return defaultItemImg;
}

function ItemThumb({ item, label }) {
  const src = resolveItemImage(item);
  return (
    <div className="matching-thumb-wrap">
      <img
        className="matching-thumb"
        src={src}
        alt={label}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = defaultItemImg;
        }}
      />
    </div>
  );
}

function tokenize(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function jaccard(tokensA, tokensB) {
  const a = new Set(tokensA);
  const b = new Set(tokensB);
  if (!a.size && !b.size) return 0;
  let inter = 0;
  for (const x of a) {
    if (b.has(x)) inter += 1;
  }
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function matchScore(lost, found) {
  const cat = jaccard(tokenize(lost.category), tokenize(found.category));
  const name = jaccard(tokenize(lost.itemName), tokenize(found.itemName));
  const desc = jaccard(tokenize(lost.description), tokenize(found.description));
  const loc = jaccard(tokenize(lost.location), tokenize(found.location));
  const score = 0.25 * cat + 0.35 * name + 0.25 * desc + 0.15 * loc;
  return Math.round(score * 1000) / 10;
}

function buildMatches(lostItems, foundItems, minScore) {
  const out = [];
  for (const lost of lostItems) {
    for (const found of foundItems) {
      const score = matchScore(lost, found);
      if (score >= minScore) {
        out.push({ lost, found, score });
      }
    }
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

function pairMatchesSearch(lost, found, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const blob = [
    lost.itemName,
    lost.description,
    lost.category,
    lost.location,
    lost.contact,
    found.itemName,
    found.description,
    found.category,
    found.location,
    found.contact,
  ]
    .join(' ')
    .toLowerCase();
  return blob.includes(q);
}

function Matching({ onTogglePage, isAuthenticated = false, currentUser, navSearch = '', onNavSearchChange, navCategory = '', onNavCategoryChange }) {
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [minScore, setMinScore] = useState(25);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lostRes, foundRes] = await Promise.all([
        fetch(`${API_PREFIX}/lost-items/all`),
        fetch(`${API_PREFIX}/found-items/all`),
      ]);
      if (!lostRes.ok) {
        throw new Error(`Lost items: server returned ${lostRes.status}. Is the backend running?`);
      }
      if (!foundRes.ok) {
        throw new Error(`Found items: server returned ${foundRes.status}. Is the backend running?`);
      }
      const lost = await parseJsonArrayResponse(lostRes, 'Lost items');
      const found = await parseJsonArrayResponse(foundRes, 'Found items');
      setLostItems(Array.isArray(lost) ? lost : []);
      setFoundItems(Array.isArray(found) ? found : []);
    } catch (e) {
      setError(
        e.message === 'Failed to fetch'
          ? 'Cannot reach the API. Start the backend (node on port 5001) and refresh — or check your network.'
          : e.message || 'Failed to load data.'
      );
      setLostItems([]);
      setFoundItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleClaim = async (foundItemId) => {
    if (!isAuthenticated || !currentUser) {
      alert('Please login to claim an item.');
      onTogglePage('login');
      return;
    }

    if (!window.confirm('Are you sure you want to claim this item?')) return;

    try {
      const res = await fetch(`${API_PREFIX}/found-items/claim/${foundItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to claim item.');
      alert('Item claimed successfully! You can see it in "My Claims".');
      load(); // Refresh lists
    } catch (err) {
      alert(err.message);
    }
  };

  const baseMatches = useMemo(
    () => buildMatches(lostItems, foundItems, minScore),
    [lostItems, foundItems, minScore]
  );

  const matches = useMemo(() => {
    const q = String(navSearch || '').trim();
    const cat = String(navCategory || '').trim().toLowerCase();

    let filtered = baseMatches;
    if (q) {
      filtered = filtered.filter(({ lost, found }) => pairMatchesSearch(lost, found, q));
    }
    if (cat) {
      filtered = filtered.filter(({ lost, found }) =>
        lost.category?.toLowerCase().includes(cat) ||
        found.category?.toLowerCase().includes(cat)
      );
    }
    return filtered;
  }, [baseMatches, navSearch, navCategory]);

  const searchActive = Boolean(String(navSearch || '').trim());

  return (
    <div className="matching-page">
      <Navbar
        onTogglePage={onTogglePage}
        isAuthenticated={isAuthenticated}
        activePage="matching"
        searchValue={navSearch}
        onSearchChange={onNavSearchChange}
        activeCategory={navCategory}
        onCategoryChange={onNavCategoryChange}
      />

      <main className="matching-main">
        <header className="matching-header">
          <div>
            <h1 className="matching-title">Smart matching</h1>
            <p className="matching-subtitle">
              Compares reported lost items with found items using category, name, description, and location. At{' '}
              {MESSAGE_THRESHOLD}% or higher you can message the owner or finder (SMS / WhatsApp).
            </p>
          </div>
          <div className="matching-toolbar">
            <label className="matching-label">
              Minimum match %
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
              />
              <span className="matching-min-val">{minScore}%</span>
            </label>
            <button type="button" className="matching-refresh" onClick={load} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </header>

        {error && (
          <div className="matching-banner matching-banner--error" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <p className="matching-stats">
            {lostItems.length} lost · {foundItems.length} found ·{' '}
            {searchActive || navCategory ? (
              <>
                {matches.length} shown
                {baseMatches.length !== matches.length
                  ? ` (filtered ${searchActive ? `by “${navSearch}”` : ''}${searchActive && navCategory ? ' and ' : ''}${navCategory ? `by “${navCategory}”` : ''} from ${baseMatches.length} at ≥ ${minScore}%)`
                  : ` (≥ ${minScore}%)`}
              </>
            ) : (
              <>
                {matches.length} possible matches (≥ {minScore}%)
              </>
            )}
          </p>
        )}

        {loading ? (
          <p className="matching-loading">Loading listings…</p>
        ) : matches.length === 0 ? (
          <div className="matching-empty">
            {searchActive && baseMatches.length > 0 ? (
              <>
                <p>No matches contain “{String(navSearch).trim()}”.</p>
                <p className="matching-empty-hint">Clear the navbar search or try another keyword.</p>
              </>
            ) : (
              <>
                <p>No pairs meet the current threshold.</p>
                <p className="matching-empty-hint">Lower the minimum % or add more overlapping details in lost and found reports.</p>
              </>
            )}
          </div>
        ) : (
          <ul className="matching-list">
            {matches.map(({ lost, found, score }) => (
              <li key={`${lost._id}-${found._id}`} className="matching-card">
                <div className="matching-card-score" aria-label={`Match score ${score} percent`}>
                  <span className="matching-card-score-value">{score}</span>
                  <span className="matching-card-score-unit">%</span>
                </div>
                <div className="matching-card-content">
                  <div className="matching-card-body">
                    <div className="matching-side">
                      <ItemThumb item={lost} label="Lost item" />
                      <span className="matching-badge matching-badge--lost">Lost</span>
                      <h3 className="matching-item-title">{lost.itemName}</h3>
                      <p className="matching-meta">{lost.category}</p>
                      <p className="matching-desc">{lost.description}</p>
                      <p className="matching-meta">📍 {lost.location}</p>
                      <p className="matching-meta">Lost {formatDate(lost.dateLost)} · 📞 {lost.contact}</p>
                    </div>
                    <div className="matching-divider" aria-hidden />
                    <div className="matching-side">
                      <ItemThumb item={found} label="Found item" />
                      <span className="matching-badge matching-badge--found">Found</span>
                      <h3 className="matching-item-title">{found.itemName}</h3>
                      <p className="matching-meta">{found.category}</p>
                      <p className="matching-desc">{found.description}</p>
                      <p className="matching-meta">📍 {found.location}</p>
                      <p className="matching-meta">Found {formatDate(found.dateFound)} · 📞 {found.contact}</p>
                      {found.claimed ? (
                        <div style={{ marginTop: '0.75rem', display: 'inline-block', background: '#94a3b8', color: '#fff', padding: '4px 10px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600 }}>
                          CLAIMED
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="matching-claim-btn"
                          onClick={() => handleClaim(found._id)}
                        >
                          Claim this item
                        </button>
                      )}
                    </div>
                  </div>
                  {score >= MESSAGE_THRESHOLD ? (
                    <ContactMatchActions lost={lost} found={found} score={score} />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default Matching;
