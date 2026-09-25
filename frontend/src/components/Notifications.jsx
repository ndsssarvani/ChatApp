import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useCall } from '../context/CallContext';
import notificationService from '../services/notificationService';
import userService from '../services/userService';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { startCall } = useCall();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'messages' | 'calls' | 'system'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [callsUnreadCount, setCallsUnreadCount] = useState(0);
  const [messagesUnreadCount, setMessagesUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('chat-theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  // Fetch real notifications
  const fetchNotifications = async (category = activeCategory) => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications(category);
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
        setCallsUnreadCount(res.callsUnreadCount || 0);
        setMessagesUnreadCount(res.messagesUnreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(activeCategory);
  }, [activeCategory]);

  // Real-time notification arrival via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      if (newNotif.type === 'call' || newNotif.type === 'missed_call') {
        setCallsUnreadCount((prev) => prev + 1);
      } else {
        setMessagesUnreadCount((prev) => prev + 1);
      }
      showToastAlert(`New notification: ${newNotif.message}`);
    };

    socket.on('notification_received', handleNewNotification);
    return () => {
      socket.off('notification_received', handleNewNotification);
    };
  }, [socket]);

  const showToastAlert = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        setCallsUnreadCount(0);
        setMessagesUnreadCount(0);
        showToastAlert('All notifications marked as read');
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      showToastAlert('Notification deleted');
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      // Instantly clear all notification lists and badge counters
      setNotifications([]);
      setUnreadCount(0);
      setCallsUnreadCount(0);
      setMessagesUnreadCount(0);
      showToastAlert('All notifications cleared');

      // Broadcast global event so ChatDashboard and other pages clear badge instantly
      window.dispatchEvent(new CustomEvent('notifications_cleared'));

      // Persistently delete all notifications from backend MongoDB
      await notificationService.clearAllNotifications();
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'missed_call':
        return '📞';
      case 'call':
        return '📞';
      case 'group_invite':
        return '👥';
      case 'reaction':
        return '❤️';
      case 'system':
        return '⚙️';
      case 'message':
      default:
        return '💬';
    }
  };

  return (
    <div className="notification-container" data-theme={isDarkMode ? 'dark' : 'light'}>
      {/* Header */}
      <div className="notification-header">
        <div className="header-top">
          <button className="back-button" onClick={() => navigate('/dashboard')} title="Back to Dashboard">
            ←
          </button>
          <div className="header-action-group">
            {unreadCount > 0 && (
              <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
                ✓ Mark all read
              </button>
            )}
            {(notifications.length > 0 || unreadCount > 0) && (
              <button className="clear-all-notifs-btn" onClick={handleClearAll}>
                🗑️ Clear All
              </button>
            )}
          </div>
        </div>

        <div className="title-row">
          <h1 className="notification-title">Notifications</h1>
          {unreadCount > 0 && <span className="notif-total-badge">{unreadCount} new</span>}
        </div>

        {/* Category Tabs: All, Messages, Calls, System */}
        <div className="notification-category-tabs">
          <button
            type="button"
            className={`notif-tab ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All {unreadCount > 0 && <span className="tab-pill">{unreadCount}</span>}
          </button>
          <button
            type="button"
            className={`notif-tab ${activeCategory === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveCategory('messages')}
          >
            💬 Messages {messagesUnreadCount > 0 && <span className="tab-pill">{messagesUnreadCount}</span>}
          </button>
          <button
            type="button"
            className={`notif-tab ${activeCategory === 'calls' ? 'active' : ''}`}
            onClick={() => setActiveCategory('calls')}
          >
            📞 Calls {callsUnreadCount > 0 && <span className="tab-pill danger">{callsUnreadCount}</span>}
          </button>
          <button
            type="button"
            className={`notif-tab ${activeCategory === 'system' ? 'active' : ''}`}
            onClick={() => setActiveCategory('system')}
          >
            ⚙️ System
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="notification-content">
        {loading ? (
          <div className="notif-skeleton-container">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="notif-skeleton-item">
                <div className="skeleton-avatar"></div>
                <div className="skeleton-text-group">
                  <div className="skeleton-line long"></div>
                  <div className="skeleton-line short"></div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty-state">
            <div className="empty-bell-icon">🔔</div>
            <h3>No notifications found</h3>
            <p>
              {activeCategory === 'calls'
                ? 'You have no call notifications or missed calls.'
                : activeCategory === 'messages'
                ? 'No new message alerts.'
                : "You're completely up to date with your conversations and calls!"}
            </p>
          </div>
        ) : (
          <div className="notifications-list-wrapper">
            {notifications.map((notif) => {
              const isCallNotif = notif.type === 'call' || notif.type === 'missed_call';

              return (
                <div
                  key={notif._id}
                  className={`notif-card ${!notif.isRead ? 'unread' : ''} ${isCallNotif ? 'call-card' : ''}`}
                  onClick={() => {
                    if (!notif.isRead) handleMarkAsRead({ stopPropagation: () => {} }, notif._id);
                    navigate('/dashboard');
                  }}
                >
                  <div className="notif-avatar-wrapper">
                    <img
                      src={
                        notif.sender?.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${notif.sender?.name || 'System'}`
                      }
                      alt={notif.sender?.name}
                      className="notif-user-avatar"
                    />
                    <div className="notif-type-bubble">{getNotifIcon(notif.type)}</div>
                  </div>

                  <div className="notif-details">
                    <div className="notif-top-line">
                      <span className="notif-sender-name">
                        {notif.sender?.name || 'System Notification'}
                      </span>
                      <span className="notif-timestamp">
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        • {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <p className="notif-message-body">{notif.message}</p>

                    {/* Quick Call Actions for Call Notifications */}
                    {isCallNotif && notif.sender && (
                      <div className="notif-call-actions">
                        <button
                          type="button"
                          className="notif-action-btn audio-call"
                          onClick={(e) => {
                            e.stopPropagation();
                            startCall(notif.sender, 'audio');
                          }}
                        >
                          📞 Call Back
                        </button>
                        <button
                          type="button"
                          className="notif-action-btn video-call"
                          onClick={(e) => {
                            e.stopPropagation();
                            startCall(notif.sender, 'video');
                          }}
                        >
                          📹 Video Call
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="notif-side-controls">
                    {!notif.isRead && (
                      <button
                        type="button"
                        className="notif-mark-read-icon"
                        onClick={(e) => handleMarkAsRead(e, notif._id)}
                        title="Mark as Read"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      type="button"
                      className="notif-delete-icon"
                      onClick={(e) => handleDeleteNotification(e, notif._id)}
                      title="Delete Notification"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast Alert */}
      {showToast && (
        <div className="global-toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default Notifications;