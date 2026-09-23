import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";
import "./Settings.css";

const Settings = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { logout, user } = useAuth();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [profileLock, setProfileLock] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("chat-theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("chat-theme", newTheme ? "dark" : "light");
    userService.updatePreferences({ theme: newTheme ? "dark" : "light" }).catch(() => {});
  };

  const handleToggleProfileLock = () => {
    const nextVal = !profileLock;
    setProfileLock(nextVal);
    userService.updatePreferences({ profileLock: nextVal }).catch(() => {});
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleReset = () => {
    if (window.confirm(t("resetAllSettings") || "Reset settings to default?")) {
      localStorage.removeItem("chat-theme");
      setIsDarkMode(false);
      setProfileLock(false);
      alert(t("settingsResetSuccess") || "Settings reset successfully!");
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
          "Are you sure you want to delete your account? This action cannot be undone!"
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

  const settingsOptions = [
    {
      id: 1,
      icon: "🌙",
      title: t("darkMode") || "Dark Mode",
      type: "toggle",
      value: isDarkMode,
      onChange: toggleTheme,
      color: "#6c757d",
    },
    {
      id: 2,
      icon: "🔒",
      title: t("profileLock") || "Profile Lock",
      type: "toggle",
      value: profileLock,
      onChange: handleToggleProfileLock,
      color: "#9ffadf",
    },
    {
      id: 3,
      icon: "💬",
      title: t("language") || "Language & Accessibility",
      type: "navigation",
      onClick: () => navigate("/language"),
      color: "#c2f4b8",
    },
    {
      id: 4,
      icon: "🔔",
      title: t("notification") || "Notifications",
      type: "navigation",
      onClick: () => navigate("/notification"),
      color: "#ff6b6b",
    },
    {
      id: 5,
      icon: "🔐",
      title: t("privacy") || "Privacy & Security",
      type: "navigation",
      onClick: () => navigate("/privacy"),
      color: "#845ef7",
    },
    {
      id: 6,
      icon: "🚫",
      title: t("blocked") || "Blocked & Report Users",
      type: "navigation",
      onClick: () => navigate("/report-block"),
      color: "#ef4444",
    },
    {
      id: 7,
      icon: "📱",
      title: "Device Login History",
      type: "navigation",
      onClick: () => navigate("/device-history"),
      color: "#3b82f6",
    },
    {
      id: 8,
      icon: "🎯",
      title: "Focus Mode (Do Not Disturb)",
      type: "navigation",
      onClick: () => navigate("/focus-mode"),
      color: "#f59e0b",
    },
    {
      id: 9,
      icon: "🎨",
      title: "Chat Personalization & Themes",
      type: "navigation",
      onClick: () => navigate("/personalization"),
      color: "#ec4899",
    },
    {
      id: 10,
      icon: "❓",
      title: "Help & Support",
      type: "navigation",
      onClick: () => navigate("/help"),
      color: "#10b981",
    },
    {
      id: 11,
      icon: "ℹ️",
      title: "About App",
      type: "navigation",
      onClick: () => navigate("/about"),
      color: "#6366f1",
    },
    {
      id: 12,
      icon: "🚪",
      title: t("logout") || "Logout",
      type: "button",
      onClick: handleLogout,
      color: "#ffa94d",
    },
    {
      id: 13,
      icon: "🗑️",
      title: t("deleteAccount") || "Delete Account",
      type: "button",
      onClick: handleDeleteAccount,
      color: "#ff6b6b",
    },
  ];

  const filteredSettings = settingsOptions.filter((option) =>
    option.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="settings-container" data-theme={isDarkMode ? "dark" : "light"}>
      <div className="settings-header">
        <div className="header-top">
          <button className="back-button" onClick={handleBack} title={t("back")}>
            ←
          </button>
          <button className="reset-button" onClick={handleReset}>
            {t("reset")}
          </button>
        </div>

        <h1 className="settings-title">{t("setting") || "Settings"}</h1>

        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder={t("searchSetting") || "Search settings..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="settings-content">
        <div className="settings-card">
          {filteredSettings.length > 0 ? (
            filteredSettings.map((option) => (
              <div
                key={option.id}
                className="settings-item"
                onClick={option.onClick || (() => {})}
              >
                <div
                  className="settings-icon"
                  style={{
                    background: `${option.color}20`,
                    color: option.color,
                  }}
                >
                  {option.icon}
                </div>

                <div className="settings-text">
                  <div className="settings-item-title">{option.title}</div>
                </div>

                {option.type === "toggle" && (
                  <label
                    className="toggle-switch"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={option.value}
                      onChange={option.onChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                )}

                {option.type === "navigation" && (
                  <span className="settings-arrow">›</span>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-text">{t("noSettingsFound") || "No settings found"}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;