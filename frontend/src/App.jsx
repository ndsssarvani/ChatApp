import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChatDashboard from './components/ChatDashboard';
import Settings from './components/Settings';
import Profile from './components/Profile';
import Notifications from './components/Notifications';
import LanguageAccessibility from './components/Languageaccessibility';
import Privacy from './pages/Privacy';
import Contacts from './components/Contacts';
import MessageSearch from './components/MessageSearch';
import StarredMessages from './components/StarredMessages';
import GroupManagement from './pages/GroupManagement';
import FocusMode from './components/FocusMode';
import ChatPersonalization from './components/ChatPersonalization';
import SmartDashboardOverview from './pages/SmartDashboardOverview';
import ChatAnalytics from './pages/ChatAnalytics';
import DeviceLoginHistory from './pages/DeviceLoginHistory';
import ReportBlockUser from './pages/ReportBlockUser';
import TemporaryChat from './pages/TemporaryChat';
import HelpSupport from './pages/HelpSupport';
import AboutApp from './pages/AboutApp';
import NotFound from './pages/NotFound';
import AIChat from './components/AIChat';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password/:token"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ChatDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/language"
        element={
          <ProtectedRoute>
            <LanguageAccessibility />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notification"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/privacy"
        element={
          <ProtectedRoute>
            <Privacy />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts"
        element={
          <ProtectedRoute>
            <Contacts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search-messages"
        element={
          <ProtectedRoute>
            <MessageSearch />
          </ProtectedRoute>
        }
      />
      <Route
        path="/starred"
        element={
          <ProtectedRoute>
            <StarredMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups"
        element={
          <ProtectedRoute>
            <GroupManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/focus-mode"
        element={
          <ProtectedRoute>
            <FocusMode />
          </ProtectedRoute>
        }
      />
      <Route
        path="/personalization"
        element={
          <ProtectedRoute>
            <ChatPersonalization />
          </ProtectedRoute>
        }
      />
      <Route
        path="/overview"
        element={
          <ProtectedRoute>
            <SmartDashboardOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <ChatAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/device-history"
        element={
          <ProtectedRoute>
            <DeviceLoginHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/report-block"
        element={
          <ProtectedRoute>
            <ReportBlockUser />
          </ProtectedRoute>
        }
      />
      <Route
        path="/temporary-chat"
        element={
          <ProtectedRoute>
            <TemporaryChat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-chat"
        element={
          <ProtectedRoute>
            <AIChat />
          </ProtectedRoute>
        }
      />
      {/* Publicly Accessible Information & Support Routes */}
      <Route path="/help" element={<HelpSupport />} />
      <Route path="/about" element={<AboutApp />} />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;