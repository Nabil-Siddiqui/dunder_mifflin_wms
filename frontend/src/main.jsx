import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// ============================================================
// React Entry Point
// ============================================================
// Wraps the whole app in:
//   - BrowserRouter: enables client-side routing (react-router-dom)
//   - AuthProvider: makes login state/current user available to
//     every component in the tree via context, without prop-drilling
// ============================================================

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);