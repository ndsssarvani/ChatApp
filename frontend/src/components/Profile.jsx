import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";
import { getMediaUrl } from "../utils/mediaUrl";
import "./Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    avatar: user?.avatar ? getMediaUrl(user.avatar) : "",
    fullName: user?.fullName || user?.name || "",
    nickname: user?.nickname || "",
    country: user?.country || "",
    phoneNumber: user?.phoneNumber || "",
    place: user?.place || "",
    location: user?.location || "",
    bio: user?.bio || "",
  });

  // Sync with auth user
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        avatar: user.avatar ? getMediaUrl(user.avatar) : `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`,
        fullName: user.fullName || user.name || "",
        nickname: user.nickname || "",
        country: user.country || "",
        phoneNumber: user.phoneNumber || "",
        place: user.place || "",
        location: user.location || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

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
  };

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      try {
        setSaving(true);
        const res = await userService.uploadAvatar(file);
        if (res.success && res.user) {
          updateUser(res.user);
          setProfileData((prev) => ({ ...prev, avatar: getMediaUrl(res.user.avatar) }));
          setMessage("Avatar updated successfully!");
          setTimeout(() => setMessage(""), 3000);
        }
      } catch (err) {
        console.error("Avatar upload failed:", err);
        setMessage("Failed to upload avatar");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm("Are you sure you want to remove your profile photo?")) return;
    try {
      setSaving(true);
      const res = await userService.removeAvatar();
      if (res.success) {
        const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || "U"}`;
        updateUser({ ...user, avatar: "" });
        setProfileData((prev) => ({ ...prev, avatar: defaultAvatar }));
        setMessage("Profile photo removed successfully!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Failed to remove avatar:", err);
      setMessage("Failed to remove avatar");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await userService.updateProfile(profileData);
      if (res.success && res.user) {
        updateUser(res.user);
        setIsEditing(false);
        setMessage("Profile saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error("Profile save failed:", err);
      setMessage("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page-wrapper" data-theme={isDarkMode ? "dark" : "light"}>
      {/* Sidebar Navigation */}
      <div className="sidebar-nav">
        <button className="nav-icon" onClick={() => navigate("/dashboard")} title={t("dashboard")}>
          🏠
        </button>
        <button className="nav-icon" onClick={toggleTheme} title={isDarkMode ? t("lightMode") : t("darkMode")}>
          {isDarkMode ? "☀️" : "🌙"}
        </button>
        <button className="nav-icon" onClick={() => navigate("/settings")} title={t("settings")}>
          ⚙️
        </button>
        <button className="nav-icon active" title={t("profile")}>
          👤
        </button>
      </div>

      {/* Top Header */}
      <div className="top-header">
        <button className="mobile-header-back-btn" onClick={() => navigate("/dashboard")} title="Back to Chat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span className="mobile-back-text">Dashboard</span>
        </button>
        <div className="header-actions">
          <button className="header-icon" onClick={toggleTheme} title={isDarkMode ? t("lightMode") : t("darkMode")}>
            {isDarkMode ? "☀️" : "🌙"}
          </button>
          <button className="header-icon" onClick={() => navigate("/notification")} title={t("notification")}>
            🔔
          </button>
          <button className="header-icon green" onClick={() => navigate("/dashboard")} title={t("messages")}>
            💬
          </button>
          <div className="user-badge" onClick={() => navigate("/dashboard")} style={{ cursor: "pointer" }}>
            <img src={profileData.avatar} alt={profileData.name} />
            <div className="user-badge-info">
              <div className="user-badge-name">{profileData.name}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-content">
        <div className="profile-header-text">
          <h1 className="profile-title">{t("profile")}</h1>
          <p className="profile-subtitle">{t("viewAllProfile")}</p>
        </div>

        {message && (
          <div
            style={{
              padding: "10px 16px",
              background: message.includes("success") ? "#dcfce7" : "#fee2e2",
              color: message.includes("success") ? "#15803d" : "#dc2626",
              borderRadius: "10px",
              marginBottom: "16px",
              fontWeight: 500,
              fontSize: "14px",
            }}
          >
            {message}
          </div>
        )}

        <div className="profile-grid">
          {/* Profile Card */}
          <div className="profile-card">
            <div
              className="profile-avatar-large editable"
              onClick={handleAvatarClick}
              style={{ cursor: "pointer" }}
              title="Click to change profile photo"
            >
              <img src={profileData.avatar} alt={profileData.name} />
              <div className="avatar-overlay">
                <span className="camera-icon">📷</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />

            <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "12px", marginBottom: "8px" }}>
              <button
                type="button"
                onClick={handleAvatarClick}
                style={{
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#e0521c",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Change Photo
              </button>
              {user?.avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    border: "1px solid #ef4444",
                    background: "transparent",
                    color: "#ef4444",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Remove Photo
                </button>
              )}
            </div>

            <h2 className="profile-card-name">{profileData.name}</h2>
            <p style={{ color: "var(--text-tertiary)", fontSize: "13px", marginTop: "4px" }}>
              {user?.email}
            </p>
          </div>

          {/* Bio & Other Details Card */}
          <div className="bio-card">
            <div className="bio-card-header">
              <h3 className="bio-card-title">{t("bioAndDetails")}</h3>
              <div style={{ display: "flex", gap: "8px" }}>
                {isEditing ? (
                  <>
                    <button
                      className="edit-button"
                      style={{ background: "#e0521c", color: "white" }}
                      title="Save Changes"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? "⏳" : "💾"}
                    </button>
                    <button
                      className="edit-button"
                      style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                      title="Cancel"
                      onClick={() => setIsEditing(false)}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <button
                    className="edit-button"
                    title={t("editProfile")}
                    onClick={() => setIsEditing(true)}
                  >
                    ✏️
                  </button>
                )}
              </div>
            </div>

            <div className="bio-grid">
              <div className="bio-item">
                <div className="bio-label">{t("displayName")}</div>
                {isEditing ? (
                  <input
                    type="text"
                    className="bio-input"
                    value={profileData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                ) : (
                  <div className="bio-value">{profileData.name}</div>
                )}
              </div>

              <div className="bio-item">
                <div className="bio-label">{t("fullName")}</div>
                {isEditing ? (
                  <input
                    type="text"
                    className="bio-input"
                    value={profileData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                  />
                ) : (
                  <div className="bio-value">{profileData.fullName || "—"}</div>
                )}
              </div>

              <div className="bio-item">
                <div className="bio-label">{t("nickname")}</div>
                {isEditing ? (
                  <input
                    type="text"
                    className="bio-input"
                    value={profileData.nickname}
                    onChange={(e) => handleInputChange("nickname", e.target.value)}
                  />
                ) : (
                  <div className="bio-value">{profileData.nickname || "—"}</div>
                )}
              </div>

              <div className="bio-item">
                <div className="bio-label">Bio / Status</div>
                {isEditing ? (
                  <input
                    type="text"
                    className="bio-input"
                    value={profileData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                  />
                ) : (
                  <div className="bio-value">{profileData.bio || "—"}</div>
                )}
              </div>

              <div className="bio-item">
                <div className="bio-label">{t("country")}</div>
                {isEditing ? (
                  <input
                    type="text"
                    className="bio-input"
                    value={profileData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                  />
                ) : (
                  <div className="bio-value">{profileData.country || "—"}</div>
                )}
              </div>

              <div className="bio-item">
                <div className="bio-label">{t("phoneNumber")}</div>
                {isEditing ? (
                  <input
                    type="tel"
                    className="bio-input"
                    value={profileData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  />
                ) : (
                  <div className="bio-value">{profileData.phoneNumber || "—"}</div>
                )}
              </div>

              <div className="bio-item">
                <div className="bio-label">{t("place")}</div>
                {isEditing ? (
                  <input
                    type="text"
                    className="bio-input"
                    value={profileData.place}
                    onChange={(e) => handleInputChange("place", e.target.value)}
                  />
                ) : (
                  <div className="bio-value">{profileData.place || "—"}</div>
                )}
              </div>

              <div className="bio-item">
                <div className="bio-label">{t("myCityOrRegion")}</div>
                {isEditing ? (
                  <input
                    type="text"
                    className="bio-input"
                    value={profileData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                  />
                ) : (
                  <div className="bio-value">{profileData.location || "—"}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;