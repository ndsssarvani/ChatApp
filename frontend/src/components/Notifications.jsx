import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import notificationService from "../services/notificationService";
import userService from "../services/userService";
import "./Notifications.css";

const Notifications = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("inbox"); // 'inbox' or 'preferences'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [notificationSettings, setNotificationSettings] = useState({
    messageNotifications: { push: true, text: false, sound: true },
    groupChats: { push: true, text: true, sound: false },
    calls: { push: true, text: false, sound: true },
    mentions: { push: true, text: true, sound: true },
  });

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("chat-theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
    }
  }, []);

  // Fetch real notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        showToastAlert("All notifications marked as read");
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const showToastAlert = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleToggle = (category, type) => {
    setNotificationSettings((prev) => {
      const updated = {
        ...prev,
        [category]: {
          ...prev[category],
          [type]: !prev[category][type],
        },
      };
      userService.updatePreferences({ notificationSettings: updated }).catch(() => {});
      return updated;
    });

    showToastAlert("Preferences saved");
  };

  return (
    <div className="notification-container" data-theme={isDarkMode ? "dark" : "light"}>
      <div className="notification-header">
        <div className="header-top">
          <button className="back-button" onClick={handleBack} title="Back">
            ←
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
            {activeTab === "inbox" && unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#22c55e",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        <h1 className="notification-title">Notifications</h1>

        {/* Tab switch */}
        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          <button
            onClick={() => setActiveTab("inbox")}
            style={{
              flex: 1,
              padding: "8px 16px",
              borderRadius: "10px",
              border: "none",
              background: activeTab === "inbox" ? "#22c55e" : "var(--bg-tertiary)",
              color: activeTab === "inbox" ? "#ffffff" : "var(--text-secondary)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Inbox {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            style={{
              flex: 1,
              padding: "8px 16px",
              borderRadius: "10px",
              border: "none",
              background: activeTab === "preferences" ? "#22c55e" : "var(--bg-tertiary)",
              color: activeTab === "preferences" ? "#ffffff" : "var(--text-secondary)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Preferences
          </button>
        </div>
      </div>

      <div className="notification-content" style={{ padding: "20px 0" }}>
        {activeTab === "inbox" ? (
          <div>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)" }}>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-tertiary)" }}>
                <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🔔</div>
                <div style={{ fontWeight: 600, fontSize: "16px", color: "var(--text-primary)" }}>
                  No notifications yet
                </div>
                <div style={{ fontSize: "13px", marginTop: "4px" }}>
                  You're all caught up!
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => {
                      if (!notif.isRead) handleMarkAsRead(notif._id);
                      navigate("/dashboard");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "14px 16px",
                      background: notif.isRead ? "var(--bg-primary)" : "var(--bg-tertiary)",
                      borderRadius: "12px",
                      border: "1px solid var(--border-color)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <img
                      src={
                        notif.sender?.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${notif.sender?.name || "System"}`
                      }
                      alt={notif.sender?.name}
                      style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: notif.isRead ? 500 : 700, color: "var(--text-primary)" }}>
                        {notif.message}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {!notif.isRead && (
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e" }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="notification-group">
              <h3 className="group-title">Message Notifications</h3>
              <p className="group-description">Notifications for direct one-on-one messages</p>
              <div className="toggle-items">
                <div className="toggle-item">
                  <span className="toggle-label">Push notifications</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={notificationSettings.messageNotifications.push}
                      onChange={() => handleToggle("messageNotifications", "push")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-item">
                  <span className="toggle-label">Sound alerts</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={notificationSettings.messageNotifications.sound}
                      onChange={() => handleToggle("messageNotifications", "sound")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="notification-group">
              <h3 className="group-title">Group Messages</h3>
              <p className="group-description">Notifications for group chats and team rooms</p>
              <div className="toggle-items">
                <div className="toggle-item">
                  <span className="toggle-label">Push notifications</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={notificationSettings.groupChats.push}
                      onChange={() => handleToggle("groupChats", "push")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-item">
                  <span className="toggle-label">Sound alerts</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={notificationSettings.groupChats.sound}
                      onChange={() => handleToggle("groupChats", "sound")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showToast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#22c55e",
            color: "#ffffff",
            padding: "8px 20px",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Notifications;