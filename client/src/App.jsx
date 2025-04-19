// src/App.jsx
import React from 'react';
import { AppProvider } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import './styles/global.css';

function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}

export default App;