import React, { useState } from 'react';
import useAuthStore from '../store/authStore';
import axios from 'axios';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({ title: '', description: '', startingBid: '', durationHours: '', imageUrl: '' });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }};
      await axios.post('http://localhost:5000/api/auctions', formData, config);
      setMessage('Auction created successfully!');
      setFormData({ title: '', description: '', startingBid: '', durationHours: '', imageUrl: '' });
    } catch (err) {
      setMessage('Failed to create auction');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} 
          className="clean-panel" style={{ flex: '1', minWidth: '300px' }}
        >
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>Profile</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <img src={user?.avatar} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
            <div>
              <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{user?.name}</p>
              <p style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              <div style={{ marginTop: '0.5rem', display: 'inline-block', background: 'var(--bg-base)', border: '1px solid var(--border-light)', padding: '0.25rem 0.75rem', borderRadius: '1rem', color: 'var(--primary-color)' }}>
                Balance: ${user?.balance}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} 
          className="clean-panel" style={{ flex: '2', minWidth: '300px' }}
        >
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>Create New Auction</h2>
          {message && <div style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>{message}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="text" placeholder="Auction Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="clean-input" required />
            <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="clean-input" rows="3" required></textarea>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input type="number" placeholder="Starting Bid ($)" value={formData.startingBid} onChange={e => setFormData({...formData, startingBid: e.target.value})} className="clean-input" required />
              <input type="number" placeholder="Duration (Hours)" value={formData.durationHours} onChange={e => setFormData({...formData, durationHours: e.target.value})} className="clean-input" required />
            </div>
            <input type="text" placeholder="Image URL (Optional)" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="clean-input" />
            <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>List Auction</button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
