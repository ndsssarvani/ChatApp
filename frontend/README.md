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

## 🏃 Getting Started

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24.12.0)
- **npm** v9+
- **MongoDB** (local service or MongoDB Atlas connection string)

### 2. Backend Setup
```bash
cd backend
npm install
npm run seed       # (Optional) Populates demo users and sample conversations
npm start          # Runs production server on port 5000
# or: npm run dev  # Runs with Node watch mode
```

### 3. Frontend Setup
```bash
cd ../ChatApp
npm install
npm run dev        # Launches Vite development server on http://localhost:5173
```

---

## 👥 Demo Test Accounts

When running `npm run seed`, the following demo accounts are created (password for all is `password123`):

1. **Sarvani Patel**: `sarvani@example.com`
2. **Alex Johnson**: `alex@example.com`
3. **Maria Rodriguez**: `maria@example.com`
4. **Jenny Soldado**: `jenny@example.com`
