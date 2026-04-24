/**
 * App Component
 * Root component that sets up the Toaster and renders the Dashboard
 */
import React from 'react';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <>
      {/* Toast Notification Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            borderRadius: '12px',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            fontSize: '14px',
          },
        }}
      />

      {/* Main App */}
      <Dashboard />
    </>
  );
}

export default App;
