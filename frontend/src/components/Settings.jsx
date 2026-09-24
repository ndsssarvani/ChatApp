import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";
import "./Settings.css";

const COLOR_THEMES = [
  { id: "sapphire", name: "Midnight Sapphire", primary: "#38bdf8", bgGradient: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0284c7 100%)", preview: "#0284c7" },
  { id: "amethyst", name: "Royal Amethyst", primary: "#a855f7", bgGradient: "linear-gradient(135deg, #180828 0%, #3b0764 50%, #7e22ce 100%)", preview: "#7e22ce" },
  { id: "emerald", name: "Cyber Emerald", primary: "#10b981", bgGradient: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #059669 100%)", preview: "#059669" },
  { id: "ruby", name: "Crimson Velvet", primary: "#f43f5e", bgGradient: "linear-gradient(135deg, #1c050c 0%, #4c0519 50%, #e11d48 100%)", preview: "#e11d48" },
  { id: "amber", name: "Sunset Amber", primary: "#f59e0b", bgGradient: "linear-gradient(135deg, #1c1003 0%, #78350f 50%, #d97706 100%)", preview: "#d97706" },
  { id: "light", name: "Clean Slate Light", primary: "#0284c7", bgGradient: "linear-gradient(135deg, #2563eb 0%, #4f46e5 60%, #0284c7 100%)", preview: "#38bdf8" },
];

const Settings = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { logout, user } = useAuth();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [profileLock, setProfileLock] = useState(false);
  const [activeColorTheme, setActiveColorTheme] = useState("sapphire");
  const [searchQuery, setSearchQuery] = useState("");
  const [saveToast, setSaveToast] = useState(null);

  // Load theme and color preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("chat-theme");
    const savedColorTheme = localStorage.getItem("chat-color-theme") || "sapphire";
    setActiveColorTheme(savedColorTheme);

    if (savedTheme === "dark" || user?.preferences?.theme === "dark") {
      setIsDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }

    if (user?.preferences?.profileLock) {
      setProfileLock(true);
    }
  }, [user]);

  const showToast = (msg) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  const handleSelectColorTheme = (themeId) => {
    setActiveColorTheme(themeId);
    localStorage.setItem("chat-color-theme", themeId);
    document.documentElement.setAttribute("data-color-theme", themeId);
    userService.updatePreferences({ colorTheme: themeId }).catch(() => {});
    showToast(`Color theme set to ${COLOR_THEMES.find(t => t.id === themeId)?.name}`);
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    const themeStr = newTheme ? "dark" : "light";
    localStorage.setItem("chat-theme", themeStr);
    document.documentElement.setAttribute("data-theme", themeStr);
    userService.updatePreferences({ theme: themeStr }).catch(() => {});
    showToast(`Theme switched to ${newTheme ? "Dark" : "Light"} mode`);
  };

  const handleToggleProfileLock = () => {
    const nextVal = !profileLock;
    setProfileLock(nextVal);
    userService.updatePreferences({ profileLock: nextVal }).catch(() => {});
    showToast(nextVal ? "Profile lock activated" : "Profile lock disabled");
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleReset = () => {
    if (window.confirm(t("resetAllSettings") || "Reset all settings to default values?")) {
      localStorage.removeItem("chat-theme");
      localStorage.removeItem("chat-color-theme");
      setIsDarkMode(false);
      setProfileLock(false);
      setActiveColorTheme("sapphire");
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.removeAttribute("data-color-theme");
      userService.updatePreferences({
        theme: "light",
        colorTheme: "sapphire",
        profileLock: false,
        privacyLastSeen: "everyone",
        privacyReadReceipts: true,
        privacyOnline: "everyone",
      }).catch(() => {});
      showToast("Settings reset to default");
    }
  };

  const handleLogout = async () => {
    if (window.confirm(t("logoutConfirm") || "Are you sure you want to log out?")) {
      await logout();
      navigate("/login");
    }
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        t("deleteAccountConfirm") ||
          "Are you sure you want to delete your account? This action cannot be undone and will delete all chats and data!"
      )
    ) {
      try {
        await userService.deleteAccount();
        await logout();
        navigate("/");
      } catch (err) {
        alert(err.message || "Failed to delete account");
      }
    }
  };

  const settingSections = [
    {
      section: "Experience & Appearance",
      items: [
        {
          id: "dark-mode",
          icon: isDarkMode ? "🌙" : "☀️",
          title: t("darkMode") || "Dark Mode",
          subtitle: isDarkMode ? "High contrast dark theme active" : "Clean modern light theme active",
          type: "toggle",
          value: isDarkMode,
          onChange: toggleTheme,
          accent: "#6366f1",
        },
        {
          id: "profile-lock",
          icon: "🔒",
          title: t("profileLock") || "Profile Lock",
          subtitle: "Require authentication to view detailed profile information",
          type: "toggle",
          value: profileLock,
          onChange: handleToggleProfileLock,
          accent: "#0ea5e9",
        },
        {
          id: "language",
          icon: "🌐",
          title: t("language") || "Language & Accessibility",
          subtitle: "Change app language and reading preferences",
          type: "navigation",
          onClick: () => navigate("/language"),
          accent: "#10b981",
        },
        {
          id: "personalization",
          icon: "🎨",
          title: "Chat Wallpaper & Personalization",
          subtitle: "Customize per-chat wallpapers, font sizes, and styles",
          type: "navigation",
          onClick: () => navigate("/personalization"),
          accent: "#ec4899",
        },
        {
          id: "focus-mode",
          icon: "🎯",
          title: "Focus Mode (Do Not Disturb)",
          subtitle: "Mute non-urgent notifications during work or sleep",
          type: "navigation",
          onClick: () => navigate("/focus-mode"),
          accent: "#f59e0b",
        },
      ],
    },
    {
      section: "Privacy & Security",
      items: [
        {
          id: "privacy",
          icon: "🔐",
          title: t("privacy") || "Privacy & Read Receipts",
          subtitle: "Manage blue ticks, last seen timestamp, and online visibility",
          type: "navigation",
          onClick: () => navigate("/privacy"),
          accent: "#8b5cf6",
        },
        {
          id: "notifications",
          icon: "🔔",
          title: t("notification") || "Notifications & Alerts",
          subtitle: "Manage message tones, incoming ringtones, and badges",
          type: "navigation",
          onClick: () => navigate("/notification"),
          accent: "#f43f5e",
        },
        {
          id: "blocked",
          icon: "🚫",
          title: t("blocked") || "Blocked Contacts & Reports",
          subtitle: "Review blocked user list and report issues",
          type: "navigation",
          onClick: () => navigate("/report-block"),
          accent: "#ef4444",
        },
        {
          id: "device-history",
          icon: "📱",
          title: "Active Devices & Sessions",
          subtitle: "Manage active logins and remote logout",
          type: "navigation",
          onClick: () => navigate("/device-history"),
          accent: "#3b82f6",
        },
      ],
    },
    {
      section: "Support & Information",
      items: [
        {
          id: "help",
          icon: "💬",
          title: "Help & Support Center",
          subtitle: "FAQs, contact support, and feature suggestions",
          type: "navigation",
          onClick: () => navigate("/help"),
          accent: "#059669",
        },
        {
          id: "about",
          icon: "ℹ️",
          title: "About Chatify",
          subtitle: "Version 2.4.0 • Enterprise-grade encrypted messaging",
          type: "navigation",
          onClick: () => navigate("/about"),
          accent: "#64748b",
        },
      ],
    },
    {
      section: "Account Management",
      items: [
        {
          id: "logout",
          icon: "🚪",
          title: t("logout") || "Log Out",
          subtitle: "Sign out of this browser session safely",
          type: "button",
          onClick: handleLogout,
          accent: "#f97316",
          danger: false,
        },
        {
          id: "delete-account",
          icon: "🗑️",
          title: t("deleteAccount") || "Delete Account",
          subtitle: "Permanently erase your profile, messages, and call history",
          type: "button",
          onClick: handleDeleteAccount,
          accent: "#dc2626",
          danger: true,
        },
      ],
    },
  ];

  const currentThemeObj = COLOR_THEMES.find((t) => t.id === activeColorTheme) || COLOR_THEMES[0];

  // Search filter
  const filteredSections = settingSections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((sec) => sec.items.length > 0);

  return (
    <div
      className="modern-settings-container"
      data-theme={isDarkMode ? "dark" : "light"}
      data-color-theme={activeColorTheme}
    >
      {/* Toast */}
      {saveToast && (
        <div className="settings-toast">
          <span>✓</span> {saveToast}
        </div>
      )}

      {/* Header Banner */}
      <header
        className="modern-settings-header"
        style={{ background: currentThemeObj.bgGradient }}
      >
        <div className="settings-header-inner">
          <div className="settings-nav-bar">
            {/* Prominent Back to Dashboard Button */}
            <button
              className="settings-back-btn"
              onClick={handleBackToDashboard}
              title="Return to Dashboard"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span className="back-btn-text">Back to Chat</span>
            </button>

            <div className="settings-header-title-wrap">
              <h1>{t("setting") || "Settings"}</h1>
              <p className="settings-header-sub">Manage themes, privacy, notifications & profile</p>
            </div>

            <button className="settings-reset-pill" onClick={handleReset} title="Reset to defaults">
              Reset
            </button>
          </div>

          {/* User Profile Summary Card */}
          {user && (
            <div className="settings-user-card" onClick={() => navigate("/profile")}>
              <div className="user-card-avatar-wrap">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="user-card-avatar" />
                ) : (
                  <div className="user-card-avatar-fallback">
                    {(user.name || "U")[0].toUpperCase()}
                  </div>
                )}
                <span className="user-card-online-dot"></span>
              </div>
              <div className="user-card-info">
                <div className="user-card-name-row">
                  <h3>{user.name}</h3>
                  <span className="user-card-badge">Active</span>
                </div>
                <p className="user-card-handle">{user.username ? `@${user.username}` : user.email}</p>
                <p className="user-card-bio">{user.bio || "Available"}</p>
              </div>
              <button className="user-card-edit-btn" onClick={(e) => { e.stopPropagation(); navigate("/profile"); }}>
                Edit Profile ›
              </button>
            </div>
          )}

          {/* Theme Color Palette Picker */}
          <div className="settings-theme-palette-box">
            <span className="palette-label">🎨 UI Color Theme:</span>
            <div className="palette-options">
              {COLOR_THEMES.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  className={`palette-swatch ${activeColorTheme === th.id ? "active" : ""}`}
                  style={{ background: th.preview }}
                  onClick={() => handleSelectColorTheme(th.id)}
                  title={th.name}
                >
                  {activeColorTheme === th.id && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="settings-search-bar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-svg-icon">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="settings-search-input"
              placeholder={t("searchSetting") || "Search settings, privacy, notifications..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery("")}>✕</button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Sections */}
      <main className="modern-settings-body">
        {filteredSections.length > 0 ? (
          filteredSections.map((sec) => (
            <section key={sec.section} className="settings-group-section">
              <h2 className="settings-group-title">{sec.section}</h2>
              <div className="settings-group-card">
                {sec.items.map((item) => (
                  <div
                    key={item.id}
                    className={`modern-settings-item ${item.danger ? "item-danger" : ""} ${item.type === "navigation" || item.type === "button" ? "clickable" : ""}`}
                    onClick={item.onClick ? item.onClick : undefined}
                  >
                    <div
                      className="modern-settings-icon-box"
                      style={{
                        background: `${item.accent}18`,
                        color: item.accent,
                        boxShadow: `0 2px 8px ${item.accent}20`,
                      }}
                    >
                      {item.icon}
                    </div>

                    <div className="modern-settings-text">
                      <div className="item-title-row">
                        <span className="item-main-title">{item.title}</span>
                      </div>
                      {item.subtitle && <p className="item-sub-title">{item.subtitle}</p>}
                    </div>

                    {item.type === "toggle" && (
                      <label
                        className="modern-switch"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={item.value}
                          onChange={item.onChange}
                        />
                        <span className="modern-slider"></span>
                      </label>
                    )}

                    {item.type === "navigation" && (
                      <span className="modern-nav-arrow">›</span>
                    )}

                    {item.type === "button" && (
                      <span className={`modern-btn-pill ${item.danger ? "pill-danger" : ""}`}>
                        {item.danger ? "Erase" : "Action"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="settings-empty-state">
            <div className="empty-icon-wrap">🔍</div>
            <h3>No matching settings</h3>
            <p>Try searching for words like "dark", "privacy", "notifications", or "security".</p>
            <button className="empty-reset-btn" onClick={() => setSearchQuery("")}>Clear Search</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Settings;