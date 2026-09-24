import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { CallProvider } from './context/CallContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <CallProvider>
              <App />
            </CallProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>
);