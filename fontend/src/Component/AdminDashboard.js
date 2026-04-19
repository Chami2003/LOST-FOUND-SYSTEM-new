import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { QRCodeCanvas } from 'qrcode.react';
import { apiUrl, API_PREFIX } from '../apiConfig';
import './AdminDashboard.css';

const COLORS = {
  lost: '#f59e0b',
  found: '#22c55e',
  pie: ['#2563eb', '#f97316'],
};

function dailyCountsByField(items, field, n = 7) {
  const pts = [];
  for (let i = n - 1; i >= 0; i--) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const label = dayStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const count = items.filter((row) => {
      const raw = row[field];
      if (!raw) return false;
      const t = new Date(raw);
      return t >= dayStart && t <= dayEnd;
    }).length;
    pts.push({ name: label, count });
  }
  return pts;
}

function dailyUserRegistrations(users, n = 7) {
  return dailyCountsByField(
    users.map((u) => ({ createdAt: u.createdAt })),
    'createdAt',
    n
  ).map((row) => ({ name: row.name, registrations: row.count }));
}

function dailyLoginSessions(users, n = 7) {
  return dailyCountsByField(
    users.map((u) => ({ lastLoginAt: u.lastLoginAt })),
    'lastLoginAt',
    n
  ).map((row) => ({ name: row.name, logins: row.count }));
}

const SECTION_TITLE = {
  overview: 'Dashboard overview',
  management: 'Management',
  notification: 'Notifications',
  'admin-auction': 'Auction',
  'admin-qr': 'QR Codes',
  'mgmt-users': 'User Management',
  'mgmt-reports': 'Report Management',
  'mgmt-found': 'Found Management',
  'mgmt-delivery': 'Delivery Management',
};

const MGMT_DETAIL_SECTIONS = new Set(['mgmt-users', 'mgmt-reports', 'mgmt-found', 'mgmt-delivery']);

function pageTitleForSection(section) {
  return SECTION_TITLE[section] || 'Admin';
}

function formatShortDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

const EXPIRY_MS = 25 * 24 * 60 * 60 * 1000;

function digitsOnly(raw) {
  return String(raw || '').replace(/\D/g, '');
}

function toWhatsAppDigits(raw) {
  const d = digitsOnly(raw);
  if (!d) return '';
  if (d.length === 10 && d.startsWith('0')) return `94${d.slice(1)}`;
  if (d.length === 9) return `94${d}`;
  if (d.length === 11 && d.startsWith('94')) return d;
  return d;
}

function buildMatchShareMessage(lost, found, score) {
  return `Hi — iLost Admin here. We found a possible match (${score}%) for an item: lost "${lost.itemName}" ↔ found "${found.itemName}". Please check the system.`;
}

/** Unclaimed items with no match for 30+ days, or already marked expired by the scheduler. */
function isNoMatchExpiredItem(item) {
  if (!item || item.claimed) return false;
  const c = item.createdAt ? new Date(item.createdAt) : null;
  if (!c || Number.isNaN(c.getTime())) return false;
  return Date.now() - c.getTime() >= EXPIRY_MS;
}

function daysSinceCreated(createdAt) {
  if (!createdAt) return 0;
  const c = new Date(createdAt);
  if (Number.isNaN(c.getTime())) return 0;
  return Math.floor((Date.now() - c.getTime()) / (24 * 60 * 60 * 1000));
}

const SMART_MATCH_THRESHOLD = 70;

function tokenizeSmartMatch(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function jaccardSmartMatch(tokensA, tokensB) {
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

function matchScoreSmartMatch(lost, found) {
  const cat = jaccardSmartMatch(tokenizeSmartMatch(lost.category), tokenizeSmartMatch(found.category));
  const name = jaccardSmartMatch(tokenizeSmartMatch(lost.itemName), tokenizeSmartMatch(found.itemName));
  const desc = jaccardSmartMatch(tokenizeSmartMatch(lost.description), tokenizeSmartMatch(found.description));
  const loc = jaccardSmartMatch(tokenizeSmartMatch(lost.location), tokenizeSmartMatch(found.location));
  const score = 0.25 * cat + 0.35 * name + 0.25 * desc + 0.15 * loc;
  return Math.round(score * 1000) / 10;
}

function buildSmartMatchMetrics(lostItems, foundItems, minScore = SMART_MATCH_THRESHOLD) {
  let totalPairs = 0;
  const buckets = { '70-79': 0, '80-89': 0, '90-100': 0 };
  const uniqueLost = new Set();
  const uniqueFound = new Set();

  for (const lost of lostItems) {
    for (const found of foundItems) {
      const score = matchScoreSmartMatch(lost, found);
      if (score >= minScore) {
        totalPairs += 1;
        uniqueLost.add(String(lost._id || ''));
        uniqueFound.add(String(found._id || ''));

        if (score < 80) buckets['70-79'] += 1;
        else if (score < 90) buckets['80-89'] += 1;
        else buckets['90-100'] += 1;
      }
    }
  }

  return {
    totalPairs,
    uniqueLostCount: uniqueLost.size,
    uniqueFoundCount: uniqueFound.size,
    buckets: [
      { name: '70-79%', value: buckets['70-79'] },
      { name: '80-89%', value: buckets['80-89'] },
      { name: '90-100%', value: buckets['90-100'] },
    ],
  };
}

function AdminDashboard({ onTogglePage, currentUser, currentEmail }) {
  const [section, setSection] = useState('overview');
  const [users, setUsers] = useState([]);
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [deletingExpiryKey, setDeletingExpiryKey] = useState('');
  const [auctionForm, setAuctionForm] = useState({});
  const [savingAuctionId, setSavingAuctionId] = useState('');
  const [editingUserId, setEditingUserId] = useState('');
  const [editingUserDraft, setEditingUserDraft] = useState({ name: '', email: '', phone: '', role: 'user' });
  const [deletingUserId, setDeletingUserId] = useState('');
  const [editingLostId, setEditingLostId] = useState('');
  const [editingLostDraft, setEditingLostDraft] = useState({
    itemName: '',
    category: '',
    location: '',
    contact: '',
    status: 'active',
  });
  const [deletingLostId, setDeletingLostId] = useState('');
  const [editingFoundId, setEditingFoundId] = useState('');
  const [editingFoundDraft, setEditingFoundDraft] = useState({
    itemName: '',
    category: '',
    location: '',
    contact: '',
    status: 'active',
  });
  const [deletingFoundId, setDeletingFoundId] = useState('');
  const [qrDetailPair, setQrDetailPair] = useState(null);
  const [editingDeliveryId, setEditingDeliveryId] = useState('');
  const [editingDeliveryDraft, setEditingDeliveryDraft] = useState({
    deliveryPerson: '',
    trackingLocation: '',
  });
  const [forceEditAuctionId, setForceEditAuctionId] = useState('');

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [uRes, lRes, fRes, nRes, aRes] = await Promise.all([
        fetch(apiUrl('/users')),
        fetch(`${API_PREFIX}/lost-items/all`),
        fetch(`${API_PREFIX}/found-items/all`),
        fetch(`${API_PREFIX}/notifications`),
        fetch(`${API_PREFIX}/auctions`),
      ]);
      const uData = await uRes.json().catch(() => ({}));
      const lostRaw = await lRes.json().catch(() => []);
      const foundRaw = await fRes.json().catch(() => []);
      const nData = await nRes.json().catch(() => ({}));
      const auctionRaw = await aRes.json().catch(() => []);
      if (!uRes.ok) {
        setLoadError(uData.message || 'Could not load users');
      } else if (Array.isArray(uData.users)) {
        setUsers(uData.users);
      }
      setLostItems(Array.isArray(lostRaw) ? lostRaw : []);
      setFoundItems(Array.isArray(foundRaw) ? foundRaw : []);
      if (nRes.ok && Array.isArray(nData.notifications)) {
        setNotifications(nData.notifications);
      }
      setAuctions(Array.isArray(auctionRaw) ? auctionRaw : []);
    } catch {
      setLoadError('Cannot reach server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const refreshItemsAndNotifications = useCallback(async () => {
    try {
      const [lRes, fRes, nRes] = await Promise.all([
        fetch(`${API_PREFIX}/lost-items/all`),
        fetch(`${API_PREFIX}/found-items/all`),
        fetch(`${API_PREFIX}/notifications`),
      ]);
      const lostRaw = await lRes.json().catch(() => []);
      const foundRaw = await fRes.json().catch(() => []);
      const nData = await nRes.json().catch(() => ({}));
      setLostItems(Array.isArray(lostRaw) ? lostRaw : []);
      setFoundItems(Array.isArray(foundRaw) ? foundRaw : []);
      if (nRes.ok && Array.isArray(nData.notifications)) {
        setNotifications(nData.notifications);
      }
    } catch {
      alert('Could not refresh data.');
    }
  }, []);

  const deleteExpiryItem = async (kind, id) => {
    if (!id || !window.confirm('Delete this item from the system? Related alerts will be removed.')) return;
    const key = `${kind}-${id}`;
    setDeletingExpiryKey(key);
    const url =
      kind === 'lost' ? `${API_PREFIX}/lost-items/delete/${id}` : `${API_PREFIX}/found-items/delete/${id}`;
    try {
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || data.error || 'Delete failed.');
        return;
      }
      await refreshItemsAndNotifications();
    } catch {
      alert('Cannot reach server.');
    } finally {
      setDeletingExpiryKey('');
    }
  };

  const startEditUser = (u) => {
    setEditingUserId(String(u._id || u.email));
    setEditingUserDraft({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'user',
    });
  };

  const cancelEditUser = () => {
    setEditingUserId('');
    setEditingUserDraft({ name: '', email: '', phone: '', role: 'user' });
  };

  const saveUser = async (u) => {
    const id = u._id;
    if (!id) return;
    if (!editingUserDraft.name || !editingUserDraft.email) {
      alert('Name and email are required.');
      return;
    }
    try {
      const res = await fetch(apiUrl(`/users/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingUserDraft.name,
          email: editingUserDraft.email,
          phone: editingUserDraft.phone,
          role: editingUserDraft.role,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || data.error || 'Could not update user.');
        return;
      }
      await loadDashboardData();
      cancelEditUser();
    } catch {
      alert('Cannot reach server.');
    }
  };

  const deleteUser = async (u) => {
    const id = u._id;
    if (!id) return;
    if (!window.confirm('Delete this user account? This cannot be undone.')) return;
    setDeletingUserId(String(id));
    try {
      const res = await fetch(apiUrl(`/users/${id}`), { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || data.error || 'Could not delete user.');
        return;
      }
      await loadDashboardData();
    } catch {
      alert('Cannot reach server.');
    } finally {
      setDeletingUserId('');
    }
  };

  const startEditLost = (row) => {
    setEditingLostId(String(row._id));
    setEditingLostDraft({
      itemName: row.itemName || '',
      category: row.category || '',
      location: row.location || '',
      contact: row.contact || '',
      status: row.status || 'active',
    });
  };

  const cancelEditLost = () => {
    setEditingLostId('');
    setEditingLostDraft({ itemName: '', category: '', location: '', contact: '', status: 'active' });
  };

  const saveLost = async (row) => {
    const id = row._id;
    if (!id) return;
    if (!editingLostDraft.itemName || !editingLostDraft.category || !editingLostDraft.location) {
      alert('Item, category and location are required.');
      return;
    }
    try {
      const res = await fetch(`${API_PREFIX}/lost-items/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...row,
          itemName: editingLostDraft.itemName,
          category: editingLostDraft.category,
          location: editingLostDraft.location,
          contact: editingLostDraft.contact,
          status: editingLostDraft.status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || data.error || 'Could not update report.');
        return;
      }
      await loadDashboardData();
      cancelEditLost();
    } catch {
      alert('Cannot reach server.');
    }
  };

  const deleteLost = async (row) => {
    const id = row._id;
    if (!id) return;
    if (!window.confirm('Delete this lost-item report?')) return;
    setDeletingLostId(String(id));
    try {
      const res = await fetch(`${API_PREFIX}/lost-items/delete/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || data.error || 'Could not delete report.');
        return;
      }
      await loadDashboardData();
    } catch {
      alert('Cannot reach server.');
    } finally {
      setDeletingLostId('');
    }
  };

  const startEditFound = (row) => {
    setEditingFoundId(String(row._id));
    setEditingFoundDraft({
      itemName: row.itemName || '',
      category: row.category || '',
      location: row.location || '',
      contact: row.contact || '',
      status: row.status || 'active',
    });
  };

  const cancelEditFound = () => {
    setEditingFoundId('');
    setEditingFoundDraft({ itemName: '', category: '', location: '', contact: '', status: 'active' });
  };

  const saveFound = async (row) => {
    const id = row._id;
    if (!id) return;
    if (!editingFoundDraft.itemName || !editingFoundDraft.category || !editingFoundDraft.location) {
      alert('Item, category and location are required.');
      return;
    }
    try {
      const res = await fetch(`${API_PREFIX}/found-items/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...row,
          itemName: editingFoundDraft.itemName,
          category: editingFoundDraft.category,
          location: editingFoundDraft.location,
          contact: editingFoundDraft.contact,
          status: editingFoundDraft.status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || data.error || 'Could not update report.');
        return;
      }
      await loadDashboardData();
      cancelEditFound();
    } catch {
      alert('Cannot reach server.');
    }
  };

  const deleteFound = async (row) => {
    const id = row._id;
    if (!id) return;
    if (!window.confirm('Delete this found-item report?')) return;
    setDeletingFoundId(String(id));
    try {
      const res = await fetch(`${API_PREFIX}/found-items/delete/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || data.error || 'Could not delete report.');
        return;
      }
      await loadDashboardData();
    } catch {
      alert('Cannot reach server.');
    } finally {
      setDeletingFoundId('');
    }
  };

  const startEditDelivery = (row) => {
    setEditingDeliveryId(String(row._id));
    setEditingDeliveryDraft({
      deliveryPerson: row.deliveryPerson || '',
      trackingLocation: row.trackingLocation || '',
    });
  };

  const cancelEditDelivery = () => {
    setEditingDeliveryId('');
    setEditingDeliveryDraft({ deliveryPerson: '', trackingLocation: '' });
  };

  const saveDelivery = async (row) => {
    const id = row._id;
    if (!id) return;
    const isLost = row.queueType === 'lost';
    const endpoint = isLost ? `${API_PREFIX}/lost-items/update/${id}` : `${API_PREFIX}/found-items/update/${id}`;
    
    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...row,
          deliveryPerson: editingDeliveryDraft.deliveryPerson,
          trackingLocation: editingDeliveryDraft.trackingLocation,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || data.error || 'Could not update delivery.');
        return;
      }
      await loadDashboardData();
      cancelEditDelivery();
    } catch {
      alert('Cannot reach server.');
    }
  };

  const defaultsForAuction = (a) => ({
    winnerName: a.winnerBidderName || a.highestBidderName || '',
    winnerEmail: a.winnerBidderEmail || a.highestBidderEmail || '',
    deliveryName: a.deliveryPersonName || '',
    deliveryContact: a.deliveryPersonContact || '',
  });

  const formForAuction = (a) => ({
    ...defaultsForAuction(a),
    ...(auctionForm[String(a._id)] || {}),
  });

  const patchAuctionForm = (a, patch) => {
    const id = String(a._id);
    setAuctionForm((prev) => ({
      ...prev,
      [id]: { ...defaultsForAuction(a), ...prev[id], ...patch },
    }));
  };

  const saveAuctionWinner = async (a) => {
    const id = String(a._id);
    const f = formForAuction(a);
    if (!String(f.winnerName || '').trim() || !String(f.winnerEmail || '').trim()) {
      alert('Winner name and email are required.');
      return;
    }
    const contactVal = String(f.deliveryContact || '').trim();
    if (contactVal && contactVal.length !== 10) {
      alert('Delivery contact must be exactly 10 digits.');
      return;
    }
    setSavingAuctionId(id);
    try {
      const res = await fetch(`${API_PREFIX}/auctions/${id}/admin-assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerBidderName: String(f.winnerName).trim(),
          winnerBidderEmail: String(f.winnerEmail).trim(),
          deliveryPersonName: String(f.deliveryName || '').trim(),
          deliveryPersonContact: String(f.deliveryContact || '').trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || data.error || 'Could not save.');
        return;
      }
      setAuctionForm((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await loadDashboardData();
    } catch {
      alert('Cannot reach server.');
    } finally {
      setSavingAuctionId('');
    }
  };

  const displayEmail = currentUser?.email || currentEmail || 'Admin';

  const lostCount = lostItems.length;
  const foundCount = foundItems.length;
  const userTotal = users.length;

  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const newUsers7d = useMemo(
    () =>
      users.filter((u) => {
        if (!u.createdAt) return false;
        return new Date(u.createdAt) >= weekAgo;
      }).length,
    [users, weekAgo]
  );

  const activeLogins7d = useMemo(
    () =>
      users.filter((u) => {
        if (!u.lastLoginAt) return false;
        return new Date(u.lastLoginAt) >= weekAgo;
      }).length,
    [users, weekAgo]
  );

  const lostVsFoundData = useMemo(
    () => [
      { name: 'Lost reports', value: lostCount },
      { name: 'Found reports', value: foundCount },
    ],
    [lostCount, foundCount]
  );

  const registrationSeries = useMemo(() => dailyUserRegistrations(users, 7), [users]);
  const loginSeries = useMemo(() => dailyLoginSessions(users, 7), [users]);

  const systemOverviewBars = useMemo(
    () => [
      { name: 'Lost', value: lostCount },
      { name: 'Found', value: foundCount },
      { name: 'Users', value: userTotal },
    ],
    [lostCount, foundCount, userTotal]
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const deliveryQueue = useMemo(() => {
    const lost = lostItems
      .filter((x) => x.claimed || x.status === 'claimed')
      .map((x) => ({ ...x, queueType: 'lost' }));
    const found = foundItems
      .filter((x) => x.claimed || x.status === 'claimed')
      .map((x) => ({ ...x, queueType: 'found' }));
    return [...lost, ...found];
  }, [lostItems, foundItems]);

  const smartMatchMetrics = useMemo(
    () => buildSmartMatchMetrics(lostItems, foundItems, SMART_MATCH_THRESHOLD),
    [lostItems, foundItems]
  );

  const smartMatchPairs = smartMatchMetrics.totalPairs;
  const smartMatchBuckets = smartMatchMetrics.buckets;
  const smartMatchLostItems = smartMatchMetrics.uniqueLostCount;
  const smartMatchFoundItems = smartMatchMetrics.uniqueFoundCount;

  const smartMatchPairRows = useMemo(() => {
    const pairs = [];
    const seen = new Set();
    for (const lost of lostItems) {
      for (const found of foundItems) {
        const score = matchScoreSmartMatch(lost, found);
        if (score < SMART_MATCH_THRESHOLD) continue;
        const lostId = String(lost._id || '');
        const foundId = String(found._id || '');
        if (!lostId || !foundId) continue;
        const key = `${lostId}-${foundId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        pairs.push({ lost, found, score });
      }
    }
    pairs.sort((a, b) => b.score - a.score);
    return pairs.slice(0, 24);
  }, [lostItems, foundItems]);

  const itemExpiryRows = useMemo(() => {
    const lost = lostItems
      .filter(isNoMatchExpiredItem)
      .map((x) => ({ ...x, rowKind: 'lost' }));
    const found = foundItems
      .filter(isNoMatchExpiredItem)
      .map((x) => ({ ...x, rowKind: 'found' }));
    return [...lost, ...found].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    });
  }, [lostItems, foundItems]);

  const pageTitle = pageTitleForSection(section);
  const managementNavActive = section === 'management' || MGMT_DETAIL_SECTIONS.has(section);

  const welcomeName = currentUser?.name || (displayEmail && displayEmail.split('@')[0]) || 'Admin';
  const avatarLetter = String(welcomeName).trim().charAt(0).toUpperCase() || 'A';

  return (
    <div className="admin-dashboard-root">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar-brand">
          <span className="admin-sidebar-brand__title">iLost</span>
        </div>
        <nav className="admin-sidebar-nav">
          <button
            type="button"
            className={section === 'overview' ? 'admin-sidebar-nav--active' : ''}
            onClick={() => setSection('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            className={managementNavActive ? 'admin-sidebar-nav--active' : ''}
            onClick={() => setSection('management')}
          >
            Management
          </button>
          <button
            type="button"
            className={section === 'notification' ? 'admin-sidebar-nav--active' : ''}
            onClick={() => setSection('notification')}
          >
            Notification
            {unreadNotifications + itemExpiryRows.length > 0 && (
              <span className="admin-nav-badge">{unreadNotifications + itemExpiryRows.length}</span>
            )}
          </button>
          <button
            type="button"
            className={section === 'admin-auction' ? 'admin-sidebar-nav--active' : ''}
            onClick={() => setSection('admin-auction')}
          >
            Auction
          </button>
          <button
            type="button"
            className={section === 'admin-qr' ? 'admin-sidebar-nav--active' : ''}
            onClick={() => setSection('admin-qr')}
          >
            QR Codes
          </button>
        </nav>
        <div className="admin-sidebar-footer">
          <button type="button" onClick={() => onTogglePage?.('home')}>
            Site home
          </button>
          <button type="button" onClick={() => onTogglePage?.('login')}>
            Log out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        {section !== 'overview' ? (
          <header className="admin-topbar">
            <div className="admin-topbar-inner">
              {MGMT_DETAIL_SECTIONS.has(section) ? (
                <button type="button" className="admin-back-to-mgmt" onClick={() => setSection('management')}>
                  ← Management
                </button>
              ) : null}
              <div>
                <h1>{pageTitle}</h1>
                <div className="admin-topbar-meta">{displayEmail}</div>
              </div>
            </div>
          </header>
        ) : null}

        <div className={section === 'overview' ? 'admin-content admin-content--overview' : 'admin-content'}>
          {loading ? (
            <p style={{ color: '#64748b', padding: section === 'overview' ? '2rem 1.5rem' : undefined }}>Loading dashboard…</p>
          ) : section === 'overview' ? (
            <>
              {loadError ? (
                <p style={{ color: '#b91c1c', margin: '0 1.5rem 1rem' }}>{loadError}</p>
              ) : null}

              <header className="admin-overview-hero">
                <div className="admin-overview-hero__bg" aria-hidden />
                <div className="admin-overview-hero__inner">
                  <div className="admin-overview-hero__left">
                    <p className="admin-overview-hero__eyebrow">
                      <span className="admin-overview-hero__gear" aria-hidden>
                        ⚙
                      </span>{' '}
                      Admin Panel
                    </p>
                    <h2 className="admin-overview-hero__title">
                      Welcome, {welcomeName}! <span aria-hidden>👋</span>
                    </h2>
                    <p className="admin-overview-hero__subtitle">Here&apos;s your iLost overview for today.</p>
                  </div>
                  <div className="admin-overview-hero__profile">
                    <div className="admin-overview-hero__avatar" aria-hidden>
                      {avatarLetter}
                    </div>
                    <div>
                      <div className="admin-overview-hero__profile-name">{welcomeName}</div>
                      <div className="admin-overview-hero__profile-role">Administrator</div>
                    </div>
                  </div>
                </div>
              </header>

              <div className="admin-overview-body">
                <div className="admin-overview-cards">
                  <div className="admin-overview-stat-card">
                    <button type="button" className="admin-overview-stat-card__view" onClick={() => setSection('mgmt-reports')}>
                      View →
                    </button>
                    <span className="admin-overview-stat-card__icon admin-overview-stat-card__icon--lost" aria-hidden>
                      📋
                    </span>
                    <div className="admin-overview-stat-card__value">{lostCount}</div>
                    <div className="admin-overview-stat-card__label">Lost reports</div>
                  </div>
                  <div className="admin-overview-stat-card">
                    <button type="button" className="admin-overview-stat-card__view" onClick={() => setSection('mgmt-found')}>
                      View →
                    </button>
                    <span className="admin-overview-stat-card__icon admin-overview-stat-card__icon--found" aria-hidden>
                      ✓
                    </span>
                    <div className="admin-overview-stat-card__value">{foundCount}</div>
                    <div className="admin-overview-stat-card__label">Found items</div>
                  </div>
                  <div className="admin-overview-stat-card">
                    <button type="button" className="admin-overview-stat-card__view" onClick={() => setSection('mgmt-users')}>
                      View →
                    </button>
                    <span className="admin-overview-stat-card__icon admin-overview-stat-card__icon--users" aria-hidden>
                      👥
                    </span>
                    <div className="admin-overview-stat-card__value">{userTotal}</div>
                    <div className="admin-overview-stat-card__label">Total users</div>
                  </div>
                  <div className="admin-overview-stat-card">
                    <button type="button" className="admin-overview-stat-card__view" onClick={() => setSection('notification')}>
                      View →
                    </button>
                    <span className="admin-overview-stat-card__icon admin-overview-stat-card__icon--msg" aria-hidden>
                      💬
                    </span>
                    <div className="admin-overview-stat-card__value">{unreadNotifications}</div>
                    <div className="admin-overview-stat-card__label">Unread notifications</div>
                  </div>
                  <div className="admin-overview-stat-card admin-overview-stat-card--urgent">
                    <button type="button" className="admin-overview-stat-card__view" onClick={() => setSection('notification')}>
                      Review →
                    </button>
                    <span className="admin-overview-stat-card__icon admin-overview-stat-card__icon--expired" aria-hidden>
                      ⌛
                    </span>
                    <div className="admin-overview-stat-card__value">{itemExpiryRows.length}</div>
                    <div className="admin-overview-stat-card__label">Expired items</div>
                  </div>
                </div>

                {itemExpiryRows.length > 0 && (
                  <div className="admin-overview-alert">
                    <span className="admin-overview-alert__icon">⚠️</span>
                    <div className="admin-overview-alert__content">
                      <strong>Action required:</strong> There are {itemExpiryRows.length} items that have been unclaimed for over 25 days. Please review them in the Notification section.
                    </div>
                    <button type="button" className="admin-overview-alert__btn" onClick={() => setSection('notification')}>
                      Go to Notifications
                    </button>
                  </div>
                )}

                <div className="admin-overview-charts">
                  <div className="admin-overview-chart-panel">
                    <h3 className="admin-overview-chart-panel__title">System Overview</h3>
                    <p className="admin-overview-chart-panel__sub">Total count per category</p>
                    <div className="admin-overview-chart-panel__chart">
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={systemOverviewBars} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e8eef4" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                            cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }}
                          />
                          <Bar dataKey="value" name="Count" fill="#2563eb" radius={[8, 8, 0, 0]} maxBarSize={56} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="admin-overview-chart-panel">
                    <h3 className="admin-overview-chart-panel__title">System Distribution</h3>
                    <p className="admin-overview-chart-panel__sub">Percentage breakdown (lost vs found)</p>
                    <div className="admin-overview-chart-panel__chart">
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={lostVsFoundData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={68}
                            outerRadius={100}
                            paddingAngle={2}
                            label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                          >
                            {lostVsFoundData.map((_, i) => (
                              <Cell key={i} fill={COLORS.pie[i % COLORS.pie.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="admin-overview-chart-panel">
                    <h3 className="admin-overview-chart-panel__title">Smart match pairs</h3>
                    <p className="admin-overview-chart-panel__sub">
                      Possible lost↔found pairs at ≥{SMART_MATCH_THRESHOLD}% · Total: {smartMatchPairs} · Matched lost: {smartMatchLostItems} · Matched found: {smartMatchFoundItems}
                    </p>
                    <div className="admin-overview-chart-panel__chart">
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={smartMatchBuckets} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e8eef4" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                          <Bar dataKey="value" name="Pairs" fill="#2563eb" radius={[8, 8, 0, 0]} maxBarSize={56} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="admin-overview-charts admin-overview-charts--user-metrics">
                  <div className="admin-overview-chart-panel">
                    <h3 className="admin-overview-chart-panel__title">New user registrations</h3>
                    <p className="admin-overview-chart-panel__sub">New accounts created per day (last 7 days)</p>
                    <div className="admin-overview-chart-panel__chart">
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={registrationSeries} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="adminRegGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e8eef4" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                          <Area
                            type="monotone"
                            dataKey="registrations"
                            name="New users"
                            stroke="#7c3aed"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#adminRegGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="admin-overview-chart-panel">
                    <h3 className="admin-overview-chart-panel__title">User logins to system</h3>
                    <p className="admin-overview-chart-panel__sub">
                      Successful logins per day (password or OTP; last 7 days)
                    </p>
                    <div className="admin-overview-chart-panel__chart">
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={loginSeries} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e8eef4" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                          <Bar dataKey="logins" name="Logins" fill="#0d9488" radius={[8, 8, 0, 0]} maxBarSize={48} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <p className="admin-overview-footnote">
                  Last 7 days total: {newUsers7d} new registrations · {activeLogins7d} users logged in at least once
                </p>
              </div>
            </>
          ) : section === 'management' ? (
            <div className="admin-mgmt-hub">
              <p className="admin-mgmt-hub-intro">Choose a module to manage users, reports, found items, or deliveries.</p>
              <div className="admin-mgmt-hub-grid">
                <button type="button" className="admin-mgmt-hub-card admin-mgmt-hub-card--users" onClick={() => setSection('mgmt-users')}>
                  <span className="admin-mgmt-hub-card-icon" aria-hidden>
                    👤
                  </span>
                  <span className="admin-mgmt-hub-card-title">User Management</span>
                  <span className="admin-mgmt-hub-card-meta">{userTotal} users</span>
                </button>
                <button type="button" className="admin-mgmt-hub-card admin-mgmt-hub-card--report" onClick={() => setSection('mgmt-reports')}>
                  <span className="admin-mgmt-hub-card-icon" aria-hidden>
                    📋
                  </span>
                  <span className="admin-mgmt-hub-card-title">Report</span>
                  <span className="admin-mgmt-hub-card-sub">Lost reports</span>
                  <span className="admin-mgmt-hub-card-meta">{lostCount} items</span>
                </button>
                <button type="button" className="admin-mgmt-hub-card admin-mgmt-hub-card--found" onClick={() => setSection('mgmt-found')}>
                  <span className="admin-mgmt-hub-card-icon" aria-hidden>
                    ✓
                  </span>
                  <span className="admin-mgmt-hub-card-title">Found</span>
                  <span className="admin-mgmt-hub-card-sub">Found items</span>
                  <span className="admin-mgmt-hub-card-meta">{foundCount} items</span>
                </button>
                <button type="button" className="admin-mgmt-hub-card admin-mgmt-hub-card--delivery" onClick={() => setSection('mgmt-delivery')}>
                  <span className="admin-mgmt-hub-card-icon" aria-hidden>
                    🚚
                  </span>
                  <span className="admin-mgmt-hub-card-title">Delivery</span>
                  <span className="admin-mgmt-hub-card-sub">Handover & returns</span>
                  <span className="admin-mgmt-hub-card-meta">{deliveryQueue.length} in queue</span>
                </button>
              </div>
            </div>
          ) : section === 'notification' ? (
            <div className="admin-notification-page">
              <div className="admin-users-panel">
                <h2>System notifications</h2>
                <p className="hint">Alerts from lost/found activity and admin messages.</p>
                {notifications.length === 0 ? (
                  <p style={{ color: '#64748b', margin: 0 }}>No notifications yet.</p>
                ) : (
                  <ul className="admin-notify-list">
                    {notifications.map((n) => (
                      <li key={n._id} className={`admin-notify-item ${n.read ? 'admin-notify-item--read' : ''}`}>
                        <span className="admin-notify-time">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</span>
                        <p className="admin-notify-msg">{n.message || '—'}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="admin-users-panel admin-item-notify-panel">
                <h2>Item notifications</h2>
                <p className="hint">
                  Unclaimed items with no match for 25 days or more (or marked expired). Delete removes the report and linked
                  alerts.
                </p>
                {itemExpiryRows.length === 0 ? (
                  <p style={{ color: '#64748b', margin: 0 }}>No items in expired / 25-day no-match state.</p>
                ) : (
                  <div className="admin-mgmt-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Item</th>
                          <th>Days listed</th>
                          <th>Status</th>
                          <th>Reported</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {itemExpiryRows.map((row) => {
                          const id = row._id;
                          const key = `${row.rowKind}-${id}`;
                          const days = daysSinceCreated(row.createdAt);
                          return (
                            <tr key={key}>
                              <td>
                                <span
                                  className={`admin-mgmt-badge ${
                                    row.rowKind === 'lost' ? 'admin-mgmt-badge--lost' : 'admin-mgmt-badge--found'
                                  }`}
                                >
                                  {row.rowKind === 'lost' ? 'Lost' : 'Found'}
                                </span>
                              </td>
                              <td>{row.itemName || '—'}</td>
                              <td>{days}</td>
                              <td>
                                {row.status === 'expired' ? (
                                  <span className="admin-mgmt-badge admin-mgmt-badge--expired">Expired</span>
                                ) : (
                                  <span className="admin-mgmt-badge admin-mgmt-badge--warn">No match 25d+</span>
                                )}
                              </td>
                              <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{formatShortDate(row.createdAt)}</td>
                              <td>
                                <button
                                  type="button"
                                  className="admin-expiry-delete-btn"
                                  disabled={deletingExpiryKey === key}
                                  onClick={() => deleteExpiryItem(row.rowKind, id)}
                                >
                                  {deletingExpiryKey === key ? '…' : 'Delete'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : section === 'admin-auction' ? (
            <div className="admin-users-panel admin-auction-admin">
              <h2>Auctions</h2>
              <p className="hint">
                Review bids by bidder name, assign the winner, and add a delivery contact for handover.
              </p>
              {auctions.length === 0 ? (
                <p style={{ color: '#64748b', margin: 0 }}>No auctions yet. Start auctions from the public Auction page.</p>
              ) : (
                <div className="admin-auction-list">
                  {auctions.map((a) => {
                    const f = formForAuction(a);
                    const bids = Array.isArray(a.bids) ? [...a.bids].reverse() : [];
                    const closed = a.status === 'closed';
                    return (
                      <div key={a._id} className="admin-auction-card">
                        <div className="admin-auction-card__head">
                          <div>
                            <strong>{a.itemName || 'Untitled item'}</strong>
                            <span
                              className={`admin-mgmt-badge ${
                                a.itemType === 'lost' ? 'admin-mgmt-badge--lost' : 'admin-mgmt-badge--found'
                              }`}
                              style={{ marginLeft: 8 }}
                            >
                              {a.itemType === 'lost' ? 'Lost' : 'Found'}
                            </span>
                            <span
                              className={`admin-mgmt-badge ${closed ? 'admin-mgmt-badge--expired' : 'admin-mgmt-badge--warn'}`}
                              style={{ marginLeft: 6 }}
                            >
                              {closed ? 'Closed' : 'Open'}
                            </span>
                          </div>
                          <div className="admin-auction-card__meta">
                            Highest: <strong>{a.highestBid}</strong> · {a.highestBidderName || '—'} ({a.highestBidderEmail || '—'})
                          </div>
                        </div>

                        <h4 className="admin-auction-bids-title">Bids (bidder name)</h4>
                        {bids.length === 0 ? (
                          <p className="admin-auction-empty">No bids yet.</p>
                        ) : (
                          <div className="admin-mgmt-table-wrap">
                            <table>
                              <thead>
                                <tr>
                                  <th>Bidder name</th>
                                  <th>Email</th>
                                  <th>Amount</th>
                                  <th>Time</th>
                                  {!closed ? <th /> : null}
                                </tr>
                              </thead>
                              <tbody>
                                {bids.map((bid, idx) => (
                                  <tr key={`${a._id}-bid-${idx}`}>
                                    <td>{bid.bidderName}</td>
                                    <td>{bid.bidderEmail}</td>
                                    <td>{bid.amount}</td>
                                    <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                      {bid.createdAt ? formatShortDate(bid.createdAt) : '—'}
                                    </td>
                                    {!closed ? (
                                      <td>
                                        <button
                                          type="button"
                                          className="admin-auction-use-btn"
                                          onClick={() =>
                                            patchAuctionForm(a, {
                                              winnerName: bid.bidderName,
                                              winnerEmail: bid.bidderEmail,
                                            })
                                          }
                                        >
                                          Use as winner
                                        </button>
                                      </td>
                                    ) : null}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {closed && forceEditAuctionId !== String(a._id) ? (
                          <div className="admin-auction-closed">
                            <div className="admin-auction-closed__inner">
                              <div>
                                <p>
                                  <strong>Winner:</strong> {a.winnerBidderName || a.highestBidderName || '—'} (
                                  {a.winnerBidderEmail || a.highestBidderEmail || '—'})
                                </p>
                                <p>
                                  <strong>Delivery person:</strong> {a.deliveryPersonName || '—'} ·{' '}
                                  {a.deliveryPersonContact || '—'}
                                </p>
                              </div>
                              <button 
                                type="button" 
                                className="admin-user-action-btn"
                                onClick={() => setForceEditAuctionId(String(a._id))}
                              >
                                Update details
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="admin-auction-assign">
                            {closed && (
                              <p className="admin-auction-assign-note">
                                Updating delivery details for closed auction.
                              </p>
                            )}
                            <div className="admin-auction-assign__row">
                              <label>
                                Winner name
                                <input
                                  type="text"
                                  value={f.winnerName}
                                  onChange={(e) => patchAuctionForm(a, { winnerName: e.target.value })}
                                />
                              </label>
                              <label>
                                Winner email
                                <input
                                  type="email"
                                  value={f.winnerEmail}
                                  onChange={(e) => patchAuctionForm(a, { winnerEmail: e.target.value })}
                                />
                              </label>
                            </div>
                            <div className="admin-auction-assign__row">
                              <label>
                                Delivery person (name)
                                <input
                                  type="text"
                                  value={f.deliveryName}
                                  onChange={(e) => patchAuctionForm(a, { deliveryName: e.target.value })}
                                  placeholder="Campus desk / courier"
                                />
                              </label>
                              <label>
                                Delivery contact (phone)
                                <input
                                  type="text"
                                  maxLength={10}
                                  value={f.deliveryContact}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    patchAuctionForm(a, { deliveryContact: val });
                                  }}
                                  placeholder="e.g. 07XXXXXXXX"
                                />
                              </label>
                            </div>
                            <div className="admin-auction-assign__actions">
                              <button
                                type="button"
                                className="hero-btn-secondary"
                                onClick={() =>
                                  patchAuctionForm(a, {
                                    winnerName: a.highestBidderName || '',
                                    winnerEmail: a.highestBidderEmail || '',
                                  })
                                }
                              >
                                Use highest bid as winner
                              </button>
                              <button
                                type="button"
                                className="hero-btn-primary"
                                disabled={savingAuctionId === String(a._id)}
                                onClick={async () => {
                                  await saveAuctionWinner(a);
                                  setForceEditAuctionId('');
                                }}
                              >
                                {savingAuctionId === String(a._id) ? 'Saving…' : closed ? 'Save changes' : 'Close auction & save'}
                              </button>
                            </div>
                            {closed && (
                              <button 
                                type="button" 
                                className="admin-auction-cancel-edit"
                                onClick={() => setForceEditAuctionId('')}
                              >
                                Cancel edit
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : section === 'admin-qr' ? (
            <div className="admin-users-panel admin-qr-page">
              <h2>QR Codes (Smart Match)</h2>
              <p className="hint">
                QR payload includes <code>lostId</code>, <code>foundId</code> and match score (&gt;= {SMART_MATCH_THRESHOLD}%).
              </p>
              {smartMatchPairRows.length === 0 ? (
                <p style={{ color: '#64748b', margin: 0 }}>No smart match pairs found for the current listings.</p>
              ) : (
                <div className="admin-qr-grid">
                  {smartMatchPairRows.map((p) => {
                    const payload = JSON.stringify({
                      lostId: p.lost._id,
                      foundId: p.found._id,
                      score: p.score,
                      lostName: p.lost.itemName,
                      foundName: p.found.itemName,
                      lostContact: p.lost.contact,
                      foundContact: p.found.contact,
                    });
                    return (
                      <div key={`${p.lost._id}-${p.found._id}`} className="admin-qr-card">
                        <div className="admin-qr-card__title">
                          <div>
                            Lost: {p.lost.itemName || '—'} · {p.lost.contact || '—'}
                          </div>
                          <div>
                            Found: {p.found.itemName || '—'} · {p.found.contact || '—'}
                          </div>
                        </div>
                        <div className="admin-qr-card__meta">
                          Score: <strong>{p.score}%</strong>
                        </div>
                        <div className="admin-qr-code">
                          <QRCodeCanvas value={payload} size={128} />
                        </div>
                        <div className="admin-qr-card__payload">
                          {String(p.lost._id).slice(0, 6)}… {String(p.found._id).slice(0, 6)}…
                        </div>
                        <div className="admin-qr-card__actions">
                          <button
                            type="button"
                            className="admin-user-action-btn"
                            onClick={() => setQrDetailPair(p)}
                          >
                            Analyse
                          </button>
                          {toWhatsAppDigits(p.found.contact) && (
                            <a 
                              className="admin-user-action-btn admin-user-action-btn--wa" 
                              href={`https://wa.me/${toWhatsAppDigits(p.found.contact)}?text=${encodeURIComponent(buildMatchShareMessage(p.lost, p.found, p.score))}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              WA Founder
                            </a>
                          )}
                          {toWhatsAppDigits(p.lost.contact) && (
                            <a 
                              className="admin-user-action-btn admin-user-action-btn--wa" 
                              href={`https://wa.me/${toWhatsAppDigits(p.lost.contact)}?text=${encodeURIComponent(buildMatchShareMessage(p.lost, p.found, p.score))}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              WA Owner
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : section === 'mgmt-users' ? (
            <div className="admin-users-panel">
              <h2>User Management</h2>
              <p className="hint">All accounts in User_Management (passwords are never shown).</p>
              {loadError ? (
                <p style={{ color: '#b91c1c' }}>{loadError}</p>
              ) : (
                <div className="admin-mgmt-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Registered</th>
                        <th>Last login</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const rowId = String(u._id || u.email);
                        const isEditing = editingUserId === rowId;
                        return (
                          <tr key={rowId}>
                            <td>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingUserDraft.name}
                                  onChange={(e) =>
                                    setEditingUserDraft((prev) => ({ ...prev, name: e.target.value }))
                                  }
                                />
                              ) : (
                                u.name || '—'
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <input
                                  type="email"
                                  value={editingUserDraft.email}
                                  onChange={(e) =>
                                    setEditingUserDraft((prev) => ({ ...prev, email: e.target.value }))
                                  }
                                />
                              ) : (
                                u.email || '—'
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingUserDraft.phone}
                                  onChange={(e) =>
                                    setEditingUserDraft((prev) => ({ ...prev, phone: e.target.value }))
                                  }
                                />
                              ) : (
                                u.phone || '—'
                              )}
                            </td>
                            <td>{u.role || 'user'}</td>
                            <td style={{ color: '#64748b', fontSize: '0.82rem' }}>{formatShortDate(u.createdAt)}</td>
                            <td style={{ color: '#64748b', fontSize: '0.82rem' }}>
                              {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}
                            </td>
                            <td>
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    className="admin-user-action-btn"
                                    onClick={() => saveUser(u)}
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-user-action-btn admin-user-action-btn--secondary"
                                    onClick={cancelEditUser}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="admin-user-action-btn"
                                    onClick={() => startEditUser(u)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-user-action-btn admin-user-action-btn--danger"
                                    disabled={deletingUserId === String(u._id)}
                                    onClick={() => deleteUser(u)}
                                  >
                                    {deletingUserId === String(u._id) ? '...' : 'Delete'}
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {users.length === 0 && !loadError && (
                    <p style={{ marginTop: '1rem', color: '#64748b' }}>No users yet.</p>
                  )}
                </div>
              )}
            </div>
          ) : section === 'mgmt-reports' ? (
            <div className="admin-users-panel">
              <h2>Report Management</h2>
              <p className="hint">Lost-item reports ({lostItems.length} total).</p>
              <div className="admin-mgmt-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Date lost</th>
                      <th>Status</th>
                      <th>Contact</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {lostItems.map((row) => {
                      const rowId = String(row._id);
                      const isEditing = editingLostId === rowId;
                      return (
                        <tr key={rowId}>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingLostDraft.itemName}
                                onChange={(e) =>
                                  setEditingLostDraft((prev) => ({ ...prev, itemName: e.target.value }))
                                }
                              />
                            ) : (
                              row.itemName || '—'
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingLostDraft.category}
                                onChange={(e) =>
                                  setEditingLostDraft((prev) => ({ ...prev, category: e.target.value }))
                                }
                              />
                            ) : (
                              row.category || '—'
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingLostDraft.location}
                                onChange={(e) =>
                                  setEditingLostDraft((prev) => ({ ...prev, location: e.target.value }))
                                }
                              />
                            ) : (
                              row.location || '—'
                            )}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{formatShortDate(row.dateLost)}</td>
                          <td>
                            <span
                              className={`admin-mgmt-badge ${
                                row.status === 'claimed' ? 'admin-mgmt-badge--done' : 'admin-mgmt-badge--lost'
                              }`}
                            >
                              {row.status || 'active'}
                            </span>
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingLostDraft.contact}
                                onChange={(e) =>
                                  setEditingLostDraft((prev) => ({ ...prev, contact: e.target.value }))
                                }
                              />
                            ) : (
                              row.contact || '—'
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  className="admin-user-action-btn"
                                  onClick={() => saveLost(row)}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="admin-user-action-btn admin-user-action-btn--secondary"
                                  onClick={cancelEditLost}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="admin-user-action-btn"
                                  onClick={() => startEditLost(row)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="admin-user-action-btn admin-user-action-btn--danger"
                                  disabled={deletingLostId === rowId}
                                  onClick={() => deleteLost(row)}
                                >
                                  {deletingLostId === rowId ? '...' : 'Delete'}
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {lostItems.length === 0 && <p style={{ marginTop: '1rem', color: '#64748b' }}>No lost reports.</p>}
              </div>
            </div>
          ) : section === 'mgmt-found' ? (
            <div className="admin-users-panel">
              <h2>Found Management</h2>
              <p className="hint">Found-item reports ({foundItems.length} total).</p>
              <div className="admin-mgmt-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Date found</th>
                      <th>Status</th>
                      <th>Contact</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {foundItems.map((row) => {
                      const rowId = String(row._id);
                      const isEditing = editingFoundId === rowId;
                      return (
                        <tr key={rowId}>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingFoundDraft.itemName}
                                onChange={(e) =>
                                  setEditingFoundDraft((prev) => ({ ...prev, itemName: e.target.value }))
                                }
                              />
                            ) : (
                              row.itemName || '—'
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingFoundDraft.category}
                                onChange={(e) =>
                                  setEditingFoundDraft((prev) => ({ ...prev, category: e.target.value }))
                                }
                              />
                            ) : (
                              row.category || '—'
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingFoundDraft.location}
                                onChange={(e) =>
                                  setEditingFoundDraft((prev) => ({ ...prev, location: e.target.value }))
                                }
                              />
                            ) : (
                              row.location || '—'
                            )}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{formatShortDate(row.dateFound)}</td>
                          <td>
                            <span
                              className={`admin-mgmt-badge ${
                                row.status === 'claimed' ? 'admin-mgmt-badge--done' : 'admin-mgmt-badge--found'
                              }`}
                            >
                              {row.status || 'active'}
                            </span>
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingFoundDraft.contact}
                                onChange={(e) =>
                                  setEditingFoundDraft((prev) => ({ ...prev, contact: e.target.value }))
                                }
                              />
                            ) : (
                              row.contact || '—'
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  className="admin-user-action-btn"
                                  onClick={() => saveFound(row)}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className="admin-user-action-btn admin-user-action-btn--secondary"
                                  onClick={cancelEditFound}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="admin-user-action-btn"
                                  onClick={() => startEditFound(row)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="admin-user-action-btn admin-user-action-btn--danger"
                                  disabled={deletingFoundId === rowId}
                                  onClick={() => deleteFound(row)}
                                >
                                  {deletingFoundId === rowId ? '...' : 'Delete'}
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {foundItems.length === 0 && <p style={{ marginTop: '1rem', color: '#64748b' }}>No found reports.</p>}
              </div>
            </div>
          ) : section === 'mgmt-delivery' ? (
            <div className="admin-users-panel">
              <h2>Delivery Management</h2>
              <p className="hint">Items marked claimed and ready for return or handover.</p>
              <div className="admin-delivery-placeholder" style={{ marginBottom: '1.25rem' }}>
                <strong>Workflow</strong> — Use this view to track owner pick-ups, campus desk handovers, or courier
                details. Full carrier integration can be connected to your backend later.
              </div>
              {deliveryQueue.length > 0 ? (
                <div className="admin-mgmt-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Item</th>
                        <th>Contact</th>
                        <th>Delivery Person</th>
                        <th>Tracking / Status</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {deliveryQueue.map((row) => {
                        const rowId = String(row._id);
                        const isEditing = editingDeliveryId === rowId;
                        return (
                          <tr key={`${row.queueType}-${rowId}`}>
                            <td>
                              <span
                                className={`admin-mgmt-badge ${
                                  row.queueType === 'lost' ? 'admin-mgmt-badge--lost' : 'admin-mgmt-badge--found'
                                }`}
                              >
                                {row.queueType === 'lost' ? 'Lost' : 'Found'}
                              </span>
                            </td>
                            <td>
                              {row.itemName || '—'}
                              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{row.location || '—'}</div>
                            </td>
                            <td>{row.contact || '—'}</td>
                            <td>
                              {isEditing ? (
                                <input
                                  type="text"
                                  placeholder="e.g. John Doe / Desk"
                                  value={editingDeliveryDraft.deliveryPerson}
                                  onChange={(e) =>
                                    setEditingDeliveryDraft((prev) => ({ ...prev, deliveryPerson: e.target.value }))
                                  }
                                />
                              ) : (
                                row.deliveryPerson || <span style={{ color: '#94a3b8' }}>Unassigned</span>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <input
                                  type="text"
                                  placeholder="Tracking link or 'Dispatched'"
                                  value={editingDeliveryDraft.trackingLocation}
                                  onChange={(e) =>
                                    setEditingDeliveryDraft((prev) => ({ ...prev, trackingLocation: e.target.value }))
                                  }
                                />
                              ) : (
                                row.trackingLocation || <span className="admin-mgmt-badge admin-mgmt-badge--pending">Ready for delivery</span>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <>
                                  <button type="button" className="admin-user-action-btn" onClick={() => saveDelivery(row)}>Save</button>
                                  <button type="button" className="admin-user-action-btn admin-user-action-btn--secondary" onClick={cancelEditDelivery}>Cancel</button>
                                </>
                              ) : (
                                <button type="button" className="admin-user-action-btn" onClick={() => startEditDelivery(row)}>Assign & Track</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#64748b', margin: 0 }}>
                  No claimed items in the delivery queue yet. When users mark matches as claimed, they will appear here.
                </p>
              )}
            </div>
          ) : null}
        </div>

        {qrDetailPair ? (
          <div className="admin-qr-modal-backdrop" role="dialog" aria-modal="true">
            <div className="admin-qr-modal">
              <div className="admin-qr-modal__header">
                <h3>Match details</h3>
                <button
                  type="button"
                  className="admin-qr-modal__close"
                  onClick={() => setQrDetailPair(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="admin-qr-modal__body">
                <div className="admin-qr-modal__column">
                  <h4>Lost item</h4>
                  <p>
                    <strong>Name:</strong> {qrDetailPair.lost.itemName || '—'}
                  </p>
                  <p>
                    <strong>Category:</strong> {qrDetailPair.lost.category || '—'}
                  </p>
                  <p>
                    <strong>Description:</strong> {qrDetailPair.lost.description || '—'}
                  </p>
                  <p>
                    <strong>Location:</strong> {qrDetailPair.lost.location || '—'}
                  </p>
                  <p>
                    <strong>Date lost:</strong> {formatShortDate(qrDetailPair.lost.dateLost)}
                  </p>
                  <p>
                    <strong>Phone:</strong> {qrDetailPair.lost.contact || '—'}
                  </p>
                </div>
                <div className="admin-qr-modal__column">
                  <h4>Found item</h4>
                  <p>
                    <strong>Name:</strong> {qrDetailPair.found.itemName || '—'}
                  </p>
                  <p>
                    <strong>Category:</strong> {qrDetailPair.found.category || '—'}
                  </p>
                  <p>
                    <strong>Description:</strong> {qrDetailPair.found.description || '—'}
                  </p>
                  <p>
                    <strong>Location:</strong> {qrDetailPair.found.location || '—'}
                  </p>
                  <p>
                    <strong>Date found:</strong> {formatShortDate(qrDetailPair.found.dateFound)}
                  </p>
                  <p>
                    <strong>Phone:</strong> {qrDetailPair.found.contact || '—'}
                  </p>
                </div>
              </div>
              <div className="admin-qr-modal__footer">
                <div className="admin-qr-modal__actions-left">
                  <span className="admin-qr-modal__score">Match score: {qrDetailPair.score}%</span>
                  {toWhatsAppDigits(qrDetailPair.found.contact) && (
                    <a 
                      className="admin-user-action-btn admin-user-action-btn--wa" 
                      href={`https://wa.me/${toWhatsAppDigits(qrDetailPair.found.contact)}?text=${encodeURIComponent(buildMatchShareMessage(qrDetailPair.lost, qrDetailPair.found, qrDetailPair.score))}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      WhatsApp Founder
                    </a>
                  )}
                  {toWhatsAppDigits(qrDetailPair.lost.contact) && (
                    <a 
                      className="admin-user-action-btn admin-user-action-btn--wa" 
                      href={`https://wa.me/${toWhatsAppDigits(qrDetailPair.lost.contact)}?text=${encodeURIComponent(buildMatchShareMessage(qrDetailPair.lost, qrDetailPair.found, qrDetailPair.score))}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      WhatsApp Owner
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  className="hero-btn-secondary"
                  onClick={() => setQrDetailPair(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default AdminDashboard;
