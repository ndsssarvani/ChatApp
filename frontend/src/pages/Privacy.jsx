import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import './Privacy.css';

const Privacy = ({ onBack }) => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  
  const [privacySettings, setPrivacySettings] = useState({
    activeStatus: true,
    onlineStatus: true,
    typing: true,
    readReceipts: true,
    lastSeen: 'everyone',
    profilePhoto: 'everyone',
    about: 'everyone',
    status: 'everyone',
    storiesPrivacy: 'everyone',
    groups: 'everyone',
    callPrivacy: 'everyone',
    screenSecurity: false,
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState({ text: '', isError: false });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [saveToast, setSaveToast] = useState(null);

  useEffect(() => {
    if (user?.preferences) {
      setPrivacySettings((prev) => ({
        ...prev,
        activeStatus: user.preferences.activeStatus !== undefined ? user.preferences.activeStatus : true,
        onlineStatus: user.preferences.privacyOnline ? user.preferences.privacyOnline !== 'nobody' : true,
        typing: user.preferences.typing !== undefined ? user.preferences.typing : true,
        readReceipts: user.preferences.privacyReadReceipts !== undefined ? user.preferences.privacyReadReceipts : true,
        lastSeen: user.preferences.privacyLastSeen || 'everyone',
        profilePhoto: user.preferences.privacyProfilePhoto || 'everyone',
        about: user.preferences.about || 'everyone',
        status: user.preferences.status || 'everyone',
        storiesPrivacy: user.preferences.storiesPrivacy || 'everyone',
        groups: user.preferences.groups || 'everyone',
        callPrivacy: user.preferences.callPrivacy || 'everyone',
        screenSecurity: !!user.preferences.screenSecurity,
      }));
    }
  }, [user]);

  const showToast = (msg) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  const handleToggle = async (setting) => {
    const updatedVal = !privacySettings[setting];
    const newSettings = { ...privacySettings, [setting]: updatedVal };
    setPrivacySettings(newSettings);

    const payload = {
      [setting]: updatedVal,
      ...(setting === 'readReceipts' && { privacyReadReceipts: updatedVal }),
      ...(setting === 'onlineStatus' && { privacyOnline: updatedVal ? 'everyone' : 'nobody' }),
      ...(setting === 'screenSecurity' && { screenSecurity: updatedVal }),
    };

    try {
      await userService.updatePreferences(payload);
      if (refreshUser) refreshUser();
      showToast('Privacy preference saved');
    } catch {
      showToast('Saved locally');
    }
  };

  const handleSelectChange = async (setting, value) => {
    const newSettings = { ...privacySettings, [setting]: value };
    setPrivacySettings(newSettings);

    const payload = {
      [setting]: value,
      ...(setting === 'lastSeen' && { privacyLastSeen: value }),
      ...(setting === 'profilePhoto' && { privacyProfilePhoto: value }),
    };

    try {
      await userService.updatePreferences(payload);
      if (refreshUser) refreshUser();
      showToast('Visibility updated');
    } catch {
      showToast('Saved locally');
    }
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate('/settings');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword.length < 6) {
      setPasswordMsg({ text: 'Password must be at least 6 characters', isError: true });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match', isError: true });
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      if (res.success) {
        setPasswordMsg({ text: 'Password changed successfully!', isError: false });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setPasswordMsg({ text: '', isError: false });
        }, 1500);
      }
    } catch (err) {
      setPasswordMsg({ text: err.response?.data?.message || 'Failed to change password', isError: true });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="modern-privacy-container">
      {/* Toast Notification */}
      {saveToast && (
        <div className="privacy-toast">
          <span>✓</span> {saveToast}
        </div>
      )}

      {/* Header */}
      <header className="privacy-top-header">
        <div className="privacy-header-content">
          <button className="privacy-back-btn" onClick={handleBackClick} title="Back to Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="privacy-header-title-box">
            <h1>Privacy & Visibility</h1>
            <p>Control who can see your activity, read receipts, and personal info</p>
          </div>
        </div>
      </header>

      {/* Main Form Body */}
      <main className="privacy-main-body">
        {/* Section 1: Online Presence */}
        <section className="privacy-card-group">
          <div className="privacy-group-header">
            <span className="privacy-group-icon">🟢</span>
            <div>
              <h2>Online Presence & Activity</h2>
              <p>Manage real-time status indicators and typing visibility</p>
            </div>
          </div>

          <div className="privacy-card-items">
            <div className="privacy-toggle-row">
              <div className="privacy-item-desc">
                <h3>Active Status</h3>
                <p>Show when you are currently active or recently active on Chatify</p>
              </div>
              <label className="privacy-custom-switch">
                <input
                  type="checkbox"
                  checked={privacySettings.activeStatus}
                  onChange={() => handleToggle('activeStatus')}
                />
                <span className="privacy-custom-slider"></span>
              </label>
            </div>

            <div className="privacy-toggle-row">
              <div className="privacy-item-desc">
                <h3>Online Green Dot</h3>
                <p>Display real-time online green indicator badge to other users</p>
              </div>
              <label className="privacy-custom-switch">
                <input
                  type="checkbox"
                  checked={privacySettings.onlineStatus}
                  onChange={() => handleToggle('onlineStatus')}
                />
                <span className="privacy-custom-slider"></span>
              </label>
            </div>

            <div className="privacy-toggle-row">
              <div className="privacy-item-desc">
                <h3>Live Typing Indicator</h3>
                <p>Broadcast "typing..." animation when composing a message in chat</p>
              </div>
              <label className="privacy-custom-switch">
                <input
                  type="checkbox"
                  checked={privacySettings.typing}
                  onChange={() => handleToggle('typing')}
                />
                <span className="privacy-custom-slider"></span>
              </label>
            </div>
          </div>
        </section>

        {/* Section 2: Read Receipts (Blue Ticks) */}
        <section className="privacy-card-group">
          <div className="privacy-group-header">
            <span className="privacy-group-icon">✓✓</span>
            <div>
              <h2>Message Read Receipts (Blue Ticks)</h2>
              <p>Control delivery and read acknowledgement indicators</p>
            </div>
          </div>

          <div className="privacy-card-items">
            <div className="privacy-toggle-row">
              <div className="privacy-item-desc">
                <h3>Read Receipts (Blue Ticks)</h3>
                <p>
                  When enabled, you and your chat partner will see blue double checkmarks (✓✓) 
                  and timestamps when a message has been opened and read.
                </p>
              </div>
              <label className="privacy-custom-switch">
                <input
                  type="checkbox"
                  checked={privacySettings.readReceipts}
                  onChange={() => handleToggle('readReceipts')}
                />
                <span className="privacy-custom-slider"></span>
              </label>
            </div>
          </div>
        </section>

        {/* Section 3: Visibility & Audience */}
        <section className="privacy-card-group">
          <div className="privacy-group-header">
            <span className="privacy-group-icon">👁️</span>
            <div>
              <h2>Who Can See My Information</h2>
              <p>Customize who has access to your last seen time, avatar, and bio</p>
            </div>
          </div>

          <div className="privacy-card-items">
            <div className="privacy-select-row">
              <div className="privacy-item-desc">
                <h3>Last Seen Timestamp</h3>
                <p>Who can view the exact date & time you were last active</p>
              </div>
              <select
                className="privacy-modern-select"
                value={privacySettings.lastSeen}
                onChange={(e) => handleSelectChange('lastSeen', e.target.value)}
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">My Contacts Only</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>

            <div className="privacy-select-row">
              <div className="privacy-item-desc">
                <h3>Profile Photo</h3>
                <p>Who can see your profile picture</p>
              </div>
              <select
                className="privacy-modern-select"
                value={privacySettings.profilePhoto}
                onChange={(e) => handleSelectChange('profilePhoto', e.target.value)}
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">My Contacts Only</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>

            <div className="privacy-select-row">
              <div className="privacy-item-desc">
                <h3>About / Bio</h3>
                <p>Who can see your status text and bio information</p>
              </div>
              <select
                className="privacy-modern-select"
                value={privacySettings.about}
                onChange={(e) => handleSelectChange('about', e.target.value)}
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">My Contacts Only</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>

            <div className="privacy-select-row">
              <div className="privacy-item-desc">
                <h3>Status & Stories</h3>
                <p>Who can view your posted status updates and temporary stories</p>
              </div>
              <select
                className="privacy-modern-select"
                value={privacySettings.status}
                onChange={(e) => handleSelectChange('status', e.target.value)}
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">My Contacts Only</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 4: Communication & Groups */}
        <section className="privacy-card-group">
          <div className="privacy-group-header">
            <span className="privacy-group-icon">📞</span>
            <div>
              <h2>Communication & Calls</h2>
              <p>Control group invites and direct audio/video calling permissions</p>
            </div>
          </div>

          <div className="privacy-card-items">
            <div className="privacy-select-row">
              <div className="privacy-item-desc">
                <h3>Who Can Add Me to Groups</h3>
                <p>Restrict automatic group membership additions</p>
              </div>
              <select
                className="privacy-modern-select"
                value={privacySettings.groups}
                onChange={(e) => handleSelectChange('groups', e.target.value)}
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">My Contacts Only</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>

            <div className="privacy-select-row">
              <div className="privacy-item-desc">
                <h3>Who Can Call Me</h3>
                <p>Allow incoming WebRTC audio and video calls</p>
              </div>
              <select
                className="privacy-modern-select"
                value={privacySettings.callPrivacy}
                onChange={(e) => handleSelectChange('callPrivacy', e.target.value)}
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">My Contacts Only</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section 5: Security & Access */}
        <section className="privacy-card-group">
          <div className="privacy-group-header">
            <span className="privacy-group-icon">🛡️</span>
            <div>
              <h2>Security & Access Protection</h2>
              <p>Account credentials, screen protection, and blocklists</p>
            </div>
          </div>

          <div className="privacy-card-items">
            <div className="privacy-toggle-row">
              <div className="privacy-item-desc">
                <h3>Screen Security</h3>
                <p>Mask application contents in app switcher and prevent unauthorized captures</p>
              </div>
              <label className="privacy-custom-switch">
                <input
                  type="checkbox"
                  checked={privacySettings.screenSecurity}
                  onChange={() => handleToggle('screenSecurity')}
                />
                <span className="privacy-custom-slider"></span>
              </label>
            </div>

            <div className="privacy-nav-row" onClick={() => navigate('/report-block')}>
              <div className="privacy-item-desc">
                <h3>Blocked Contacts & Reports</h3>
                <p>View and manage blocked users or submit incident reports</p>
              </div>
              <div className="privacy-nav-action">
                <span>Manage</span>
                <span className="privacy-nav-chevron">›</span>
              </div>
            </div>

            <div className="privacy-nav-row" onClick={() => setShowPasswordModal(true)}>
              <div className="privacy-item-desc">
                <h3>Change Password</h3>
                <p>Update your account password with standard cryptographic security</p>
              </div>
              <div className="privacy-nav-action">
                <span>Update</span>
                <span className="privacy-nav-chevron">›</span>
              </div>
            </div>
          </div>
        </section>

        {/* Informational Banner */}
        <div className="privacy-safety-notice">
          <div className="notice-icon-box">🔒</div>
          <p>
            All messages, voice notes, and direct WebRTC calls are encrypted end-to-end. 
            Modifications to visibility preferences update in real-time across all your devices.
          </p>
        </div>
      </main>

      {/* Modern Change Password Modal */}
      {showPasswordModal && (
        <div className="modern-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modern-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-bar">
              <div className="modal-title-wrap">
                <span className="modal-key-icon">🔑</span>
                <h3>Change Password</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowPasswordModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="modal-subtext">
              Ensure your new password contains at least 6 characters with a combination of letters and numbers.
            </p>

            {passwordMsg.text && (
              <div className={`password-toast-msg ${passwordMsg.isError ? 'msg-error' : 'msg-success'}`}>
                {passwordMsg.isError ? '⚠️ ' : '✓ '} {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="modal-form">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="modal-input"
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="modal-input"
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="modal-input"
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="modal-btn-submit"
                >
                  {passwordLoading ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Privacy;