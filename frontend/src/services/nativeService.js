import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { PushNotifications } from '@capacitor/push-notifications';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios', 'android', or 'web'

/**
 * Initialize all native Capacitor device behaviors on app mount.
 * Safe to call on Web; gracefully no-ops on browsers.
 */
export const initNativeApp = ({ navigate, onThemeChange }) => {
  if (!isNative) return () => {};

  // 1. Hide Splash Screen after React renders
  try {
    SplashScreen.hide().catch(() => {});
  } catch (e) {}

  // 2. Configure Status Bar
  try {
    const isDark = localStorage.getItem('chat-theme') === 'dark';
    StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
    if (platform === 'android') {
      StatusBar.setBackgroundColor({ color: isDark ? '#090d16' : '#efece4' }).catch(() => {});
    }
  } catch (e) {}

  // 3. Android Hardware Back Button
  const backListener = App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack && navigate) {
      navigate(-1);
    } else {
      App.exitApp();
    }
  });

  // 4. Handle Deep Links (chatify://... or universal https links)
  const urlListener = App.addListener('appUrlOpen', (data) => {
    try {
      const url = new URL(data.url);
      const pathname = url.pathname || '';
      const host = url.host || '';

      if (url.protocol === 'chatify:' || url.hostname.includes('chatify')) {
        if (host === 'invite' || pathname.startsWith('/invite/')) {
          const code = pathname.replace('/invite/', '') || url.searchParams.get('code');
          if (code && navigate) navigate(`/invite/${code}`);
        } else if (host === 'chat' || pathname.startsWith('/dashboard')) {
          if (navigate) navigate('/dashboard');
        }
      }
    } catch (err) {
      console.warn('[Native Deep Link] Parse error:', err);
    }
  });

  // 5. Handle Network Status Changes (Auto reconnect Socket)
  const networkListener = Network.addListener('networkStatusChange', (status) => {
    window.dispatchEvent(new CustomEvent('native_network_changed', { detail: status }));
  });

  // 6. Handle Native Keyboard Show/Hide
  const keyboardShowListener = Keyboard.addListener('keyboardWillShow', (info) => {
    document.body.classList.add('keyboard-open');
    document.documentElement.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
  });

  const keyboardHideListener = Keyboard.addListener('keyboardWillHide', () => {
    document.body.classList.remove('keyboard-open');
    document.documentElement.style.setProperty('--keyboard-height', '0px');
  });

  return () => {
    backListener.then((l) => l.remove()).catch(() => {});
    urlListener.then((l) => l.remove()).catch(() => {});
    networkListener.then((l) => l.remove()).catch(() => {});
    keyboardShowListener.then((l) => l.remove()).catch(() => {});
    keyboardHideListener.then((l) => l.remove()).catch(() => {});
  };
};

/**
 * Update Status Bar dynamically when theme changes
 */
export const updateNativeStatusBar = (theme) => {
  if (!isNative) return;
  try {
    const isDark = theme === 'dark';
    StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
    if (platform === 'android') {
      StatusBar.setBackgroundColor({ color: isDark ? '#090d16' : '#efece4' }).catch(() => {});
    }
  } catch (e) {}
};

/**
 * Trigger physical haptic feedback on touch devices
 */
export const triggerHaptic = async (type = 'light') => {
  if (!isNative) return;
  try {
    if (type === 'light') {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (type === 'medium') {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if (type === 'heavy') {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (type === 'success') {
      await Haptics.notification({ type: NotificationType.Success });
    } else if (type === 'warning') {
      await Haptics.notification({ type: NotificationType.Warning });
    } else if (type === 'error') {
      await Haptics.notification({ type: NotificationType.Error });
    }
  } catch (e) {}
};

/**
 * Set up real Push Notifications via FCM / APNS
 */
export const registerPushNotifications = async (onTokenReceived, onNotificationTapped) => {
  if (!isNative) return;

  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('[Push] Permission not granted for push notifications.');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', (token) => {
      if (onTokenReceived) onTokenReceived(token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('[Push] Registration error:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      window.dispatchEvent(new CustomEvent('native_notification_received', { detail: notification }));
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notificationAction) => {
      const data = notificationAction.notification.data;
      if (onNotificationTapped) onNotificationTapped(data);
    });
  } catch (err) {
    console.warn('[Push] Push notification setup error:', err);
  }
};

/**
 * Secure mobile preferences storage (paired with localStorage)
 */
export const setNativePreference = async (key, value) => {
  try {
    if (isNative) {
      await Preferences.set({ key, value: typeof value === 'string' ? value : JSON.stringify(value) });
    }
  } catch (e) {}
  localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
};

export const getNativePreference = async (key) => {
  try {
    if (isNative) {
      const res = await Preferences.get({ key });
      if (res.value) return res.value;
    }
  } catch (e) {}
  return localStorage.getItem(key);
};

export const removeNativePreference = async (key) => {
  try {
    if (isNative) {
      await Preferences.remove({ key });
    }
  } catch (e) {}
  localStorage.removeItem(key);
};

export default {
  isNative,
  platform,
  initNativeApp,
  updateNativeStatusBar,
  triggerHaptic,
  registerPushNotifications,
  setNativePreference,
  getNativePreference,
  removeNativePreference,
};
