import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import conversationService from '../services/conversationService';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';

const GroupManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addMemberId, setAddMemberId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [convRes, usersRes] = await Promise.all([
        conversationService.getConversations(),
        userService.getUsers(),
      ]);
      if (convRes.success) {
        const groupList = convRes.conversations.filter((c) => c.isGroup);
        setGroups(groupList);
        if (groupList.length > 0 && !selectedGroup) {
          setSelectedGroup(groupList[0]);
        }
      }
      if (usersRes.success) {
        setAllUsers(usersRes.users);
      }
    } catch (err) {
      console.error('Failed to load group management:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddMember = async () => {
    if (!addMemberId || !selectedGroup) return;
    try {
      const res = await conversationService.addMembers(selectedGroup._id, [addMemberId]);
      if (res.success) {
        setSelectedGroup(res.conversation);
        setAddMemberId('');
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!selectedGroup) return;
    if (window.confirm('Remove member from this group?')) {
      try {
        const res = await conversationService.removeMember(selectedGroup._id, userId);
        if (res.success) {
          setSelectedGroup(res.conversation);
          loadData();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to remove member');
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup) return;
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        await conversationService.removeMember(selectedGroup._id, currentUser._id);
        navigate('/dashboard');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to leave group');
      }
    }
  };

  const isAdmin = selectedGroup?.admins?.some((a) => (a._id || a) === currentUser?._id);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #ffffff)',
      color: 'var(--text-primary, #1a1a1a)',
      fontFamily: 'Inter, sans-serif',
      padding: '24px 20px',
      maxWidth: '850px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
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
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>👥 Group Management</h1>
        <div style={{ width: '40px' }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading groups...</div>
      ) : groups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>👥</div>
          <h3>No Groups Found</h3>
          <p style={{ fontSize: '14px' }}>Create a group from the dashboard to collaborate with your team.</p>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          {/* Groups list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: '14px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Groups</h3>
            {groups.map((g) => (
              <div
                key={g._id}
                onClick={() => setSelectedGroup(g)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: selectedGroup?._id === g._id ? '#22c55e' : 'var(--bg-secondary, #f8f9fa)',
                  color: selectedGroup?._id === g._id ? '#ffffff' : 'inherit',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span>👥</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.groupName}
                </span>
              </div>
            ))}
          </div>

          {/* Group details */}
          {selectedGroup && (
            <div style={{
              background: 'var(--bg-secondary, #f8f9fa)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--border-color, #dee2e6)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <img
                  src={selectedGroup.groupAvatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=group'}
                  alt={selectedGroup.groupName}
                  style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{selectedGroup.groupName}</h2>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
                    {selectedGroup.groupDescription || 'No group description'}
                  </p>
                </div>
              </div>

              {/* Add Member (Admin only) */}
              {isAdmin && (
                <div style={{ marginBottom: '24px', background: 'var(--bg-primary, #fff)', padding: '16px', borderRadius: '12px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Add Member to Group</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                      value={addMemberId}
                      onChange={(e) => setAddMemberId(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color, #dee2e6)',
                      }}
                    >
                      <option value="">Select a user...</option>
                      {allUsers
                        .filter((u) => !selectedGroup.participants?.some((p) => (p._id || p) === u._id))
                        .map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name} ({u.email})
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={handleAddMember}
                      disabled={!addMemberId}
                      style={{
                        padding: '10px 16px',
                        background: '#22c55e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Members List */}
              <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>
                Group Members ({selectedGroup.participants?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {selectedGroup.participants?.map((member) => {
                  const mId = member._id || member;
                  const memberIsAdmin = selectedGroup.admins?.some((a) => (a._id || a) === mId);
                  const isSelf = mId === currentUser?._id;

                  return (
                    <div
                      key={mId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'var(--bg-primary, #fff)',
                        border: '1px solid var(--border-color, #dee2e6)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name || 'U'}`}
                          alt={member.name}
                          style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>
                            {member.name || 'Member'} {isSelf && '(You)'}
                          </div>
                          {memberIsAdmin && (
                            <div style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>Group Admin</div>
                          )}
                        </div>
                      </div>

                      {isAdmin && !isSelf && (
                        <button
                          onClick={() => handleRemoveMember(mId)}
                          style={{
                            padding: '4px 8px',
                            background: 'transparent',
                            color: '#ef4444',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Leave group button */}
              <button
                onClick={handleLeaveGroup}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Leave Group
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupManagement;
