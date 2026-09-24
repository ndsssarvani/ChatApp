import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';
import conversationService from '../services/conversationService';
import { useSocket } from '../context/SocketContext';
import { useCall } from '../context/CallContext';

const Contacts = () => {
  const navigate = useNavigate();
  const { isUserOnline } = useSocket();
  const { startCall } = useCall();
  const [contacts, setContacts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' | 'online' | 'directory'

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

  useEffect(() => {
    loadData();
  }, []);

  const handleStartChat = async (userId) => {
    try {
      const res = await conversationService.getOrCreateOneToOne(userId);
      if (res.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start chat');
    }
  };

  const handleAddContact = async (userId) => {
    try {
      const res = await userService.addContact(userId);
      if (res.success) {
        loadData();
      }
    } catch (err) {
      alert('Failed to add contact');
    }
  };

  const handleRemoveContact = async (userId) => {
    if (window.confirm('Remove contact?')) {
      try {
        const res = await userService.removeContact(userId);
        if (res.success) {
          loadData();
        }
      } catch (err) {
        alert('Failed to remove contact');
      }
    }
  };

  const onlineContacts = contacts.filter((c) => isUserOnline(c._id));

  const getFilteredList = () => {
    let source = [];
    if (activeTab === 'contacts') source = contacts;
    else if (activeTab === 'online') source = onlineContacts;
    else source = allUsers;

    return source.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.username && item.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const displayList = getFilteredList();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #0b0f19)',
      color: 'var(--text-primary, #f8fafc)',
      fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
      padding: '24px 20px 60px',
      maxWidth: '820px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            width: '42px',
            height: '42px',
            cursor: 'pointer',
            fontSize: '18px',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          title="Back to Dashboard"
        >
          ←
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Contacts & Online Users
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
            {onlineContacts.length} {onlineContacts.length === 1 ? 'contact' : 'contacts'} currently online
          </p>
        </div>
        <button
          onClick={loadData}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            width: '42px',
            height: '42px',
            cursor: 'pointer',
            fontSize: '16px',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Refresh contacts"
        >
          🔄
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '6px',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <button
          onClick={() => setActiveTab('contacts')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'contacts' ? '#38bdf8' : 'transparent',
            color: activeTab === 'contacts' ? '#0b0f19' : '#94a3b8',
            fontWeight: 700,
            fontSize: '13.5px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          My Contacts ({contacts.length})
        </button>
        <button
          onClick={() => setActiveTab('online')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'online' ? '#22c55e' : 'transparent',
            color: activeTab === 'online' ? '#ffffff' : '#94a3b8',
            fontWeight: 700,
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', border: '1.5px solid white' }}></span>
          Online Now ({onlineContacts.length})
        </button>
        <button
          onClick={() => setActiveTab('directory')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'directory' ? '#818cf8' : 'transparent',
            color: activeTab === 'directory' ? '#ffffff' : '#94a3b8',
            fontWeight: 700,
            fontSize: '13.5px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Explore All ({allUsers.length})
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder={activeTab === 'online' ? "Search online contacts..." : "Search by name, handle, or email..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '13px 16px 13px 44px',
            borderRadius: '14px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'inherit',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <span style={{ position: 'absolute', left: '16px', top: '14px', color: '#64748b' }}>🔍</span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute', right: '14px', top: '13px',
              background: 'rgba(255, 255, 255, 0.15)', border: 'none',
              borderRadius: '50%', width: '22px', height: '22px',
              color: 'white', cursor: 'pointer', fontSize: '11px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          Loading contacts & online status...
        </div>
      ) : displayList.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>
            {activeTab === 'online' ? '🟢' : '📇'}
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>
            {activeTab === 'online'
              ? 'No contacts currently online'
              : searchQuery
              ? 'No matching contacts found'
              : 'No contacts added yet'}
          </h3>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 20px' }}>
            {activeTab === 'online'
              ? 'When your contacts log into Chatify, they will appear here live.'
              : 'Explore all registered users to start connecting.'}
          </p>
          {activeTab !== 'directory' && (
            <button
              onClick={() => setActiveTab('directory')}
              style={{
                background: '#38bdf8',
                color: '#0b0f19',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 20px',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: 'pointer',
              }}
            >
              Explore All Users
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayList.map((item) => {
            const online = isUserOnline(item._id);
            const isContact = contacts.some((c) => c._id === item._id);

            return (
              <div
                key={item._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: online ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s',
                }}
              >
                {/* Left info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                  <div style={{ position: 'relative', width: '50px', height: '50px', flexShrink: 0 }}>
                    <img
                      src={item.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.name}`}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    {online ? (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 1,
                          right: 1,
                          width: '13px',
                          height: '13px',
                          borderRadius: '50%',
                          background: '#22c55e',
                          border: '2px solid #0b0f19',
                          boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)',
                        }}
                        title="Online"
                      />
                    ) : (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 1,
                          right: 1,
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#64748b',
                          border: '2px solid #0b0f19',
                        }}
                        title="Offline"
                      />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15.5px', color: '#f8fafc' }}>
                        {item.name}
                      </span>
                      {online && (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          background: 'rgba(34, 197, 94, 0.2)',
                          color: '#86efac',
                          padding: '2px 8px',
                          borderRadius: '10px',
                        }}>
                          Active
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: online ? '#38bdf8' : '#94a3b8',
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {online ? '● Online now' : item.bio || (item.username ? `@${item.username}` : item.email)}
                    </div>
                  </div>
                </div>

                {/* Right actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => startCall(item, 'audio')}
                    style={{
                      width: '38px',
                      height: '38px',
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#22c55e',
                      border: '1px solid rgba(34, 197, 94, 0.25)',
                      borderRadius: '10px',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    title="Start Audio Call"
                  >
                    📞
                  </button>
                  <button
                    type="button"
                    onClick={() => startCall(item, 'video')}
                    style={{
                      width: '38px',
                      height: '38px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '10px',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    title="Start Video Call"
                  >
                    📹
                  </button>
                  <button
                    onClick={() => handleStartChat(item._id)}
                    style={{
                      padding: '8px 16px',
                      background: '#38bdf8',
                      color: '#0b0f19',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                    }}
                  >
                    Message
                  </button>
                  {activeTab === 'directory' && !isContact && (
                    <button
                      onClick={() => handleAddContact(item._id)}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#f8fafc',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      + Add
                    </button>
                  )}
                  {isContact && (
                    <button
                      onClick={() => handleRemoveContact(item._id)}
                      style={{
                        width: '34px',
                        height: '34px',
                        background: 'transparent',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="Remove from contacts"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Contacts;
