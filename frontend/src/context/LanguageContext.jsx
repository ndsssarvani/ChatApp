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
    languageDescription: "This will set the language for the entire application. Changes will be applied immediately.",
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
    languageSpanish: "Spanish - Mexico",
    languageFrench: "French",
    languageItalian: "Italian",
    greetingEnglish: "Welcome!",
    greetingSpanish: "¡Bienvenido!",
    greetingFrench: "Bienvenue!",
    greetingItalian: "Benvenuto!",
  },
  
  es: {
    // Common
    back: "Atrás",
    save: "Guardar",
    cancel: "Cancelar",
    reset: "Restablecer",
    search: "Buscar",
    edit: "Editar",
    
    // Settings Page
    settings: "Configuración",
    setting: "Configuración",
    searchSetting: "Buscar Configuración",
    darkMode: "Modo Oscuro",
    profileLock: "Bloqueo de Perfil",
    language: "Idioma",
    notification: "Notificación",
    privacy: "Privacidad",
    blocked: "Bloqueado",
    logout: "Cerrar Sesión",
    deleteAccount: "Eliminar Cuenta",
    resetAllSettings: "¿Estás seguro de que quieres restablecer toda la configuración?",
    settingsResetSuccess: "¡Configuración restablecida exitosamente!",
    logoutConfirm: "¿Estás seguro de que quieres cerrar sesión?",
    deleteAccountConfirm: "¿Estás seguro de que quieres eliminar tu cuenta? ¡Esta acción no se puede deshacer!",
    noSettingsFound: "No se encontró configuración",
    
    // Language & Accessibility Page
    pageTitle: "Idioma y Accesibilidad",
    pageSubtitle: "Elige tu idioma preferido y personaliza tu experiencia",
    currentLanguage: "Idioma Actual",
    selectLanguage: "Seleccionar Idioma",
    languageDescription: "Esto configurará el idioma para toda la aplicación. Los cambios se aplicarán inmediatamente.",
    accessibilityTitle: "Accesibilidad",
    accessibilitySubtitle: "Personaliza tu experiencia de lectura",
    textSize: "Tamaño de Texto",
    small: "Pequeño",
    medium: "Mediano",
    large: "Grande",
    extraLarge: "Extra Grande",
    highContrast: "Modo de Alto Contraste",
    highContrastDesc: "Aumentar el contraste para mejor visibilidad",
    reduceMotion: "Reducir Movimiento",
    reduceMotionDesc: "Minimizar animaciones y transiciones",
    dyslexiaFont: "Fuente Amigable para Dislexia",
    dyslexiaFontDesc: "Usar fuente OpenDyslexic para lectura más fácil",
    saveChanges: "Guardar Cambios",
    changesSaved: "¡Cambios guardados exitosamente!",
    resetToDefault: "Restablecer Predeterminado",
    
    // Dashboard
    dashboard: "Panel de Control",
    message: "Mensaje",
    messages: "Mensajes",
    createGroup: "Crear Grupo",
    selectChat: "Seleccionar un chat",
    selectChatSubtitle: "Elige una conversación para comenzar a chatear",
    typeMessage: "Escribe un mensaje...",
    online: "En línea",
    offline: "Desconectado",
    yesterday: "Ayer",
    members: "miembros",
    
    // Profile Page
    profile: "Perfil",
    viewProfile: "Ver Perfil",
    viewAllProfile: "Ver todos los detalles de tu perfil aquí.",
    bioAndDetails: "Biografía y otros detalles",
    editProfile: "Editar Perfil",
    fullName: "Nombre Completo",
    nickname: "Apodo",
    country: "País",
    phoneNumber: "Número de Teléfono",
    place: "Lugar",
    myCityOrRegion: "Mi Ciudad o Región",
    badges: "Insignias",
    tags: "Etiquetas",
    socialMedia: "Redes Sociales",
    premiumUser: "Usuario Premium",
    
    // Group Creation
    createNewGroup: "Crear Nuevo Grupo",
    groupName: "Nombre del Grupo",
    enterGroupName: "Ingrese el nombre del grupo",
    selectMembers: "Seleccionar Miembros (mínimo 2)",
    memberSelected: "miembro seleccionado",
    membersSelected: "miembros seleccionados",
    createGroupButton: "Crear Grupo",
    groupCreated: "Grupo creado",
    
    // Chat
    videoCall: "Videollamada",
    voiceCall: "Llamada de Voz",
    menu: "Menú",
    closeProfile: "Cerrar Perfil",
    openProfile: "Abrir Perfil",
    emoji: "Emoji",
    attach: "Adjuntar",
    send: "Enviar",
    
    // User Menu
    lightMode: "Modo Claro",
    
    // Languages
    languageEnglish: "Inglés - EE.UU (Predeterminado del Sistema)",
    languageSpanish: "Español - México",
    languageFrench: "Francés",
    languageItalian: "Italiano",
    greetingEnglish: "Welcome!",
    greetingSpanish: "¡Bienvenido!",
    greetingFrench: "Bienvenue!",
    greetingItalian: "Benvenuto!",
  },
  
  fr: {
    // Common
    back: "Retour",
    save: "Enregistrer",
    cancel: "Annuler",
    reset: "Réinitialiser",
    search: "Rechercher",
    edit: "Modifier",
    
    // Settings Page
    settings: "Paramètres",
    setting: "Paramètre",
    searchSetting: "Rechercher des Paramètres",
    darkMode: "Mode Sombre",
    profileLock: "Verrouillage du Profil",
    language: "Langue",
    notification: "Notification",
    privacy: "Confidentialité",
    blocked: "Bloqué",
    logout: "Déconnexion",
    deleteAccount: "Supprimer le Compte",
    resetAllSettings: "Êtes-vous sûr de vouloir réinitialiser tous les paramètres?",
    settingsResetSuccess: "Paramètres réinitialisés avec succès!",
    logoutConfirm: "Êtes-vous sûr de vouloir vous déconnecter?",
    deleteAccountConfirm: "Êtes-vous sûr de vouloir supprimer votre compte? Cette action ne peut pas être annulée!",
    noSettingsFound: "Aucun paramètre trouvé",
    
    // Language & Accessibility Page
    pageTitle: "Langue et Accessibilité",
    pageSubtitle: "Choisissez votre langue préférée et personnalisez votre expérience",
    currentLanguage: "Langue Actuelle",
    selectLanguage: "Sélectionner la Langue",
    languageDescription: "Cela définira la langue pour toute l'application. Les changements seront appliqués immédiatement.",
    accessibilityTitle: "Accessibilité",
    accessibilitySubtitle: "Personnalisez votre expérience de lecture",
    textSize: "Taille du Texte",
    small: "Petit",
    medium: "Moyen",
    large: "Grand",
    extraLarge: "Très Grand",
    highContrast: "Mode Contraste Élevé",
    highContrastDesc: "Augmenter le contraste pour une meilleure visibilité",
    reduceMotion: "Réduire le Mouvement",
    reduceMotionDesc: "Minimiser les animations et transitions",
    dyslexiaFont: "Police Adaptée à la Dyslexie",
    dyslexiaFontDesc: "Utiliser la police OpenDyslexic pour une lecture facilitée",
    saveChanges: "Enregistrer les Modifications",
    changesSaved: "Modifications enregistrées avec succès!",
    resetToDefault: "Réinitialiser par Défaut",
    
    // Dashboard
    dashboard: "Tableau de Bord",
    message: "Message",
    messages: "Messages",
    createGroup: "Créer un Groupe",
    selectChat: "Sélectionner un chat",
    selectChatSubtitle: "Choisissez une conversation pour commencer à discuter",
    typeMessage: "Tapez un message...",
    online: "En ligne",
    offline: "Hors ligne",
    yesterday: "Hier",
    members: "membres",
    
    // Profile Page
    profile: "Profil",
    viewProfile: "Voir le Profil",
    viewAllProfile: "Voir tous les détails de votre profil ici.",
    bioAndDetails: "Biographie et autres détails",
    editProfile: "Modifier le Profil",
    fullName: "Nom Complet",
    nickname: "Surnom",
    country: "Pays",
    phoneNumber: "Numéro de Téléphone",
    place: "Lieu",
    myCityOrRegion: "Ma Ville ou Région",
    badges: "Badges",
    tags: "Étiquettes",
    socialMedia: "Médias Sociaux",
    premiumUser: "Utilisateur Premium",
    
    // Group Creation
    createNewGroup: "Créer un Nouveau Groupe",
    groupName: "Nom du Groupe",
    enterGroupName: "Entrez le nom du groupe",
    selectMembers: "Sélectionner les Membres (minimum 2)",
    memberSelected: "membre sélectionné",
    membersSelected: "membres sélectionnés",
    createGroupButton: "Créer un Groupe",
    groupCreated: "Groupe créé",
    
    // Chat
    videoCall: "Appel Vidéo",
    voiceCall: "Appel Vocal",
    menu: "Menu",
    closeProfile: "Fermer le Profil",
    openProfile: "Ouvrir le Profil",
    emoji: "Emoji",
    attach: "Joindre",
    send: "Envoyer",
    
    // User Menu
    lightMode: "Mode Clair",
    
    // Languages
    languageEnglish: "Anglais - États-Unis (Système par Défaut)",
    languageSpanish: "Espagnol - Mexique",
    languageFrench: "Français",
    languageItalian: "Italien",
    greetingEnglish: "Welcome!",
    greetingSpanish: "¡Bienvenido!",
    greetingFrench: "Bienvenue!",
    greetingItalian: "Benvenuto!",
  },
  
  it: {
    // Common
    back: "Indietro",
    save: "Salva",
    cancel: "Annulla",
    reset: "Ripristina",
    search: "Cerca",
    edit: "Modifica",
    
    // Settings Page
    settings: "Impostazioni",
    setting: "Impostazione",
    searchSetting: "Cerca Impostazioni",
    darkMode: "Modalità Scura",
    profileLock: "Blocco Profilo",
    language: "Lingua",
    notification: "Notifica",
    privacy: "Privacy",
    blocked: "Bloccato",
    logout: "Disconnetti",
    deleteAccount: "Elimina Account",
    resetAllSettings: "Sei sicuro di voler ripristinare tutte le impostazioni?",
    settingsResetSuccess: "Impostazioni ripristinate con successo!",
    logoutConfirm: "Sei sicuro di volerti disconnettere?",
    deleteAccountConfirm: "Sei sicuro di voler eliminare il tuo account? Questa azione non può essere annullata!",
    noSettingsFound: "Nessuna impostazione trovata",
    
    // Language & Accessibility Page
    pageTitle: "Lingua e Accessibilità",
    pageSubtitle: "Scegli la tua lingua preferita e personalizza la tua esperienza",
    currentLanguage: "Lingua Corrente",
    selectLanguage: "Seleziona Lingua",
    languageDescription: "Questo imposterà la lingua per tutta l'applicazione. Le modifiche saranno applicate immediatamente.",
    accessibilityTitle: "Accessibilità",
    accessibilitySubtitle: "Personalizza la tua esperienza di lettura",
    textSize: "Dimensione Testo",
    small: "Piccolo",
    medium: "Medio",
    large: "Grande",
    extraLarge: "Extra Grande",
    highContrast: "Modalità Alto Contrasto",
    highContrastDesc: "Aumentare il contrasto per una migliore visibilità",
    reduceMotion: "Riduci Movimento",
    reduceMotionDesc: "Minimizzare animazioni e transizioni",
    dyslexiaFont: "Font per Dislessia",
    dyslexiaFontDesc: "Usa il font OpenDyslexic per una lettura più facile",
    saveChanges: "Salva Modifiche",
    changesSaved: "Modifiche salvate con successo!",
    resetToDefault: "Ripristina Predefinito",
    
    // Dashboard
    dashboard: "Cruscotto",
    message: "Messaggio",
    messages: "Messaggi",
    createGroup: "Crea Gruppo",
    selectChat: "Seleziona una chat",
    selectChatSubtitle: "Scegli una conversazione per iniziare a chattare",
    typeMessage: "Scrivi un messaggio...",
    online: "Online",
    offline: "Offline",
    yesterday: "Ieri",
    members: "membri",
    
    // Profile Page
    profile: "Profilo",
    viewProfile: "Visualizza Profilo",
    viewAllProfile: "Visualizza tutti i dettagli del tuo profilo qui.",
    bioAndDetails: "Biografia e altri dettagli",
    editProfile: "Modifica Profilo",
    fullName: "Nome Completo",
    nickname: "Soprannome",
    country: "Paese",
    phoneNumber: "Numero di Telefono",
    place: "Luogo",
    myCityOrRegion: "La Mia Città o Regione",
    badges: "Badge",
    tags: "Tag",
    socialMedia: "Social Media",
    premiumUser: "Utente Premium",
    
    // Group Creation
    createNewGroup: "Crea Nuovo Gruppo",
    groupName: "Nome del Gruppo",
    enterGroupName: "Inserisci il nome del gruppo",
    selectMembers: "Seleziona Membri (minimo 2)",
    memberSelected: "membro selezionato",
    membersSelected: "membri selezionati",
    createGroupButton: "Crea Gruppo",
    groupCreated: "Gruppo creato",
    
    // Chat
    videoCall: "Videochiamata",
    voiceCall: "Chiamata Vocale",
    menu: "Menu",
    closeProfile: "Chiudi Profilo",
    openProfile: "Apri Profilo",
    emoji: "Emoji",
    attach: "Allega",
    send: "Invia",
    
    // User Menu
    lightMode: "Modalità Chiara",
    
    // Languages
    languageEnglish: "Inglese - Stati Uniti (Predefinito del Sistema)",
    languageSpanish: "Spagnolo - Messico",
    languageFrench: "Francese",
    languageItalian: "Italiano",
    greetingEnglish: "Welcome!",
    greetingSpanish: "¡Bienvenido!",
    greetingFrench: "Bienvenue!",
    greetingItalian: "Benvenuto!",
  },
};

// Language options with flags
export const languages = [
  { 
    code: "en", 
    name: "languageEnglish", 
    nativeName: "English", 
    flag: "🇺🇸",
    greeting: "greetingEnglish"
  },
  { 
    code: "es", 
    name: "languageSpanish", 
    nativeName: "Español", 
    flag: "🇲🇽",
    greeting: "greetingSpanish"
  },
  { 
    code: "fr", 
    name: "languageFrench", 
    nativeName: "Français", 
    flag: "🇫🇷",
    greeting: "greetingFrench"
  },
  { 
    code: "it", 
    name: "languageItalian", 
    nativeName: "Italiano", 
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
    if (savedLanguage && translations[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  // Change language function
  const changeLanguage = (languageCode) => {
    if (translations[languageCode]) {
      setCurrentLanguage(languageCode);
      localStorage.setItem("app-language", languageCode);
      
      // Dispatch custom event for any components that need to react to language changes
      window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language: languageCode } 
      }));
    }
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