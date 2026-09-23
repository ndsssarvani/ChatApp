import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';
import './Privacy.css';

const Privacy = ({ onBack }) => {
  const navigate = useNavigate();
  
  const [privacySettings, setPrivacySettings] = useState({
    activeStatus: true,
    readReceipts: true,
    lastSeen: 'everyone',
    profilePhoto: 'everyone',
    about: 'everyone',
    status: 'contacts',
    groups: 'everyone',
    screenSecurity: false,
    onlineStatus: true,
    typing: true,
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState({ text: '', isError: false });

  const handleToggle = (setting) => {
    setPrivacySettings(prev => {
      const updated = {
        ...prev,
        [setting]: !prev[setting]
      };
      userService.updatePreferences(updated).catch(() => {});
      return updated;
    });
  };

  const handleSelectChange = (setting, value) => {
    setPrivacySettings(prev => {
      const updated = {
        ...prev,
        [setting]: value
      };
      userService.updatePreferences(updated).catch(() => {});
      return updated;
    });
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
    }
  };

  return (
    <div className="privacy-container">
      <div className="privacy-header">
        <div className="header-top">
          <button className="back-button" onClick={handleBackClick}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1>Privacy</h1>
        </div>
      </div>

      <div className="privacy-content">
        <div className="privacy-card">
          {/* Active Status Section */}
          <div className="privacy-section">

          <div className="privacy-item">
            <div className="item-info">
              <h3>Active Status</h3>
              <p>Show when you're active on this app</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={privacySettings.activeStatus}
                onChange={() => handleToggle('activeStatus')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="privacy-item">
            <div className="item-info">
              <h3>Online Status</h3>
              <p>Show online indicator to others</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={privacySettings.onlineStatus}
                onChange={() => handleToggle('onlineStatus')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="privacy-item">
            <div className="item-info">
              <h3>Typing Indicator</h3>
              <p>Show when you're typing a message</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={privacySettings.typing}
                onChange={() => handleToggle('typing')}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="divider"></div>

        {/* Read Receipts Section */}
        <div className="privacy-section">
          <div className="section-header">
            <h2>Message Privacy</h2>
            <p>Control message delivery and read information</p>
          </div>

          <div className="privacy-item">
            <div className="item-info">
              <h3>Read Receipts</h3>
              <p>Send read receipts when you view messages</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={privacySettings.readReceipts}
                onChange={() => handleToggle('readReceipts')}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="divider"></div>

        {/* Last Seen Section */}
        <div className="privacy-section">
          <div className="section-header">
            <h2>Visibility Settings</h2>
            <p>Choose who can see your information</p>
          </div>

          <div className="privacy-item">
            <div className="item-info">
              <h3>Last Seen</h3>
              <p>Who can see when you were last active</p>
            </div>
            <select 
              className="privacy-select"
              value={privacySettings.lastSeen}
              onChange={(e) => handleSelectChange('lastSeen', e.target.value)}
            >
              <option value="everyone">Everyone</option>
              <option value="contacts">My Contacts</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>

          <div className="privacy-item">
            <div className="item-info">
              <h3>Profile Photo</h3>
              <p>Who can see your profile photo</p>
            </div>
            <select 
              className="privacy-select"
              value={privacySettings.profilePhoto}
              onChange={(e) => handleSelectChange('profilePhoto', e.target.value)}
            >
              <option value="everyone">Everyone</option>
              <option value="contacts">My Contacts</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>

          <div className="privacy-item">
            <div className="item-info">
              <h3>About</h3>
              <p>Who can see your about info</p>
            </div>
            <select 
              className="privacy-select"
              value={privacySettings.about}
              onChange={(e) => handleSelectChange('about', e.target.value)}
            >
              <option value="everyone">Everyone</option>
              <option value="contacts">My Contacts</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>

          <div className="privacy-item">
            <div className="item-info">
              <h3>Status</h3>
              <p>Who can see your status updates</p>
            </div>
            <select 
              className="privacy-select"
              value={privacySettings.status}
              onChange={(e) => handleSelectChange('status', e.target.value)}
            >
              <option value="everyone">Everyone</option>
              <option value="contacts">My Contacts</option>
              <option value="selected">Selected Contacts</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>

          <div className="privacy-item">
            <div className="item-info">
              <h3>Stories</h3>
              <p>Who can see your stories</p>
            </div>
            <select 
              className="privacy-select"
              value={privacySettings.storiesPrivacy}
              onChange={(e) => handleSelectChange('storiesPrivacy', e.target.value)}
            >
              <option value="everyone">Everyone</option>
              <option value="contacts">My Contacts</option>
              <option value="selected">Selected Contacts</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>
        </div>

        <div className="divider"></div>

        {/* Groups and Calls Section */}
        <div className="privacy-section">
          <div className="section-header">
            <h2>Communication</h2>
            <p>Manage groups and calls privacy</p>
          </div>

          <div className="privacy-item">
            <div className="item-info">
              <h3>Groups</h3>
              <p>Who can add you to groups</p>
            </div>
            <select 
              className="privacy-select"
              value={privacySettings.groups}
              onChange={(e) => handleSelectChange('groups', e.target.value)}
            >
              <option value="everyone">Everyone</option>
              <option value="contacts">My Contacts</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>

          <div className="privacy-item">
            <div className="item-info">
              <h3>Calls</h3>
              <p>Who can call you</p>
            </div>
            <select 
              className="privacy-select"
              value={privacySettings.callPrivacy}
              onChange={(e) => handleSelectChange('callPrivacy', e.target.value)}
            >
              <option value="everyone">Everyone</option>
              <option value="contacts">My Contacts</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>
        </div>

        <div className="divider"></div>

        {/* Security Section */}
        <div className="privacy-section">
          <div className="section-header">
            <h2>Security</h2>
            <p>Additional security features</p>
          </div>

          <div className="privacy-item">
            <div className="item-info">
              <h3>Screen Security</h3>
              <p>Prevent screenshots and screen recording</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={privacySettings.screenSecurity}
                onChange={() => handleToggle('screenSecurity')}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="privacy-item clickable" onClick={() => navigate('/report-block')}>
            <div className="item-info">
              <h3>Blocked Contacts</h3>
              <p>Manage blocked users and reports</p>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="privacy-item clickable" onClick={() => setShowPasswordModal(true)}>
            <div className="item-info">
              <h3>Change Password</h3>
              <p>Update your login password securely</p>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          </div>
        </div>

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{
              background: '#ffffff', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '90%',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>Change Password</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {passwordMsg.text && (
                <div style={{
                  padding: '8px 12px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px',
                  background: passwordMsg.isError ? '#fee2e2' : '#dcfce7',
                  color: passwordMsg.isError ? '#dc2626' : '#15803d'
                }}>
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'transparent', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#22c55e', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Save Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Information Banner - Outside the card */}
        <div className="privacy-info-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>Changes to your privacy settings will affect how others see your information and interact with you.</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;

/* 
USAGE EXAMPLES:

1. With React Router:
   - Uncomment the useNavigate import and line in the code
   - Uncomment navigate('/settings') in handleBackClick
   
2. With callback prop:
   <Privacy onBack={() => setCurrentView('settings')} />
   
3. With browser history (default):
   <Privacy />
   - Will use window.history.back()
*/