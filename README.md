# Chatify — Production-Grade MERN Real-Time Chat Application

Chatify is a full-stack, real-time messaging web application built with the **MERN** stack (MongoDB, Express.js, React 19, Node.js) and **Socket.IO**. It supports 1-on-1 private messaging, group chats, typing indicators, online/offline presence tracking, read receipts, media/file sharing, starred messages, message reactions, message editing & deletion, customizable themes, focus mode, and multi-language internationalization.

Designed with a responsive architecture that adapts smoothly across **Desktop, Laptop, Tablet, and Mobile** devices.

---

## 🚀 Key Features

- **Real-Time Messaging with Socket.IO**: Instant message transmission, delivery ticks, read receipts, and live typing indicators.
- **Presence & Online Status**: Real-time Socket.IO online/offline detection with last-seen timestamps.
- **Group Chats**: Create team groups, manage members, assign admins, and broadcast group messages.
- **Message Interactions**:
  - Quoted message replies
  - Message editing (with `(edited)` indicator)
  - Message deletion (Delete for me & Delete for everyone)
  - Star / unstar messages for quick bookmarking
  - Quick emoji reactions (❤️, 👍, 😂, etc.)
- **Media & File Attachments**: Image and document upload via Multer with inline preview and full gallery viewer in conversation profile.
- **Disappearing / Temporary Chats**: Configurable message expiration timers (1 hour, 24 hours, 7 days) with automatic database expiration.
- **Focus Mode (Do Not Disturb)**: Built-in focus session pomodoro timer with notification and audio muting.
- **Smart Dashboard & Analytics**: Real-time stats showing active conversations, unread messages, weekly 7-day activity graphs, and top contacts.
- **Safety & Moderation**: User blocking, unblocking, and reporting system.
- **Device Login History**: Track active browser/OS sessions with remote session revocation.
- **Multi-Language Accessibility**: Dynamic internationalization (`LanguageContext`) supporting English, Spanish, French, German, Hindi, and more.
- **Mobile-First Responsive Layout**: Smooth slide-over navigation with mobile back buttons, touch-friendly targets, and zero horizontal overflow.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 7, React Router DOM v7, Axios, Socket.IO Client, Vanilla CSS Tokens |
| **Backend** | Node.js, Express.js, Socket.IO Server, Multer, Morgan, Dotenv |
| **Database** | MongoDB Atlas / Local MongoDB, Mongoose ODM |
| **Security** | JWT (JSON Web Tokens), Bcrypt.js, CORS, Input Sanitization |

---

## 📂 Project Structure

```
d:/ChatApp/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection & logging
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register, login, me, reset password
│   │   │   ├── userController.js     # Profiles, contacts, blocking, sessions
│   │   │   ├── conversationController.js # 1-to-1 & group conversations
│   │   │   ├── messageController.js  # Sending, editing, starring, reactions
│   │   │   ├── notificationController.js # Notifications inbox & preferences
│   │   │   ├── analyticsController.js# Overview stats & 7-day graph
│   │   │   └── supportController.js  # FAQs & tickets
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verification middleware
│   │   │   ├── upload.js             # Multer file & image storage
│   │   │   └── errorHandler.js       # Global JSON error handler
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Conversation.js
│   │   │   ├── Message.js
│   │   │   ├── Notification.js
│   │   │   ├── DeviceSession.js
│   │   │   ├── Report.js
│   │   │   └── SupportTicket.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── conversationRoutes.js
│   │   │   ├── messageRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   ├── analyticsRoutes.js
│   │   │   └── supportRoutes.js
│   │   ├── sockets/
│   │   │   └── socketHandler.js      # Socket.IO room & presence engine
│   │   ├── app.js                    # Express app definition
│   │   ├── server.js                 # Server listener & HTTP server
│   │   └── seed.js                   # Database seeder script
│   ├── uploads/                      # Uploaded avatars and media files
│   ├── .env                          # Backend environment variables
│   ├── .env.example
│   └── package.json
│
└── ChatApp/                          # Frontend React Application
    ├── src/
    │   ├── components/
    │   │   ├── ChatDashboard.jsx     # Main real-time chat interface
    │   │   ├── ChatDashboard.css
    │   │   ├── Contacts.jsx          # Directory & contact management
    │   │   ├── MessageSearch.jsx     # Message query engine
    │   │   ├── StarredMessages.jsx   # Starred message bookmarks
    │   │   ├── FocusMode.jsx         # Do Not Disturb timer
    │   │   ├── ChatPersonalization.jsx # Theme & wallpaper preferences
    │   │   ├── OnlineStatus.jsx      # Live presence indicator
    │   │   ├── Profile.jsx           # User profile & avatar editor
    │   │   ├── Settings.jsx          # Settings navigation & options
    │   │   ├── Notifications.jsx     # Notification center
    │   │   ├── Languageaccessibility.jsx
    │   │   └── ProtectedRoute.jsx    # Auth route guards
    │   ├── context/
    │   │   ├── AuthContext.jsx       # Global user & token session state
    │   │   ├── SocketContext.jsx     # Global Socket.IO client instance
    │   │   └── LanguageContext.jsx   # i18n dictionary & language provider
    │   ├── pages/
    │   │   ├── Home.jsx              # Landing page
    │   │   ├── Login.jsx             # User authentication
    │   │   ├── Register.jsx          # User registration
    │   │   ├── ForgotPassword.jsx    # Password recovery flow
    │   │   ├── SmartDashboardOverview.jsx # Metrics & quick actions
    │   │   ├── ChatAnalytics.jsx     # Weekly activity graphs
    │   │   ├── DeviceLoginHistory.jsx# Session management
    │   │   ├── ReportBlockUser.jsx   # User safety & moderation
    │   │   ├── TemporaryChat.jsx     # Disappearing messages timer
    │   │   ├── HelpSupport.jsx       # FAQs & support tickets
    │   │   ├── AboutApp.jsx          # App information
    │   │   └── NotFound.jsx          # 404 page
    │   ├── services/
    │   │   ├── api.js                # Axios instance with interceptors
    │   │   ├── authService.js
    │   │   ├── userService.js
    │   │   ├── conversationService.js
    │   │   ├── messageService.js
    │   │   ├── notificationService.js
    │   │   ├── analyticsService.js
    │   │   └── supportService.js
    │   ├── App.jsx                   # Central route registry
    │   └── main.jsx                  # Root React render
    ├── package.json
    └── vite.config.js                # Vite server with API proxy
```

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/chatapp
# For MongoDB Atlas, use:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/chatapp?retryWrites=true&w=majority
JWT_SECRET=chatapp_jwt_production_grade_secret_key_2026_xyz987
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## 🏃 Getting Started

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24.12.0)
- **npm** v9+
- **MongoDB** (local service or MongoDB Atlas connection string)

### 2. Run Both Backend & Frontend Together (Single Command)
You no longer need to run the backend and frontend in separate terminals!

From the root directory (`d:/ChatApp`):
```bash
npm run dev
# or double-click dev.bat
```
*(Or if you are already inside the `frontend/` folder, running `npm run dev` also starts both automatically!)*

### 3. Individual Commands (Optional)
If you ever need to run them independently:
- **Backend only**: `cd backend && npm run dev`
- **Frontend only**: `cd frontend && npm run dev:client`
- **Database Seed**: `npm run seed` (from root) or `cd backend && npm run seed`

---

## 👥 Demo Test Accounts

When running `npm run seed`, the following demo accounts are created (password for all is `password123`):

1. **Sarvani Patel**: `sarvani@example.com`
2. **Alex Johnson**: `alex@example.com`
3. **Maria Rodriguez**: `maria@example.com`
4. **Jenny Soldado**: `jenny@example.com`

---

## 📡 REST API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token |
| `GET` | `/api/auth/me` | Fetch active user profile from Bearer token |
| `POST` | `/api/auth/forgot-password` | Request 6-digit password reset code |
| `POST` | `/api/auth/reset-password` | Submit new password with reset code |
| `GET` | `/api/conversations` | Retrieve all conversations for current user |
| `POST` | `/api/conversations/one-to-one` | Open or create direct 1-on-1 chat |
| `POST` | `/api/conversations/group` | Create group conversation |
| `GET` | `/api/messages/:conversationId` | Retrieve message history |
| `POST` | `/api/messages` | Send a new message |
| `POST` | `/api/messages/upload` | Upload image/file attachment via Multer |
| `PUT` | `/api/messages/:id` | Edit message |
| `DELETE` | `/api/messages/:id` | Delete message (for me or everyone) |
| `POST` | `/api/messages/:id/star` | Toggle starred status |
| `POST` | `/api/messages/:id/react` | Add/toggle emoji reaction |
| `GET` | `/api/users/contacts` | Get user contacts |
| `GET` | `/api/analytics/overview` | Fetch dashboard overview statistics |
| `GET` | `/api/analytics/details` | Fetch weekly message analytics |

---

## ⚡ Real-Time Socket.IO Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `setup` | Client ➔ Server | `userId` | Register user and join user room |
| `user_status_changed` | Server ➔ Client | `{ userId, isOnline, lastSeen }` | Broadcast online/offline presence |
| `join_chat` | Client ➔ Server | `conversationId` | Join room for active conversation |
| `send_message` | Client ➔ Server | `messageObject` | Transmit message to room participants |
| `message_received` | Server ➔ Client | `messageObject` | Real-time incoming message |
| `typing` / `stop_typing` | Bidirectional | `{ conversationId, userName, userId }` | Real-time typing indicators |
| `message_read` | Client ➔ Server | `{ conversationId, userId }` | Read receipt acknowledgment |

---

## 🧪 Production Verification

To verify the production build:
```bash
cd ChatApp
npm run build
```
This produces optimized production bundles in `dist/`.
