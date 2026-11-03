import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import { Login, Register } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AuctionDetails from './pages/AuctionDetails';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import Bids from './pages/Bids';
import InfoPage from './pages/InfoPage';
import useAuthStore from './store/authStore';

function App() {
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  const isAuthenticated = Boolean(user && token);

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />} />
          <Route path="/bids" element={isAuthenticated ? <Bids /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={isAuthenticated && user.role === 'admin' ? <AdminPanel /> : <Navigate to="/" replace />} />
          <Route path="/auction/:id" element={<AuctionDetails />} />
          <Route path="/help" element={<InfoPage />} />
          <Route path="/privacy" element={<InfoPage />} />
          <Route path="/terms" element={<InfoPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
