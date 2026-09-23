import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';

const ReportBlockUser = () => {
  const navigate = useNavigate();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('blocked'); // 'blocked' | 'report'

  // Report form
  const [reportUserId, setReportUserId] = useState('');
  const [reportReason, setReportReason] = useState('Harassment');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [blockedRes, usersRes] = await Promise.all([
        userService.getBlockedUsers(),
        userService.getUsers(),
      ]);
      if (blockedRes.success) setBlockedUsers(blockedRes.blockedUsers || []);
      if (usersRes.success) setAllUsers(usersRes.users || []);
    } catch (err) {
      console.error('Failed to load blocked users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUnblock = async (id) => {
    try {
      const res = await userService.unblockUser(id);
      if (res.success) {
        setBlockedUsers((prev) => prev.filter((u) => u._id !== id));
      }
    } catch (err) {
      alert('Failed to unblock user');
    }
  };

  const handleBlockUser = async (id) => {
    try {
      const res = await userService.blockUser(id);
      if (res.success) {
        loadData();
      }
    } catch (err) {
      alert('Failed to block user');
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportUserId) return;

    try {
      const res = await userService.reportUser({
        reportedUserId: reportUserId,
        reason: reportReason,
        details: reportDetails,
      });

      if (res.success) {
        setReportSuccess('Report submitted to moderation team. Thank you for keeping our community safe.');
        setReportUserId('');
        setReportDetails('');
        setTimeout(() => setReportSuccess(''), 4000);
      }
    } catch (err) {
      alert('Failed to submit report');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #ffffff)',
      color: 'var(--text-primary, #1a1a1a)',
      fontFamily: 'Inter, sans-serif',
      padding: '24px 20px',
      maxWidth: '750px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
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
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>🚫 Safety & Moderation</h1>
        <div style={{ width: '40px' }} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('blocked')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'blocked' ? '#ef4444' : 'var(--bg-tertiary, #f1f3f5)',
            color: activeTab === 'blocked' ? '#ffffff' : 'inherit',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Blocked Users ({blockedUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('report')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'report' ? '#ef4444' : 'var(--bg-tertiary, #f1f3f5)',
            color: activeTab === 'report' ? '#ffffff' : 'inherit',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Report an Account
        </button>
      </div>

      {activeTab === 'blocked' ? (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading blocked list...</div>
          ) : blockedUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛡️</div>
              <h3>No Blocked Users</h3>
              <p style={{ fontSize: '14px' }}>You haven't blocked anyone yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {blockedUsers.map((u) => (
                <div
                  key={u._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: 'var(--bg-secondary, #f8f9fa)',
                    border: '1px solid var(--border-color, #dee2e6)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`}
                      alt={u.name}
                      style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{u.name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{u.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblock(u._id)}
                    style={{
                      padding: '6px 14px',
                      background: 'transparent',
                      color: '#22c55e',
                      border: '1px solid #22c55e',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Report Form */
        <div style={{
          background: 'var(--bg-secondary, #f8f9fa)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid var(--border-color, #dee2e6)',
        }}>
          {reportSuccess && (
            <div style={{
              padding: '12px',
              background: '#dcfce7',
              color: '#15803d',
              borderRadius: '10px',
              marginBottom: '16px',
              fontWeight: 500,
            }}>
              {reportSuccess}
            </div>
          )}

          <form onSubmit={handleSubmitReport}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Select User to Report
              </label>
              <select
                required
                value={reportUserId}
                onChange={(e) => setReportUserId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
              >
                <option value="">Choose user...</option>
                {allUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Reason for Report
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
              >
                <option value="Harassment">Harassment or Bullying</option>
                <option value="Spam">Spam or Unsolicited Promotion</option>
                <option value="Inappropriate">Inappropriate or Explicit Content</option>
                <option value="Impersonation">Impersonation or Fake Account</option>
                <option value="Other">Other Violation</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Additional Details (Optional)
              </label>
              <textarea
                rows={4}
                placeholder="Please describe what happened..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={!reportUserId}
              style={{
                width: '100%',
                padding: '12px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Submit Report
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ReportBlockUser;
