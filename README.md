# Chatify — Full-Stack Web & Native Mobile App (Android & iOS)

Chatify is a production-grade, real-time messaging and audio/video calling application built with the **MERN** stack (MongoDB, Express.js, React 19, Node.js) and **Socket.IO**. Using **Capacitor**, the existing React frontend is compiled and packaged into installable native applications for **Android** and **iOS** while maintaining full web browser compatibility.

---

## 📱 Platforms Supported

| Platform | Runtime | Distribution Format |
|---|---|---|
| **Web** | Vite / Modern Browsers | PWA & Responsive Web (Vercel / Cloud) |
| **Android** | Capacitor 8 / Android SDK 24+ | APK / AAB (Google Play Store) |
| **iOS** | Capacitor 8 / iOS 15.0+ | IPA (Apple App Store / TestFlight) |

---

## 🚀 Key Features

- **Cross-Platform Parity**: 100% shared React frontend and Node.js backend across Web, Android, and iOS.
- **Real-Time Messaging with Socket.IO**: Instant message transmission, delivery ticks, read receipts, and live typing indicators.
- **Voice & Video Calling (WebRTC Mesh)**:
  - 1-to-1 Audio & Video Calling
  - Group Audio & Video Calling with responsive dynamic grids (1, 2, 4, 6, 7+ participants)
  - Microphone mute/unmute, camera toggle, screen sharing
  - PIP (Picture-in-Picture) self preview
  - Network reconnection with ICE restart
  - TURN / STUN server support with environment credentials
- **Group Chats & Member Management**:
  - Add members to existing groups
  - Shareable group invitation links (`https://chatify.app/invite/:code` and `chatify://invite/:code`)
  - Live group call banners with instant join
- **Audio / Voice Messages**: Native microphone recording, waveform player, and audio file attachment.
- **Native Device Integrations**:
  - Haptic touch feedback (`@capacitor/haptics`)
  - Push notifications via FCM / APNS (`@capacitor/push-notifications`)
  - Hardware back button handling on Android (`@capacitor/app`)
  - Deep linking (`chatify://` custom scheme)
  - Native keyboard handling (`@capacitor/keyboard`)
  - Status bar theme sync (`@capacitor/status-bar`)
  - Native splash screen (`@capacitor/splash-screen`)
  - Network state detection and auto-reconnect (`@capacitor/network`)
- **Multi-Language Accessibility**: Dynamic internationalization (`LanguageContext`) supporting English, Telugu, Hindi, Spanish, French, German, and more.

---

## 📂 Project Architecture

```
ChatApp/
├── backend/
│   ├── src/
│   │   ├── config/db.js                 # MongoDB connection & logging
│   │   ├── controllers/                 # Auth, Conversations, Calls, Messages
│   │   ├── middleware/                  # JWT auth, Multer upload, Error handler
│   │   ├── models/                      # User, Conversation, Call, Message, Notif
│   │   ├── routes/                      # REST API endpoint definitions
│   │   ├── sockets/socketHandler.js     # Socket.IO & WebRTC signaling
│   │   └── server.js                    # Express + Socket.IO server
│   ├── uploads/                         # Media files & avatars
│   ├── .env                             # Backend configuration
│   └── package.json
│
├── frontend/
│   ├── android/                         # Native Android Studio project
│   │   └── app/src/main/AndroidManifest.xml
│   ├── ios/                             # Native Xcode project
│   │   └── App/App/Info.plist
│   ├── dist/                            # Production web bundle (webDir)
│   ├── src/
│   │   ├── components/                  # ChatDashboard, CallHistory, AIChat
│   │   ├── context/                     # AuthContext, SocketContext, CallContext
│   │   ├── services/                    # api.js, nativeService.js, callService.js
│   │   └── App.jsx                      # App root with native initialization
│   ├── capacitor.config.json            # Capacitor app configuration
│   ├── vite.config.js
│   └── package.json
│
├── package.json                         # Root runner scripts
└── vercel.json                          # Vercel deployment configuration
```

---

## ⚙️ Quick Start & Local Development

### 1. Install All Dependencies

```bash
npm run install:all
```

### 2. Configure Environment Variables

#### Backend (`backend/.env`):
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key (optional)
```

#### Frontend (`frontend/.env`):
```env
# Backend API & Socket URLs
# For Web local development:
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# For Mobile production builds, point to your deployed backend:
# VITE_API_URL=https://api.yourdomain.com/api
# VITE_SOCKET_URL=https://api.yourdomain.com

# Optional TURN server for WebRTC NAT traversal:
# VITE_TURN_SERVER_URL=turn:turn.yourdomain.com:3478
# VITE_TURN_USERNAME=username
# VITE_TURN_CREDENTIAL=credential

# Google OAuth Client ID:
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

### 3. Run Web Development Server

```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## 🤖 Android Native App Setup & Build

### Requirements
- **OS**: Windows, macOS, or Linux
- **Software**: [Android Studio](https://developer.android.com/studio) (Giraffe or newer)
- **SDKs**: Android SDK Platform 34+, Android SDK Build-Tools, Android Virtual Device (AVD)

### Step-by-Step Instructions

1. **Build Web Assets & Sync Capacitor:**
   ```bash
   npm run mobile:build
   ```
   *(Or from root: `npm run mobile:build`)*

2. **Open in Android Studio:**
   ```bash
   npm run android
   ```
   *(Or: `npx cap open android` inside `frontend/`)*

3. **Running on Emulator or Physical Device:**
   - Connect your Android phone via USB with **USB Debugging** enabled (or start an AVD emulator).
   - In Android Studio, click the green **Run (▶)** button.

4. **Building Release APK / Android App Bundle (AAB):**
   - In Android Studio, navigate to **Build > Generate Signed Bundle / APK**.
   - Select **Android App Bundle** (for Google Play Store) or **APK** (for direct installation).
   - Create or select your keystore file (`.jks`), enter passwords, and choose `release` build variant.
   - Click **Finish** to output the signed `.aab` / `.apk` in `frontend/android/app/release/`.

---

## 🍏 iOS Native App Setup & Build

### Requirements
- **OS**: **macOS** (Required for Xcode and iOS builds)
- **Software**: [Xcode](https://developer.apple.com/xcode/) 15+ (from Mac App Store)
- **Account**: Apple Developer Account (for device deployment and App Store release)
- **Tools**: CocoaPods or Swift Package Manager

### Step-by-Step Instructions

1. **Build Web Assets & Sync Capacitor:**
   ```bash
   npm run mobile:build
   ```

2. **Open in Xcode:**
   ```bash
   npm run ios
   ```
   *(Or: `npx cap open ios` inside `frontend/`)*

3. **Configure Signing & Capabilities:**
   - Select the `App` target in the project navigator.
   - Go to the **Signing & Capabilities** tab.
   - Check **Automatically manage signing** and select your Apple Developer Team.
   - Verify the Bundle Identifier: `com.chatify.app`.

4. **Running on iOS Simulator:**
   - Choose a simulator (e.g. *iPhone 15 Pro*) from the target device dropdown.
   - Click **Run (▶)**.

5. **Building for App Store / TestFlight:**
   - Set device target to **Any iOS Device (arm64)**.
   - Select **Product > Archive**.
   - In the Organizer window, click **Distribute App** to upload to TestFlight / App Store Connect.

---

## 🔔 Push Notifications Setup (FCM & APNS)

### Android (Firebase Cloud Messaging)
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a project and add an Android app with package name: `com.chatify.app`.
3. Download `google-services.json` and place it in:
   `frontend/android/app/google-services.json`
4. Re-sync Capacitor:
   ```bash
   npx cap sync android
   ```

### iOS (Apple Push Notification service)
1. In the Apple Developer portal, create an **APNs Key** (`.p8`).
2. Upload the APNs authentication key to your Firebase Console (or backend APNs provider).
3. In Xcode, open `App.xcodeproj`, go to **Signing & Capabilities**, click **+ Capability**, and add **Push Notifications** and **Background Modes (Remote notifications)**.

---

## 🔐 Permissions Reference

### Android (`frontend/android/app/src/main/AndroidManifest.xml`)
| Permission | Purpose |
|---|---|
| `INTERNET` | API requests, WebSockets, and WebRTC streaming |
| `ACCESS_NETWORK_STATE` | Detect online/offline transitions for auto-reconnect |
| `CAMERA` | 1-to-1 and group video calling, taking profile/attachment photos |
| `RECORD_AUDIO` | Voice calls, video calls, audio messages |
| `MODIFY_AUDIO_SETTINGS` | Route call audio to speaker, earpiece, or Bluetooth headsets |
| `POST_NOTIFICATIONS` | Android 13+ push and in-call notification banners |
| `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` | Photo and video attachment selection |

### iOS (`frontend/ios/App/App/Info.plist`)
| Key | User-Facing Description |
|---|---|
| `NSCameraUsageDescription` | Chatify needs camera access for video calling, profile photos, and sharing photos in chats. |
| `NSMicrophoneUsageDescription` | Chatify needs microphone access for voice calls, video calls, and voice messages. |
| `NSPhotoLibraryUsageDescription` | Chatify needs access to your photo library to share photos and videos in chats. |
| `NSPhotoLibraryAddUsageDescription` | Chatify needs permission to save photos and media to your device. |

---

## 🔗 Deep Linking & Universal Links

Chatify supports native deep linking:
- **Custom Scheme**: `chatify://`
  - Group Invitation: `chatify://invite/:code`
  - Direct Chat: `chatify://chat/:conversationId`
- **Universal Links / App Links**:
  - `https://chatify.app/invite/:code`
  - Opening the link on a device with Chatify installed launches the native app directly to the invitation screen. If not installed, it falls back to the responsive web application.

---

## 🧪 Verification & Health Check

| Check | Command | Status |
|---|---|---|
| Frontend Web Build | `npm run build --prefix frontend` | ✅ Clean (0 errors, 2.57s) |
| Capacitor Sync | `npm run mobile:sync` | ✅ Clean (12 plugins registered) |
| Backend Syntax | `node --check backend/src/server.js` | ✅ Clean |
| Android Platform | `frontend/android` generated | ✅ Ready for Android Studio |
| iOS Platform | `frontend/ios` generated | ✅ Ready for Xcode |
