import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';
import conversationService from '../services/conversationService';
import { useSocket } from '../context/SocketContext';

const Contacts = () => {
  const navigate = useNavigate();
  const { isUserOnline } = useSocket();
  const [contacts, setContacts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' | 'directory'

  const loadData = async () => {
    try {
      setLoading(true);
      const [contactsRes, usersRes] = await Promise.all([
        userService.getContacts(),
        userService.getUsers(),
      ]);
      if (contactsRes.success) setContacts(contactsRes.contacts);
      if (usersRes.success) setAllUsers(usersRes.users);
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

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = allUsers.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #ffffff)',
      color: 'var(--text-primary, #1a1a1a)',
      fontFamily: 'Inter, sans-serif',
      padding: '24px 20px',
      maxWidth: '800px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'var(--bg-tertiary, #f1f3f5)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '18px',
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Contacts & Directory</h1>
        <div style={{ width: '40px' }} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('contacts')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'contacts' ? '#22c55e' : 'var(--bg-tertiary, #f1f3f5)',
            color: activeTab === 'contacts' ? '#ffffff' : 'inherit',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          My Contacts ({contacts.length})
        </button>
        <button
          onClick={() => setActiveTab('directory')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'directory' ? '#22c55e' : 'var(--bg-tertiary, #f1f3f5)',
            color: activeTab === 'directory' ? '#ffffff' : 'inherit',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Explore All Users ({allUsers.length})
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px 12px 40px',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #dee2e6)',
            background: 'var(--bg-secondary, #f8f9fa)',
            color: 'inherit',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <span style={{ position: 'absolute', left: '14px', top: '12px', color: '#9ca3af' }}>🔍</span>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading contacts...</div>
      ) : activeTab === 'contacts' ? (
        filteredContacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📇</div>
            <h3>No contacts yet</h3>
            <p style={{ fontSize: '14px' }}>Add users from the Explore All Users tab to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredContacts.map((contact) => {
              const online = isUserOnline(contact._id);
              return (
                <div
                  key={contact._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--bg-secondary, #f8f9fa)',
                    border: '1px solid var(--border-color, #dee2e6)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={contact.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${contact.name}`}
                        alt={contact.name}
                        style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      {online && (
                        <div style={{
                          position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px',
                          borderRadius: '50%', background: '#22c55e', border: '2px solid white'
                        }} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>{contact.name}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {online ? 'Online' : contact.bio || contact.email}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleStartChat(contact._id)}
                      style={{
                        padding: '6px 12px',
                        background: '#22c55e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => handleRemoveContact(contact._id)}
                      style={{
                        padding: '6px 10px',
                        background: 'transparent',
                        color: '#ef4444',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Directory Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredUsers.map((userItem) => {
            const isContact = contacts.some((c) => c._id === userItem._id);
            const online = isUserOnline(userItem._id);
            return (
              <div
                key={userItem._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary, #f8f9fa)',
                  border: '1px solid var(--border-color, #dee2e6)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={userItem.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userItem.name}`}
                      alt={userItem.name}
                      style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    {online && (
                      <div style={{
                        position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px',
                        borderRadius: '50%', background: '#22c55e', border: '2px solid white'
                      }} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{userItem.name}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {userItem.bio || userItem.email}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleStartChat(userItem._id)}
                    style={{
                      padding: '6px 12px',
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Message
                  </button>
                  {!isContact && (
                    <button
                      onClick={() => handleAddContact(userItem._id)}
                      style={{
                        padding: '6px 12px',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      + Add
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
