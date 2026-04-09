import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import useAuctionStore from '../store/auctionStore';
import useAuthStore from '../store/authStore';
import { motion } from 'framer-motion';

const socket = io('http://localhost:5000');

const AuctionDetails = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { currentAuction, setCurrentAuction, updateBid } = useAuctionStore();
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAuctionData = async () => {
      try {
        const [auctionRes, bidsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/auctions/${id}`),
          axios.get(`http://localhost:5000/api/bids/auction/${id}`)
        ]);
        setCurrentAuction(auctionRes.data);
        setBids(bidsRes.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAuctionData();
    socket.emit('join_auction', id);

    socket.on('bid_update', ({ newBid }) => {
      updateBid(id, newBid.amount, newBid.user);
      setBids(prev => [newBid, ...prev]);
    });

    return () => socket.off('bid_update');
  }, [id, setCurrentAuction, updateBid]);

  const handlePlaceBid = (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to bid.');
      return;
    }
    const amount = Number(bidAmount);
    if (amount <= currentAuction.currentBid) {
      setError('Bid must be higher than current bid.');
      return;
    }
    
    socket.emit('place_bid', { auctionId: id, userId: user._id, amount });
    setBidAmount('');
    setError('');
  };

  if (!currentAuction) return <div style={{ textAlign: 'center', marginTop: '5rem', color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="clean-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <img src={currentAuction.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800'} 
               alt={currentAuction.title} style={{ width: '100%', height: '400px', objectFit: 'cover' }} />
          <div style={{ padding: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>{currentAuction.title}</h1>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.5rem' }}>{currentAuction.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-base)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-light)' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Current Bid</p>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>${currentAuction.currentBid}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Ends in</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '500', color: '#e11d48' }}>{new Date(currentAuction.endTime).toLocaleDateString()}</p>
              </div>
            </div>
            <form onSubmit={handlePlaceBid} style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder={`Min bid: $${currentAuction.currentBid + 1}`} className="clean-input" style={{ flex: '1' }} />
              <button type="submit" className="btn-primary">Place Bid</button>
            </form>
            {error && <p style={{ color: '#e11d48', marginTop: '0.5rem', fontSize: '0.875rem' }}>{error}</p>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="clean-panel" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Live Bids</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {bids.length > 0 ? bids.map(bid => (
              <div key={bid._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-base)', border: '1px solid var(--border-light)', borderRadius: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img src={bid.user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} alt="user" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  <div>
                    <p style={{ fontWeight: '500' }}>{bid.user?.name || 'Anonymous'}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(bid.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>${bid.amount}</p>
              </div>
            )) : <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No bids yet. Be the first!</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuctionDetails;
