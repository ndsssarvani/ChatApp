import React, { createContext, useContext, useState, useEffect } from 'react';

// Comprehensive translations for the entire app
const translations = {
  en: {
    // Common
    back: "Back",
    save: "Save",
    cancel: "Cancel",
    reset: "Reset",
    search: "Search",
    edit: "Edit",
    reply: "Reply",
    copy: "Copy",
    star: "Star",
    unstar: "Unstar",
    delete: "Delete",
    
    // Message Translation
    translate: "Translate",
    translating: "Translating...",
    translatedTo: "Translated to",
    showOriginal: "Show Original",
    hideTranslation: "Hide Translation",
    translateTo: "Translate to...",
    translationFailed: "Translation failed. Please try again.",
    detectedLanguage: "Detected",
    original: "Original",
    translated: "Translated",
    
    // Settings Page
    settings: "Settings",
    setting: "Setting",
    searchSetting: "Search Setting",
    darkMode: "Dark Mode",
    profileLock: "Profile Lock",
    language: "Language",
    notification: "Notification",
    privacy: "Privacy",
    blocked: "Blocked",
    logout: "Logout",
    deleteAccount: "Delete Account",
    resetAllSettings: "Are you sure you want to reset all settings?",
    settingsResetSuccess: "Settings reset successfully!",
    logoutConfirm: "Are you sure you want to logout?",
    deleteAccountConfirm: "Are you sure you want to delete your account? This action cannot be undone!",
    noSettingsFound: "No settings found",
    
    // Language & Accessibility Page
    pageTitle: "Language & Accessibility",
    pageSubtitle: "Choose your preferred language and customize your experience",
    currentLanguage: "Current Language",
    selectLanguage: "Select Language",
    languageDescription: "This will set the language for the entire application and default message translation.",
    accessibilityTitle: "Accessibility",
    accessibilitySubtitle: "Customize your reading experience",
    textSize: "Text Size",
    small: "Small",
    medium: "Medium",
    large: "Large",
    extraLarge: "Extra Large",
    highContrast: "High Contrast Mode",
    highContrastDesc: "Increase contrast for better visibility",
    reduceMotion: "Reduce Motion",
    reduceMotionDesc: "Minimize animations and transitions",
    dyslexiaFont: "Dyslexia-Friendly Font",
    dyslexiaFontDesc: "Use OpenDyslexic font for easier reading",
    saveChanges: "Save Changes",
    changesSaved: "Changes saved successfully!",
    resetToDefault: "Reset to Default",
    
    // Dashboard
    dashboard: "Dashboard",
    message: "Message",
    messages: "Messages",
    createGroup: "Create Group",
    selectChat: "Select a chat",
    selectChatSubtitle: "Choose a conversation to start messaging",
    typeMessage: "Type a message...",
    online: "Online",
    offline: "Offline",
    yesterday: "Yesterday",
    members: "members",
    
    // Profile Page
    profile: "Profile",
    viewProfile: "View Profile",
    viewAllProfile: "View all your profile details here.",
    bioAndDetails: "Bio & other details",
    editProfile: "Edit Profile",
    fullName: "Full Name",
    nickname: "Nickname",
    country: "Country",
    phoneNumber: "Phone Number",
    place: "Place",
    myCityOrRegion: "My City or Region",
    badges: "Badges",
    tags: "Tags",
    socialMedia: "Social Media",
    premiumUser: "Premium User",
    
    // Group Creation
    createNewGroup: "Create New Group",
    groupName: "Group Name",
    enterGroupName: "Enter group name",
    selectMembers: "Select Members (minimum 2)",
    memberSelected: "member selected",
    membersSelected: "members selected",
    createGroupButton: "Create Group",
    groupCreated: "Group created",
    
    // Chat
    videoCall: "Video Call",
    voiceCall: "Voice Call",
    menu: "Menu",
    closeProfile: "Close Profile",
    openProfile: "Open Profile",
    emoji: "Emoji",
    attach: "Attach",
    send: "Send",
    
    // User Menu
    lightMode: "Light Mode",
    
    // Languages
    languageEnglish: "English - US (System Default)",
    languageTelugu: "Telugu - తెలుగు",
    languageHindi: "Hindi - हिन्दी",
    languageTamil: "Tamil - தமிழ்",
    languageKannada: "Kannada - ಕನ್ನಡ",
    languageMalayalam: "Malayalam - മലയാളം",
    languageBengali: "Bengali - বাংলা",
    languageMarathi: "Marathi - मराठी",
    languageArabic: "Arabic - العربية",
    languageSpanish: "Spanish - Español",
    languageFrench: "French - Français",
    languageGerman: "German - Deutsch",
    languageItalian: "Italian - Italiano",
    greetingEnglish: "Welcome!",
  },
  
  te: {
    // Common
    back: "వెనుకకు",
    save: "భద్రపరచు",
    cancel: "రద్దు చేయి",
    reset: "రీసెట్",
    search: "శోధించండి",
    edit: "సవరించు",
    reply: "సమాధానం",
    copy: "కాపీ చేయి",
    star: "స్టార్ చేయి",
    unstar: "స్టార్ తీసివేయి",
    delete: "తొలగించు",
    
    // Message Translation
    translate: "అనువదించు",
    translating: "అనువదిస్తోంది...",
    translatedTo: "తెలుగులోకి అనువదించబడింది",
    showOriginal: "అసలు సందేశం చూపు",
    hideTranslation: "అనువాదం దాచు",
    translateTo: "దీనిలోకి అనువదించు...",
    translationFailed: "అనువాదం విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.",
    detectedLanguage: "గుర్తించిన భాష",
    original: "అసలు సందేశం",
    translated: "అనువాదం",
    
    // Settings Page
    settings: "సెట్టింగ్‌లు",
    setting: "సెట్టింగ్",
    searchSetting: "సెట్టింగ్‌లను శోధించండి",
    darkMode: "డార్క్ మోడ్",
    profileLock: "ప్రొఫైల్ లాక్",
    language: "భాష",
    notification: "నోటిఫికేషన్లు",
    privacy: "గోప్యత",
    blocked: "నిరోధించబడినవి",
    logout: "లాగ్ అవుట్",
    deleteAccount: "ఖాతాను తొలగించండి",
    
    // Dashboard
    dashboard: "డాష్‌బోర్డ్",
    message: "సందేశం",
    messages: "సందేశాలు",
    createGroup: "గ్రూప్ సృష్టించండి",
    selectChat: "చాట్‌ను ఎంచుకోండి",
    selectChatSubtitle: "సందేశం పంపడానికి సంభాషణను ఎంచుకోండి",
    typeMessage: "సందేశాన్ని టైప్ చేయండి...",
    online: "ఆన్‌లైన్",
    offline: "ఆఫ్‌లైన్",
    
    // Chat
    videoCall: "వీడియో కాల్",
    voiceCall: "వాయిస్ కాల్",
    menu: "మెనూ",
    closeProfile: "ప్రొఫైల్ మూసివేయి",
    openProfile: "ప్రొఫైల్ తెరవండి",
    emoji: "ఎమోజి",
    attach: "జతచేయి",
    send: "పంపు",
    profile: "ప్రొఫైల్",
    lightMode: "లైట్ మోడ్",
  },

  hi: {
    // Common
    back: "वापस",
    save: "सहेजें",
    cancel: "रद्द करें",
    reset: "रीसेट",
    search: "खोजें",
    edit: "संपादित करें",
    reply: "उत्तर दें",
    copy: "कॉपी करें",
    star: "स्टार करें",
    unstar: "स्टार हटाएं",
    delete: "हटाएं",
    
    // Message Translation
    translate: "अनुवाद करें",
    translating: "अनुवाद हो रहा है...",
    translatedTo: "हिंदी में अनुवादित",
    showOriginal: "मूल संदेश देखें",
    hideTranslation: "अनुवाद छिपाएं",
    translateTo: "इसमें अनुवाद करें...",
    translationFailed: "अनुवाद विफल रहा। कृपया पुन: प्रयास करें।",
    detectedLanguage: "पहचानी गई भाषा",
    original: "मूल संदेश",
    translated: "अनुवादित",
    
    // Settings Page
    settings: "सेटिंग्स",
    setting: "सेटिंग",
    searchSetting: "सेटिंग खोजें",
    darkMode: "डार्क मोड",
    profileLock: "प्रोफाइल लॉक",
    language: "भाषा",
    notification: "सूचनाएं",
    privacy: "गोपनीयता",
    blocked: "अवरुद्ध",
    logout: "लॉग आउट",
    deleteAccount: "खाता हटाएं",
    
    // Dashboard
    dashboard: "डैशबोर्ड",
    message: "संदेश",
    messages: "संदेश",
    createGroup: "समूह बनाएं",
    selectChat: "चैट चुनें",
    selectChatSubtitle: "बातचीत शुरू करने के लिए चुनें",
    typeMessage: "संदेश लिखें...",
    online: "ऑनलाइन",
    offline: "ऑफलाइन",
    
    // Chat
    videoCall: "वीडियो कॉल",
    voiceCall: "वॉइस कॉल",
    menu: "मेनू",
    closeProfile: "प्रोफाइल बंद करें",
    openProfile: "प्रोफाइल खोलें",
    emoji: "इमोजी",
    attach: "संलग्न करें",
    send: "भेजें",
    profile: "प्रोफाइल",
    lightMode: "लाइट मोड",
  },

  es: {
    back: "Atrás",
    save: "Guardar",
    cancel: "Cancelar",
    reset: "Restablecer",
    search: "Buscar",
    edit: "Editar",
    reply: "Responder",
    copy: "Copiar",
    star: "Destacar",
    unstar: "Quitar destacado",
    delete: "Eliminar",
    
    translate: "Traducir",
    translating: "Traduciendo...",
    translatedTo: "Traducido al español",
    showOriginal: "Mostrar original",
    hideTranslation: "Ocultar traducción",
    translateTo: "Traducir a...",
    translationFailed: "La traducción falló. Inténtalo de nuevo.",
    detectedLanguage: "Idioma detectado",
    original: "Original",
    translated: "Traducido",
    
    settings: "Configuración",
    setting: "Configuración",
    darkMode: "Modo Oscuro",
    profileLock: "Bloqueo de Perfil",
    language: "Idioma",
    notification: "Notificaciones",
    privacy: "Privacidad",
    logout: "Cerrar Sesión",
    deleteAccount: "Eliminar Cuenta",
    dashboard: "Panel",
    message: "Mensaje",
    messages: "Mensajes",
    createGroup: "Crear Grupo",
    selectChat: "Seleccionar un chat",
    typeMessage: "Escribe un mensaje...",
    online: "En línea",
    offline: "Desconectado",
    videoCall: "Videollamada",
    voiceCall: "Llamada de voz",
    send: "Enviar",
    profile: "Perfil",
    lightMode: "Modo Claro",
  },
  
  fr: {
    back: "Retour",
    save: "Enregistrer",
    cancel: "Annuler",
    reset: "Réinitialiser",
    search: "Rechercher",
    edit: "Modifier",
    reply: "Répondre",
    copy: "Copier",
    star: "Favori",
    unstar: "Retirer des favoris",
    delete: "Supprimer",
    
    translate: "Traduire",
    translating: "Traduction en cours...",
    translatedTo: "Traduit en français",
    showOriginal: "Afficher l'original",
    hideTranslation: "Masquer la traduction",
    translateTo: "Traduire en...",
    translationFailed: "Échec de la traduction. Veuillez réessayer.",
    detectedLanguage: "Langue détectée",
    original: "Original",
    translated: "Traduit",
    
    settings: "Paramètres",
    setting: "Paramètre",
    darkMode: "Mode Sombre",
    language: "Langue",
    notification: "Notifications",
    privacy: "Confidentialité",
    logout: "Se Déconnecter",
    deleteAccount: "Supprimer le Compte",
    dashboard: "Tableau de bord",
    message: "Message",
    messages: "Messages",
    createGroup: "Créer un Groupe",
    selectChat: "Sélectionner une discussion",
    typeMessage: "Tapez un message...",
    online: "En ligne",
    offline: "Hors ligne",
    videoCall: "Appel Vidéo",
    voiceCall: "Appel Vocal",
    send: "Envoyer",
    profile: "Profil",
    lightMode: "Mode Clair",
  },
  
  it: {
    back: "Indietro",
    save: "Salva",
    cancel: "Annulla",
    reset: "Reimposta",
    search: "Cerca",
    edit: "Modifica",
    reply: "Rispondi",
    copy: "Copia",
    star: "Aggiungi ai preferiti",
    unstar: "Rimuovi dai preferiti",
    delete: "Elimina",
    
    translate: "Traduci",
    translating: "Traduzione in corso...",
    translatedTo: "Tradotto in italiano",
    showOriginal: "Mostra originale",
    hideTranslation: "Nascondi traduzione",
    translateTo: "Traduci in...",
    translationFailed: "Traduzione non riuscita. Riprova.",
    detectedLanguage: "Lingua rilevata",
    original: "Originale",
    translated: "Tradotto",
    
    settings: "Impostazioni",
    setting: "Impostazione",
    darkMode: "Modalità Scura",
    language: "Lingua",
    notification: "Notifiche",
    privacy: "Privacy",
    logout: "Disconnetti",
    deleteAccount: "Elimina Account",
    dashboard: "Dashboard",
    message: "Messaggio",
    messages: "Messaggi",
    createGroup: "Crea Gruppo",
    selectChat: "Seleziona una chat",
    typeMessage: "Scrivi un messaggio...",
    online: "Online",
    offline: "Offline",
    videoCall: "Videochiamata",
    voiceCall: "Chiamata Vocale",
    send: "Invia",
    profile: "Profilo",
    lightMode: "Modalità Chiara",
  },
};

// Unified Language options with codes, flags, and native names
export const languages = [
  { 
    code: "en", 
    name: "languageEnglish", 
    nativeName: "English", 
    flag: "🇺🇸",
    greeting: "greetingEnglish"
  },
  { 
    code: "te", 
    name: "languageTelugu", 
    nativeName: "తెలుగు (Telugu)", 
    flag: "🇮🇳",
    greeting: "greetingTelugu"
  },
  { 
    code: "hi", 
    name: "languageHindi", 
    nativeName: "हिन्दी (Hindi)", 
    flag: "🇮🇳",
    greeting: "greetingHindi"
  },
  { 
    code: "ta", 
    name: "languageTamil", 
    nativeName: "தமிழ் (Tamil)", 
    flag: "🇮🇳",
    greeting: "greetingTamil"
  },
  { 
    code: "kn", 
    name: "languageKannada", 
    nativeName: "ಕನ್ನಡ (Kannada)", 
    flag: "🇮🇳",
    greeting: "greetingKannada"
  },
  { 
    code: "ml", 
    name: "languageMalayalam", 
    nativeName: "മലയാളം (Malayalam)", 
    flag: "🇮🇳",
    greeting: "greetingMalayalam"
  },
  { 
    code: "bn", 
    name: "languageBengali", 
    nativeName: "বাংলা (Bengali)", 
    flag: "🇮🇳",
    greeting: "greetingBengali"
  },
  { 
    code: "mr", 
    name: "languageMarathi", 
    nativeName: "मराठी (Marathi)", 
    flag: "🇮🇳",
    greeting: "greetingMarathi"
  },
  { 
    code: "ar", 
    name: "languageArabic", 
    nativeName: "العربية (Arabic)", 
    flag: "🇸🇦",
    greeting: "greetingArabic"
  },
  { 
    code: "es", 
    name: "languageSpanish", 
    nativeName: "Español (Spanish)", 
    flag: "🇲🇽",
    greeting: "greetingSpanish"
  },
  { 
    code: "fr", 
    name: "languageFrench", 
    nativeName: "Français (French)", 
    flag: "🇫🇷",
    greeting: "greetingFrench"
  },
  { 
    code: "de", 
    name: "languageGerman", 
    nativeName: "Deutsch (German)", 
    flag: "🇩🇪",
    greeting: "greetingGerman"
  },
  { 
    code: "it", 
    name: "languageItalian", 
    nativeName: "Italiano (Italian)", 
    flag: "🇮🇹",
    greeting: "greetingItalian"
  },
];

// Create Language Context
const LanguageContext = createContext();

// Language Provider Component
export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState("en");

  // Load saved language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("app-language");
    if (savedLanguage && (translations[savedLanguage] || languages.some(l => l.code === savedLanguage))) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  // Change language function
  const changeLanguage = (languageCode) => {
    setCurrentLanguage(languageCode);
    localStorage.setItem("app-language", languageCode);
    
    // Dispatch custom event for any components that need to react to language changes
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: languageCode } 
    }));
  };

  // Translation function
  const t = (key) => {
    return translations[currentLanguage]?.[key] || translations.en[key] || key;
  };

  // Get current language data
  const getCurrentLanguageData = () => {
    return languages.find(l => l.code === currentLanguage) || languages[0];
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    getCurrentLanguageData,
    languages,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export default LanguageContext;