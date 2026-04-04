import React, { useEffect, useMemo, useState } from 'react';
import Navbar from './Navbar';
import './Home.css';
import { API_PREFIX } from '../apiConfig';

const AUCTION_MATCH_THRESHOLD = 70;

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

function resolveItemImage(item) {
  if (Array.isArray(item?.imageUrls) && item.imageUrls.length) return item.imageUrls[0];
  return item?.imageUrl || '';
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

function AuctionPage({
  onTogglePage,
  isAuthenticated = false,
  currentUser,
  currentEmail = '',
  navSearch = '',
  onNavSearchChange,
  navCategory = '',
  onNavCategoryChange,
}) {
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [bidInputs, setBidInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [lostRes, foundRes, auctionRes] = await Promise.all([
          fetch(`${API_PREFIX}/lost-items/all`),
          fetch(`${API_PREFIX}/found-items/all`),
          fetch(`${API_PREFIX}/auctions`),
        ]);
        const lost = await lostRes.json().catch(() => []);
        const found = await foundRes.json().catch(() => []);
        const auctionData = await auctionRes.json().catch(() => []);
        setLostItems(Array.isArray(lost) ? lost : []);
        setFoundItems(Array.isArray(found) ? found : []);
        setAuctions(Array.isArray(auctionData) ? auctionData : []);
      } catch {
        setError('Failed to load items for auction.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const unmatched = useMemo(() => {
    const lostUnmatched = lostItems.filter(
      (lost) => !foundItems.some((found) => matchScore(lost, found) >= AUCTION_MATCH_THRESHOLD)
    );
    const foundUnmatched = foundItems.filter(
      (found) => !lostItems.some((lost) => matchScore(lost, found) >= AUCTION_MATCH_THRESHOLD)
    );
    return [
      ...lostUnmatched.map((x) => ({ ...x, type: 'lost' })),
      ...foundUnmatched.map((x) => ({ ...x, type: 'found' })),
    ];
  }, [lostItems, foundItems]);

  const auctionByItemKey = useMemo(() => {
    const map = new Map();
    auctions.forEach((a) => {
      map.set(`${a.itemType}-${a.itemId}`, a);
    });
    return map;
  }, [auctions]);

  const bidderName = currentUser?.name || 'User';
  const bidderEmail = currentUser?.email || currentEmail || '';

  const ensureAuction = async (item) => {
    try {
      const res = await fetch(`${API_PREFIX}/auctions/ensure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: item.type,
          itemId: item._id,
          itemName: item.itemName || 'Untitled item',
          startingPrice: 100,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || data.error || 'Failed to start auction.');
        return null;
      }
      setAuctions((prev) => {
        const next = prev.filter((x) => x._id !== data._id && !(x.itemType === data.itemType && x.itemId === data.itemId));
        next.push(data);
        return next;
      });
      return data;
    } catch {
      alert('Could not start auction now.');
      return null;
    }
  };

  const placeBid = async (item) => {
    if (!bidderEmail) {
      alert('Please login first.');
      onTogglePage?.('login');
      return;
    }
    const auction = auctionByItemKey.get(`${item.type}-${item._id}`) || (await ensureAuction(item));
    if (!auction) return;
    const raw = bidInputs[auction._id];
    const amount = Number(raw);
    if (!Number.isFinite(amount)) {
      alert('Enter a valid bid amount.');
      return;
    }
    try {
      const res = await fetch(`${API_PREFIX}/auctions/${auction._id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidderName, bidderEmail, amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || data.error || 'Bid failed.');
        return;
      }
      setAuctions((prev) => prev.map((x) => (x._id === data._id ? data : x)));
      setBidInputs((prev) => ({ ...prev, [auction._id]: '' }));
    } catch {
      alert('Could not place bid.');
    }
  };

  return (
    <div className="home-container">
      <Navbar
        onTogglePage={onTogglePage}
        isAuthenticated={isAuthenticated}
        activePage="auction"
        searchValue={navSearch}
        onSearchChange={onNavSearchChange}
        activeCategory={navCategory}
        onCategoryChange={onNavCategoryChange}
      />
      <main style={{ padding: '2rem 5%' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <h1 style={{ margin: 0, color: '#0f172a' }}>Auction Items</h1>
          <p style={{ color: '#64748b' }}>
            Items not matched at {AUCTION_MATCH_THRESHOLD}%+ are shown here for auction flow.
          </p>

          {loading ? <p>Loading auction candidates...</p> : null}
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

          {!loading && !error && unmatched.length === 0 ? (
            <p>No unmatched items available for auction right now.</p>
          ) : null}

          {!loading && !error && unmatched.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.9rem' }}>
              {unmatched.map((item) => (
                <article key={`${item.type}-${item._id}`} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.95rem' }}>
                  {(() => {
                    const auction = auctionByItemKey.get(`${item.type}-${item._id}`);
                    const youAreTop = auction && bidderEmail && auction.highestBidderEmail === bidderEmail;
                    return (
                      <>
                  {resolveItemImage(item) ? (
                    <img
                      src={resolveItemImage(item)}
                      alt={item.itemName || 'Auction item'}
                      style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: '0.55rem' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: item.type === 'lost' ? '#fef3c7' : '#dcfce7', color: item.type === 'lost' ? '#92400e' : '#166534' }}>
                    {item.type.toUpperCase()}
                  </span>
                  <h3 style={{ margin: '0.5rem 0 0.2rem' }}>{item.itemName || 'Untitled item'}</h3>
                  <p style={{ margin: 0, color: '#475569' }}>{item.category || 'Uncategorized'}</p>
                  <p style={{ margin: '0.4rem 0', color: '#334155' }}>{item.description || 'No description'}</p>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>📍 {item.location || '—'}</p>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
                    Date: {formatDate(item.type === 'lost' ? item.dateLost : item.dateFound)}
                  </p>
                  {auction ? (
                    <>
                      <p style={{ margin: '0.45rem 0 0', fontWeight: 700, color: '#0f172a' }}>
                        Current Highest: Rs. {auction.highestBid}
                      </p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#475569' }}>
                        Highest Bidder: {auction.highestBidderName || 'No bids yet'}
                      </p>
                      {youAreTop ? (
                        <p style={{ margin: '0.35rem 0 0', color: '#166534', fontWeight: 700 }}>
                          You have the highest price. You can get this item if auction closes now.
                        </p>
                      ) : null}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.55rem' }}>
                        <input
                          type="number"
                          min={Math.max(auction.highestBid + 1, auction.startingPrice)}
                          step="1"
                          placeholder={`Bid > ${auction.highestBid}`}
                          value={bidInputs[auction._id] || ''}
                          onChange={(e) => setBidInputs((prev) => ({ ...prev, [auction._id]: e.target.value }))}
                          style={{ flex: 1, padding: '0.58rem 0.65rem', borderRadius: 8, border: '1px solid #dbe3ee' }}
                        />
                        <button type="button" className="hero-btn-primary" style={{ padding: '0.58rem 0.8rem' }} onClick={() => placeBid(item)}>
                          Bid
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="hero-btn-primary"
                      style={{ marginTop: '0.6rem', width: '100%' }}
                      onClick={() => ensureAuction(item)}
                    >
                      Start Auction
                    </button>
                  )}
                      </>
                    );
                  })()}
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default AuctionPage;
