import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';
import conversationService from '../services/conversationService';
import { useSocket } from '../context/SocketContext';
import { useCall } from '../context/CallContext';

/* ─── Inline style helpers ─── */
const S = {
  page: {
    minHeight: '100dvh',
    background: 'var(--bg-primary, #0f172a)',
    color: 'var(--text-primary, #f8fafc)',
    fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '860px',
    margin: '0 auto',
    width: '100%',
  },

  /* ── Header ── */
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'calc(20px + env(safe-area-inset-top, 0px)) 20px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    flexShrink: 0,
  },
  headerCenter: { textAlign: 'center', flex: 1 },
  headerTitle: { fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' },
  headerSub: { fontSize: '12px', color: '#64748b', margin: '3px 0 0' },
  iconBtn: {
    width: '40px', height: '40px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'inherit',
    fontSize: '17px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s',
    flexShrink: 0,
  },

  /* ── Tabs ── */
  tabsWrap: {
    display: 'flex',
    gap: '6px',
    padding: '14px 16px 0',
    flexShrink: 0,
  },
  tabBase: {
    flex: 1,
    padding: '9px 10px',
    borderRadius: '10px',
    border: 'none',
    fontFamily: 'inherit',
    fontWeight: 700,
    fontSize: '12.5px',
    cursor: 'pointer',
    transition: 'all 0.18s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    whiteSpace: 'nowrap',
  },

  /* ── Search ── */
  searchWrap: {
    position: 'relative',
    margin: '14px 16px 8px',
    flexShrink: 0,
  },
  searchInput: {
    width: '100%',
    padding: '11px 38px 11px 40px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.09)',
    background: 'rgba(255,255,255,0.05)',
    color: 'inherit',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  searchIcon: {
    position: 'absolute', left: '14px', top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '14px', color: '#64748b', pointerEvents: 'none',
  },
  clearBtn: {
    position: 'absolute', right: '12px', top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255,255,255,0.12)', border: 'none',
    borderRadius: '50%', width: '20px', height: '20px',
    color: '#94a3b8', cursor: 'pointer', fontSize: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  /* ── Contact list ── */
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 12px calc(20px + env(safe-area-inset-bottom, 0px))',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  /* ── Contact card ── */
  card: (online) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '12px 14px',
    borderRadius: '14px',
    background: online
      ? 'rgba(34, 197, 94, 0.05)'
      : 'rgba(255,255,255,0.03)',
    border: online
      ? '1px solid rgba(34, 197, 94, 0.18)'
      : '1px solid rgba(255,255,255,0.07)',
    gap: '12px',
    transition: 'background 0.2s',
    overflow: 'hidden',
  }),

  /* ── Avatar ── */
  avatarWrap: { position: 'relative', width: '46px', height: '46px', flexShrink: 0 },
  avatar: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: '12px', height: '12px', borderRadius: '50%',
    background: '#22c55e', border: '2px solid var(--bg-primary, #0f172a)',
    boxShadow: '0 0 7px rgba(34,197,94,0.7)',
  },
  offlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: '11px', height: '11px', borderRadius: '50%',
    background: '#475569', border: '2px solid var(--bg-primary, #0f172a)',
  },

  /* ── Name + sub ── */
  info: { flex: 1, minWidth: 0 },
  nameRow: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' },
  name: {
    fontWeight: 700, fontSize: '14.5px', color: '#f8fafc',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    maxWidth: '170px',
  },
  activeBadge: {
    flexShrink: 0,
    fontSize: '10px', fontWeight: 700,
    background: 'rgba(34,197,94,0.2)', color: '#86efac',
    padding: '1px 7px', borderRadius: '8px',
  },
  subText: (online) => ({
    fontSize: '12px',
    color: online ? '#38bdf8' : '#64748b',
    marginTop: '2px',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  }),

  /* ── Action buttons ── */
  actions: {
    display: 'flex', alignItems: 'center',
    gap: '7px', flexShrink: 0,
  },
  actionIconBtn: (bg, color, border) => ({
    width: '36px', height: '36px',
    background: bg,
    color: color,
    border: border,
    borderRadius: '10px',
    fontSize: '15px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.18s',
    flexShrink: 0,
  }),
  msgBtn: {
    height: '36px',
    padding: '0 14px',
    background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '12.5px',
    cursor: 'pointer',
    transition: 'opacity 0.18s',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  addBtn: {
    height: '36px',
    padding: '0 12px',
    background: 'rgba(255,255,255,0.07)',
    color: '#f8fafc',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    fontSize: '12.5px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  removeBtn: {
    width: '32px', height: '32px',
    background: 'transparent',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: '8px',
    fontSize: '11px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },

  /* ── Empty / loading states ── */
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.06)',
    margin: '12px 0',
  },
};

const Contacts = () => {
  const navigate = useNavigate();
  const { isUserOnline } = useSocket();
  const { startCall } = useCall();
  const [contacts, setContacts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contacts');

  const loadData = async () => {
    try {
      setLoading(true);
      const [contactsRes, usersRes] = await Promise.all([
        userService.getContacts(),
        userService.getUsers(),
      ]);
      if (contactsRes.success) setContacts(contactsRes.contacts || []);
      if (usersRes.success) setAllUsers(usersRes.users || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleStartChat = async (userId) => {
    try {
      const res = await conversationService.getOrCreateOneToOne(userId);
      if (res.success) navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start chat');
    }
  };

  const handleAddContact = async (userId) => {
    try {
      const res = await userService.addContact(userId);
      if (res.success) loadData();
    } catch (err) { alert('Failed to add contact'); }
  };

  const handleRemoveContact = async (userId) => {
    if (window.confirm('Remove contact?')) {
      try {
        const res = await userService.removeContact(userId);
        if (res.success) loadData();
      } catch (err) { alert('Failed to remove contact'); }
    }
  };

  const onlineContacts = contacts.filter((c) => isUserOnline(c._id));

  const getFilteredList = () => {
    let source = activeTab === 'contacts' ? contacts
      : activeTab === 'online' ? onlineContacts
      : allUsers;

    const q = searchQuery.toLowerCase();
    return source.filter((item) =>
      item.name.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      (item.username && item.username.toLowerCase().includes(q))
    );
  };

  const displayList = getFilteredList();

  const Tab = ({ id, label, count, dot }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        style={{
          ...S.tabBase,
          background: isActive ? (id === 'contacts' ? '#38bdf8' : '#e0521c') : 'rgba(255,255,255,0.05)',
          color: isActive ? (id === 'contacts' ? '#0b0f19' : '#fff') : '#94a3b8',
          border: isActive ? 'none' : '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {dot && (
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: '#22c55e', flexShrink: 0,
          }} />
        )}
        {label}
        <span style={{
          background: isActive ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)',
          padding: '1px 6px', borderRadius: '20px',
          fontSize: '11px', fontWeight: 800,
        }}>
          {count}
        </span>
      </button>
    );
  };

  return (
    <div style={S.page}>
      {/* ── HEADER ── */}
      <div style={S.header}>
        <button style={S.iconBtn} onClick={() => navigate('/dashboard')} title="Back">
          ←
        </button>
        <div style={S.headerCenter}>
          <h1 style={S.headerTitle}>Contacts</h1>
          <p style={S.headerSub}>
            {onlineContacts.length} {onlineContacts.length === 1 ? 'person' : 'people'} online
          </p>
        </div>
        <button style={S.iconBtn} onClick={loadData} title="Refresh">
          🔄
        </button>
      </div>

      {/* ── TABS ── */}
      <div style={S.tabsWrap}>
        <Tab id="contacts" label="My Contacts" count={contacts.length} />
        <Tab id="online"   label="Online"      count={onlineContacts.length} dot />
        <Tab id="directory" label="All Users"  count={allUsers.length} />
      </div>

      {/* ── SEARCH ── */}
      <div style={S.searchWrap}>
        <span style={S.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Search by name, handle, or email…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={S.searchInput}
        />
        {searchQuery && (
          <button style={S.clearBtn} onClick={() => setSearchQuery('')}>✕</button>
        )}
      </div>

      {/* ── LIST ── */}
      <div style={S.list}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            Loading contacts…
          </div>
        ) : displayList.length === 0 ? (
          <div style={S.empty}>
            <div style={{ fontSize: '3rem', marginBottom: '14px' }}>
              {activeTab === 'online' ? '🟢' : '📇'}
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 6px' }}>
              {activeTab === 'online' ? 'No contacts online right now'
                : searchQuery ? 'No matching results'
                : 'No contacts yet'}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 18px' }}>
              {activeTab === 'online'
                ? 'Your contacts will appear here when they come online.'
                : 'Explore all users to start connecting.'}
            </p>
            {activeTab !== 'directory' && (
              <button
                onClick={() => setActiveTab('directory')}
                style={{
                  background: '#38bdf8', color: '#0b0f19',
                  border: 'none', borderRadius: '12px',
                  padding: '10px 20px', fontWeight: 700,
                  fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Explore All Users
              </button>
            )}
          </div>
        ) : (
          displayList.map((item) => {
            const online = isUserOnline(item._id);
            const isContact = contacts.some((c) => c._id === item._id);
            return (
              <div key={item._id} style={S.card(online)}>
                {/* Avatar */}
                <div style={S.avatarWrap}>
                  <img
                    src={item.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.name}`}
                    alt={item.name}
                    style={S.avatar}
                  />
                  <span style={online ? S.onlineDot : S.offlineDot} />
                </div>

                {/* Info */}
                <div style={S.info}>
                  <div style={S.nameRow}>
                    <span style={S.name}>{item.name}</span>
                    {online && <span style={S.activeBadge}>Active</span>}
                  </div>
                  <div style={S.subText(online)}>
                    {online ? '● Online now' : (item.bio || (item.username ? `@${item.username}` : item.email))}
                  </div>
                </div>

                {/* Actions */}
                <div style={S.actions}>
                  {/* Audio call */}
                  <button
                    style={S.actionIconBtn(
                      'rgba(224,82,28,0.12)', '#e0521c', '1px solid rgba(224,82,28,0.2)'
                    )}
                    onClick={() => startCall(item, 'audio')}
                    title="Audio Call"
                  >
                    📞
                  </button>

                  {/* Video call */}
                  <button
                    style={S.actionIconBtn(
                      'rgba(56,189,248,0.12)', '#38bdf8', '1px solid rgba(56,189,248,0.2)'
                    )}
                    onClick={() => startCall(item, 'video')}
                    title="Video Call"
                  >
                    📹
                  </button>

                  {/* Message */}
                  <button style={S.msgBtn} onClick={() => handleStartChat(item._id)}>
                    Message
                  </button>

                  {/* Add (directory only) */}
                  {activeTab === 'directory' && !isContact && (
                    <button style={S.addBtn} onClick={() => handleAddContact(item._id)}>
                      + Add
                    </button>
                  )}

                  {/* Remove */}
                  {isContact && (
                    <button
                      style={S.removeBtn}
                      onClick={() => handleRemoveContact(item._id)}
                      title="Remove contact"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Responsive CSS injected via style tag */}
      <style>{`
        @media (max-width: 480px) {
          .contacts-msg-btn-text { display: none !important; }
        }
        @media (max-width: 360px) {
          .contacts-name-max { max-width: 110px !important; }
        }
      `}</style>
    </div>
  );
};

export default Contacts;
