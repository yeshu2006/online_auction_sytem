import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import useAuctionStore from '../store/auctionStore';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';

const AdminPanel = () => {
  const { user, token } = useAuthStore();
  const { auctions, setAuctions } = useAuctionStore();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    const fetchAdminData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [usersRes, auctionsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/admin/users`, config),
          axios.get(`${API_BASE_URL}/api/auctions`)
        ]);
        setUsers(usersRes.data);
        setAuctions(auctionsRes.data);
      } catch (err) {
        console.error('Failed to fetch admin data', err);
      }
    };
    fetchAdminData();
  }, [user, token, setAuctions]);

  const handleDeleteAuction = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_BASE_URL}/api/admin/auction/${id}`, config);
      setAuctions(auctions.filter(a => a._id !== id));
    } catch (err) {
      console.error('Failed to delete auction', err);
    }
  };

  if (user?.role !== 'admin') {
    return <div style={{ textAlign: 'center', marginTop: '4rem', color: 'red' }}>Access Denied. Admins Only.</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--primary-color)' }}>Admin Control Panel</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="clean-panel">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Registered Users</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                  <th style={{ padding: '1rem' }}>ID</th>
                  <th style={{ padding: '1rem' }}>Name</th>
                  <th style={{ padding: '1rem' }}>Email</th>
                  <th style={{ padding: '1rem' }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{u._id}</td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{u.name}</td>
                    <td style={{ padding: '1rem' }}>{u.email}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: u.role === 'admin' ? 'var(--primary-color)' : 'var(--bg-base)', color: u.role === 'admin' ? 'white' : 'var(--text-primary)' }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="clean-panel">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Manage Auctions</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                  <th style={{ padding: '1rem' }}>Title</th>
                  <th style={{ padding: '1rem' }}>Seller ID</th>
                  <th style={{ padding: '1rem' }}>Current Bid</th>
                  <th style={{ padding: '1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {auctions.map(a => (
                  <tr key={a._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{a.title}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{a.seller?._id || a.seller}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>${a.currentBid}</td>
                    <td style={{ padding: '1rem' }}>
                      <button onClick={() => handleDeleteAuction(a._id)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;
