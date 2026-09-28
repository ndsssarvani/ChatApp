import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import conversationService from '../services/conversationService';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const GroupManagement = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { t } = useLanguage();

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add People Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Invite Link State
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Feedback State
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

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
        if (groupList.length > 0) {
          setSelectedGroup((prev) => {
            if (prev) {
              const updated = groupList.find((g) => g._id === prev._id);
              return updated || groupList[0];
            }
            return groupList[0];
          });
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

  // Fetch or refresh invite link when selected group changes or section opens
  const loadInviteLink = async (groupId) => {
    if (!groupId) return;
    try {
      setInviteLoading(true);
      const res = await conversationService.getGroupInvite(groupId);
      if (res.success) {
        setInviteData(res);
      }
    } catch (err) {
      console.error('Failed to load invite link:', err);
    } finally {
      setInviteLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGroup && showInviteSection) {
      loadInviteLink(selectedGroup._id);
    }
  }, [selectedGroup?._id, showInviteSection]);

  // Handle Multi-Select in Add Modal
  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Submit Add Members
  const handleAddMembersSubmit = async () => {
    if (!selectedGroup || selectedUserIds.length === 0) return;
    try {
      setIsSubmittingAdd(true);
      const res = await conversationService.addMembers(selectedGroup._id, selectedUserIds);
      if (res.success) {
        setSelectedGroup(res.conversation);
        setSelectedUserIds([]);
        setShowAddModal(false);
        setUserSearchQuery('');
        showToast(t('memberAdded') || 'Member(s) added successfully!');
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add members');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Remove Member
  const handleRemoveMember = async (userId, memberName) => {
    if (!selectedGroup) return;
    const confirmMsg = t('removeMemberConfirm') || `Remove ${memberName || 'this member'} from the group?`;
    if (window.confirm(confirmMsg)) {
      try {
        const res = await conversationService.removeMember(selectedGroup._id, userId);
        if (res.success) {
          setSelectedGroup(res.conversation);
          showToast(t('memberRemoved') || 'Member removed successfully');
          loadData();
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to remove member');
      }
    }
  };

  // Leave Group
  const handleLeaveGroup = async () => {
    if (!selectedGroup) return;
    const confirmMsg = t('leaveGroupConfirm') || 'Are you sure you want to leave this group?';
    if (window.confirm(confirmMsg)) {
      try {
        await conversationService.removeMember(selectedGroup._id, currentUser._id);
        navigate('/dashboard');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to leave group');
      }
    }
  };

  // Copy Invite Link
  const handleCopyInviteLink = () => {
    if (!inviteData?.inviteToken) return;
    const fullUrl = `${window.location.origin}/invite/${inviteData.inviteToken}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setInviteCopied(true);
      showToast(t('linkCopied') || 'Invite link copied!');
      setTimeout(() => setInviteCopied(false), 2500);
    });
  };

  // Share Invite Link via Web Share API
  const handleShareInviteLink = async () => {
    if (!inviteData?.inviteToken) return;
    const fullUrl = `${window.location.origin}/invite/${inviteData.inviteToken}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedGroup?.groupName || 'Chatify Group',
          text: `Join "${selectedGroup?.groupName || 'our group'}" on Chatify!`,
          url: fullUrl,
        });
      } catch (e) {
        // User cancelled share, fallback to copy
        handleCopyInviteLink();
      }
    } else {
      handleCopyInviteLink();
    }
  };

  // Regenerate Invite Link
  const handleRegenerateInviteLink = async () => {
    if (!selectedGroup) return;
    const confirmMsg = t('regenerateInviteConfirm') || 'Regenerating will invalidate the previous invite link. Continue?';
    if (window.confirm(confirmMsg)) {
      try {
        setInviteLoading(true);
        const res = await conversationService.regenerateGroupInvite(selectedGroup._id);
        if (res.success) {
          setInviteData(res);
          showToast('New invite link generated!');
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to regenerate invite link');
      } finally {
        setInviteLoading(false);
      }
    }
  };

  // Toggle Invite Link Active / Disabled
  const handleToggleInviteStatus = async () => {
    if (!selectedGroup || !inviteData) return;
    try {
      setInviteLoading(true);
      const newStatus = !inviteData.inviteEnabled;
      const res = await conversationService.toggleGroupInviteStatus(selectedGroup._id, newStatus);
      if (res.success) {
        setInviteData((prev) => ({ ...prev, inviteEnabled: res.inviteEnabled }));
        showToast(res.inviteEnabled ? t('enableLink') : t('disableLink'));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update invite link status');
    } finally {
      setInviteLoading(false);
    }
  };

  // Permissions helpers
  const isOwner = selectedGroup?.groupOwner
    ? (selectedGroup.groupOwner._id || selectedGroup.groupOwner) === currentUser?._id
    : (selectedGroup?.admins?.[0]?._id || selectedGroup?.admins?.[0]) === currentUser?._id;

  const isAdmin = isOwner || selectedGroup?.admins?.some((a) => (a._id || a) === currentUser?._id);

  // Available users to add (excluding current participants)
  const availableUsersToAdd = allUsers.filter(
    (u) =>
      u._id !== currentUser?._id &&
      !selectedGroup?.participants?.some((p) => (p._id || p) === u._id) &&
      (userSearchQuery
        ? u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
          u.username?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
        : true)
  );

  const inviteUrl = inviteData?.inviteToken ? `${window.location.origin}/invite/${inviteData.inviteToken}` : '';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary, #ffffff)',
        color: 'var(--text-primary, #1a1a1a)',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        padding: '24px 16px calc(40px + env(safe-area-inset-bottom, 0px))',
        maxWidth: '960px',
        margin: '0 auto',
      }}
    >
      <style>{`
        .group-layout-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
        }
        @media (max-width: 768px) {
          .group-layout-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }
        .action-btn {
          padding: 8px 14px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
        }
        .action-btn-primary {
          background: #e0521c;
          color: #ffffff;
        }
        .action-btn-primary:hover {
          background: #c84414;
        }
        .action-btn-secondary {
          background: var(--bg-primary, #ffffff);
          color: var(--text-primary, #1a1a1a);
          border: 1px solid var(--border-color, #dee2e6);
        }
        .action-btn-secondary:hover {
          background: var(--bg-tertiary, #f1f3f5);
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        .modal-card {
          width: 100%;
          max-width: 480px;
          background: var(--bg-primary, #ffffff);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-color, #dee2e6);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }
        .toast-banner {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #1f2937;
          color: #f9fafb;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          z-index: 1100;
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Toast Notification */}
      {toastMessage && <div className="toast-banner">✓ {toastMessage}</div>}

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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'inherit',
          }}
          title={t('back') || 'Back'}
        >
          ←
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>
          👥 {t('groupManagementTitle') || 'Group Management'}
        </h1>
        <div style={{ width: '40px' }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
          <p>Loading groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>👥</div>
          <h3 style={{ color: 'var(--text-primary)' }}>{t('noGroupsFound') || 'No Groups Found'}</h3>
          <p style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px' }}>
            {t('createGroupPrompt') || 'Create a group from the dashboard to collaborate with your team.'}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="action-btn action-btn-primary"
            style={{ padding: '12px 24px', fontSize: '15px' }}
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="group-layout-grid">
          {/* Left Column: Groups List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3
              style={{
                fontSize: '12px',
                color: 'var(--text-tertiary, #6b7280)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                margin: '0 0 8px 4px',
              }}
            >
              {t('yourGroups') || 'Your Groups'} ({groups.length})
            </h3>
            {groups.map((g) => {
              const isSelected = selectedGroup?._id === g._id;
              return (
                <div
                  key={g._id}
                  onClick={() => setSelectedGroup(g)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    background: isSelected ? '#e0521c' : 'var(--bg-secondary, #f8f9fa)',
                    color: isSelected ? '#ffffff' : 'inherit',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: isSelected ? 'none' : '1px solid var(--border-color, #dee2e6)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <img
                    src={g.groupAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${g.groupName}`}
                    alt={g.groupName}
                    style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {g.groupName}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                      {g.participants?.length || 0} {t('members')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Group Details & Management */}
          {selectedGroup && (
            <div
              style={{
                background: 'var(--bg-secondary, #f8f9fa)',
                padding: '24px',
                borderRadius: '20px',
                border: '1px solid var(--border-color, #dee2e6)',
              }}
            >
              {/* Group Profile Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginBottom: '20px',
                  paddingBottom: '20px',
                  borderBottom: '1px solid var(--border-color, #dee2e6)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img
                    src={selectedGroup.groupAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${selectedGroup.groupName}`}
                    alt={selectedGroup.groupName}
                    style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover' }}
                  />
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0' }}>
                      {selectedGroup.groupName}
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary, #6b7280)', margin: 0 }}>
                      {selectedGroup.groupDescription || 'No description set'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/dashboard')}
                  className="action-btn action-btn-secondary"
                  title="Open in Chat Dashboard"
                >
                  💬 Open Chat
                </button>
              </div>

              {/* Action Buttons: Add People & Invite Link */}
              {isAdmin && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
                  <button
                    onClick={() => {
                      setSelectedUserIds([]);
                      setUserSearchQuery('');
                      setShowAddModal(true);
                    }}
                    className="action-btn action-btn-primary"
                  >
                    + {t('addPeople') || 'Add People'}
                  </button>

                  <button
                    onClick={() => setShowInviteSection(!showInviteSection)}
                    className="action-btn action-btn-secondary"
                  >
                    🔗 {t('inviteViaLink') || 'Invite via Link'}
                  </button>
                </div>
              )}

              {/* Invite Link Panel (Expandable) */}
              {showInviteSection && (
                <div
                  style={{
                    background: 'var(--bg-primary, #ffffff)',
                    padding: '18px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color, #dee2e6)',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>
                        🔗 {t('invitePeople') || 'Group Invite Link'}
                      </span>
                      {inviteData && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: inviteData.inviteEnabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: inviteData.inviteEnabled ? '#16a34a' : '#ef4444',
                          }}
                        >
                          {inviteData.inviteEnabled ? 'Active' : 'Disabled'}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setShowInviteSection(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '16px' }}
                    >
                      ✕
                    </button>
                  </div>

                  {inviteLoading ? (
                    <p style={{ fontSize: '13px', color: '#9ca3af', margin: '8px 0' }}>Loading invite link...</p>
                  ) : (
                    <>
                      <div
                        style={{
                          background: 'var(--bg-secondary, #f8f9fa)',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-color, #dee2e6)',
                          fontSize: '13px',
                          wordBreak: 'break-all',
                          fontFamily: 'monospace',
                          marginBottom: '14px',
                          color: inviteData?.inviteEnabled ? 'inherit' : '#9ca3af',
                          textDecoration: inviteData?.inviteEnabled ? 'none' : 'line-through',
                        }}
                      >
                        {inviteUrl || 'Generating link...'}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <button
                          onClick={handleCopyInviteLink}
                          disabled={!inviteData?.inviteEnabled}
                          className="action-btn action-btn-primary"
                        >
                          {inviteCopied ? '✓ Copied!' : `📋 ${t('copyLink') || 'Copy Link'}`}
                        </button>

                        <button
                          onClick={handleShareInviteLink}
                          disabled={!inviteData?.inviteEnabled}
                          className="action-btn action-btn-secondary"
                        >
                          ↗ {t('shareLink') || 'Share'}
                        </button>

                        <button
                          onClick={handleRegenerateInviteLink}
                          className="action-btn action-btn-secondary"
                          title="Generate a new link and invalidate the old one"
                        >
                          🔄 {t('regenerateLink') || 'Regenerate'}
                        </button>

                        <button
                          onClick={handleToggleInviteStatus}
                          className="action-btn action-btn-secondary"
                          style={{
                            color: inviteData?.inviteEnabled ? '#ef4444' : '#16a34a',
                          }}
                        >
                          {inviteData?.inviteEnabled ? `🚫 ${t('disableLink') || 'Disable'}` : `✓ ${t('enableLink') || 'Enable'}`}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Members List */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: 700 }}>
                  {t('groupParticipants') || 'Group Members'} ({selectedGroup.participants?.length || 0})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedGroup.participants?.map((member) => {
                    const mId = member._id || member;
                    const isSelf = mId === currentUser?._id;

                    const memberIsOwner = selectedGroup.groupOwner
                      ? (selectedGroup.groupOwner._id || selectedGroup.groupOwner) === mId
                      : (selectedGroup.admins?.[0]?._id || selectedGroup.admins?.[0]) === mId;

                    const memberIsAdmin = memberIsOwner || selectedGroup.admins?.some((a) => (a._id || a) === mId);

                    // Permission to remove: Owner can remove anyone (except themselves), Admin can remove non-admins
                    const canRemove =
                      !isSelf &&
                      !memberIsOwner &&
                      (isOwner || (isAdmin && !memberIsAdmin));

                    return (
                      <div
                        key={mId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          background: 'var(--bg-primary, #fff)',
                          border: '1px solid var(--border-color, #dee2e6)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name || 'User'}`}
                            alt={member.name}
                            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{member.name || 'Member'}</span>
                              {isSelf && <span style={{ fontSize: '12px', color: '#6b7280' }}>(You)</span>}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-tertiary, #6b7280)' }}>
                              {member.email || member.username}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {memberIsOwner ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '8px',
                                background: 'rgba(224, 82, 28, 0.15)',
                                color: '#e0521c',
                              }}
                            >
                              👑 {t('groupOwnerRole') || 'Owner'}
                            </span>
                          ) : memberIsAdmin ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: '8px',
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: '#3b82f6',
                              }}
                            >
                              ⭐ {t('groupAdminRole') || 'Admin'}
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '3px 8px',
                                borderRadius: '8px',
                                background: 'var(--bg-tertiary, #f1f3f5)',
                                color: 'var(--text-tertiary, #6b7280)',
                              }}
                            >
                              {t('groupMemberRole') || 'Member'}
                            </span>
                          )}

                          {canRemove && (
                            <button
                              onClick={() => handleRemoveMember(mId, member.name)}
                              style={{
                                padding: '4px 10px',
                                background: 'rgba(239, 68, 68, 0.08)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {t('remove') || 'Remove'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Leave Group Button */}
              <button
                onClick={handleLeaveGroup}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                🚪 {t('leaveGroup') || 'Leave Group'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── ADD PEOPLE MODAL ─── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                  + {t('addPeople') || 'Add People'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-tertiary, #6b7280)' }}>
                  Add members to {selectedGroup?.groupName}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder={t('searchPeoplePlaceholder') || 'Search people by name or email...'}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, #dee2e6)',
                  background: 'var(--bg-secondary, #f8f9fa)',
                  color: 'inherit',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Users List with Multi-Select Checkboxes */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                maxHeight: '260px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '20px',
              }}
            >
              {availableUsersToAdd.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af', fontSize: '14px' }}>
                  {t('noUsersFound') || 'No users available to add'}
                </div>
              ) : (
                availableUsersToAdd.map((userItem) => {
                  const isSelected = selectedUserIds.includes(userItem._id);
                  return (
                    <div
                      key={userItem._id}
                      onClick={() => toggleUserSelection(userItem._id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: isSelected ? 'rgba(224, 82, 28, 0.12)' : 'var(--bg-secondary, #f8f9fa)',
                        border: isSelected ? '1px solid #e0521c' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={userItem.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userItem.name}`}
                          alt={userItem.name}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px' }}>{userItem.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary, #6b7280)' }}>
                            {userItem.email || userItem.username}
                          </div>
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleUserSelection(userItem._id)}
                        style={{ width: '18px', height: '18px', accentColor: '#e0521c', cursor: 'pointer' }}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowAddModal(false)}
                className="action-btn action-btn-secondary"
              >
                {t('cancel')}
              </button>

              <button
                onClick={handleAddMembersSubmit}
                disabled={selectedUserIds.length === 0 || isSubmittingAdd}
                className="action-btn action-btn-primary"
                style={{ opacity: selectedUserIds.length === 0 ? 0.6 : 1 }}
              >
                {isSubmittingAdd ? 'Adding...' : `${t('addToGroup') || 'Add to Group'} (${selectedUserIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManagement;
