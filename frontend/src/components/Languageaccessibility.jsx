import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import "./Languageaccessibility.css";

const Languageaccessibility = () => {
  const navigate = useNavigate();

  // ✅ CONTEXT (single source of truth)
  const {
    t,
    currentLanguage,
    changeLanguage,
    languages
  } = useLanguage();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [textSize, setTextSize] = useState("medium");
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [birdAnimation, setBirdAnimation] = useState("idle");

  // Load saved preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem("chat-theme");
    const savedTextSize = localStorage.getItem("text-size");
    const savedHighContrast = localStorage.getItem("high-contrast");
    const savedReduceMotion = localStorage.getItem("reduce-motion");
    const savedDyslexiaFont = localStorage.getItem("dyslexia-font");

    if (savedTheme === "dark") setIsDarkMode(true);
    if (savedTextSize) setTextSize(savedTextSize);
    if (savedHighContrast === "true") setHighContrast(true);
    if (savedReduceMotion === "true") setReduceMotion(true);
    if (savedDyslexiaFont === "true") setDyslexiaFont(true);
  }, []);

  // Bird animation on language change
  useEffect(() => {
    if (selectedLanguage !== currentLanguage) {
      setBirdAnimation("excited");
      setTimeout(() => setBirdAnimation("idle"), 1000);
    }
  }, [selectedLanguage, currentLanguage]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("chat-theme", newTheme ? "dark" : "light");
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleSaveChanges = () => {
    // ✅ ONLY THIS updates language
    changeLanguage(selectedLanguage);

    localStorage.setItem("text-size", textSize);
    localStorage.setItem("high-contrast", highContrast.toString());
    localStorage.setItem("reduce-motion", reduceMotion.toString());
    localStorage.setItem("dyslexia-font", dyslexiaFont.toString());

    setShowSaveNotification(true);
    setBirdAnimation("celebrate");

    setTimeout(() => {
      setShowSaveNotification(false);
      setBirdAnimation("idle");
    }, 3000);
  };

  const handleReset = () => {
    setSelectedLanguage("en");
    setTextSize("medium");
    setHighContrast(false);
    setReduceMotion(false);
    setDyslexiaFont(false);
  };

  const hasChanges =
    selectedLanguage !== currentLanguage ||
    textSize !== (localStorage.getItem("text-size") || "medium") ||
    highContrast !== (localStorage.getItem("high-contrast") === "true") ||
    reduceMotion !== (localStorage.getItem("reduce-motion") === "true") ||
    dyslexiaFont !== (localStorage.getItem("dyslexia-font") === "true");

  const currentLangData =
    languages.find((l) => l.code === selectedLanguage) || languages[0];

  // Get bird color based on selected language
  const getBirdColor = () => {
    switch (selectedLanguage) {
      case "es":
        return { gradient: "linear-gradient(135deg, #ff6b6b 0%, #fa5252 100%)", solid: "#fa5252" };
      case "fr":
        return { gradient: "linear-gradient(135deg, #748ffc 0%, #5c7cfa 100%)", solid: "#5c7cfa" };
      case "it":
        return { gradient: "linear-gradient(135deg, #51cf66 0%, #40c057 100%)", solid: "#40c057" };
      default:
        return { gradient: "linear-gradient(135deg, #ffd43b 0%, #fab005 100%)", solid: "#fab005" };
    }
  };

  return (
    <div
      className="language-page-wrapper"
      data-theme={isDarkMode ? "dark" : "light"}
      data-high-contrast={highContrast}
      data-bird-animation={birdAnimation}
      data-selected-language={selectedLanguage}
      data-reduce-motion={reduceMotion}
      style={{
        fontSize:
          textSize === "small"
            ? "14px"
            : textSize === "large"
            ? "18px"
            : textSize === "extra-large"
            ? "20px"
            : "16px",
        fontFamily: dyslexiaFont
          ? "OpenDyslexic, monospace"
          : "inherit",
      }}
    >
      {/* Sidebar */}
      <div className="sidebar-nav">
        <button className="nav-icon" onClick={handleBack}>🏠</button>
        <button className="nav-icon" onClick={toggleTheme}>
          {isDarkMode ? "☀️" : "🌙"}
        </button>
        <button className="nav-icon active">🌐</button>
        <button className="nav-icon" onClick={() => navigate("/settings")}>
          ⚙️
        </button>
      </div>

      {/* Main Content */}
      <div className="language-content">
        <div className="page-header">
          <div className="page-header-row">
            <button className="lang-back-btn" onClick={handleBack} title="Back to Dashboard">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span>Back</span>
            </button>
            <h1 className="page-title">{t("pageTitle")}</h1>
          </div>
          <p className="page-subtitle">{t("pageSubtitle")}</p>
        </div>

        {/* Language Selection */}
        <div className="language-section">
          <h2 className="section-title">{t("selectLanguage")}</h2>
          <p className="section-description">{t("languageDescription")}</p>

          <div className="current-language-badge">
            {currentLangData.flag}
            {t("currentLanguage")}: {currentLangData.nativeName}
          </div>

          <div className="language-options-grid">
            {languages.map((lang) => (
              <div
                key={lang.code}
                className={`language-option ${
                  selectedLanguage === lang.code ? "selected" : ""
                }`}
                onClick={() => setSelectedLanguage(lang.code)}
              >
                <div className="language-flag">{lang.flag}</div>
                <div className="language-info">
                  <div className="language-name">{t(lang.name)}</div>
                  <div className="language-native">{lang.nativeName}</div>
                </div>
                <div className="language-radio">
                  {selectedLanguage === lang.code && (
                    <div className="radio-dot"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accessibility */}
        <div className="accessibility-section">
          <h2 className="section-title">{t("accessibilityTitle")}</h2>
          <p className="section-description">
            {t("accessibilitySubtitle")}
          </p>

          <div className="action-buttons">
            <button className="btn btn-reset" onClick={handleReset}>
              {t("resetToDefault")}
            </button>
            <button className="btn btn-secondary" onClick={handleBack}>
              {t("cancel")}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveChanges}
              disabled={!hasChanges}
            >
              {t("saveChanges")}
            </button>
          </div>
        </div>
      </div>

      {showSaveNotification && (
        <div className="save-notification">
          ✅ {t("changesSaved")}
        </div>
      )}
    </div>
  );
};
export default Languageaccessibility;