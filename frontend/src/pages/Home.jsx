import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useAuctionStore from '../store/auctionStore';
import AuctionCard from '../components/AuctionCard';
import { API_BASE_URL } from '../config';

const Home = () => {
  const { auctions, setAuctions } = useAuctionStore();

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/auctions`);
        setAuctions(data);
      } catch (error) {
        console.error('Error fetching auctions', error);
      }
    };
    fetchAuctions();
  }, [setAuctions]);

  // Take top 3 for featured
  const featuredAuctions = auctions.slice(0, 3);

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <div style={{ background: 'linear-gradient(135deg, var(--bg-base) 0%, #e2e8f0 100%)', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem 2rem', display: 'flex', alignItems: 'center', gap: '4rem', flexWrap: 'wrap' }}>
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            style={{ flex: '1', minWidth: '300px' }}
          >
            <span style={{ color: 'var(--primary-color)', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.875rem' }}>Next-Gen Bidding</span>
            <h1 style={{ fontSize: '4rem', fontWeight: '800', margin: '1rem 0', color: 'var(--text-primary)', lineHeight: '1.1' }}>
              Discover & Collect Premium Assets.
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
              Experience real-time, transparent auctions with unmatched security. Join thousands of high-end collectors worldwide.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', padding: '1rem 2rem', fontSize: '1.125rem' }}>Start Bidding</Link>
              <a href="#featured" className="btn-outline" style={{ textDecoration: 'none', padding: '1rem 2rem', fontSize: '1.125rem' }}>Explore Live</a>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ flex: '1', minWidth: '300px', display: 'flex', justifyContent: 'center' }}
          >
            <img 
              src="https://images.unsplash.com/photo-1584727638096-042c45049ebe?auto=format&fit=crop&q=80&w=600" 
              alt="Art Collection" 
              style={{ width: '100%', maxWidth: '500px', borderRadius: '1rem', boxShadow: 'var(--shadow-hover)', objectFit: 'cover' }} 
            />
          </motion.div>
        </div>
      </div>

      {/* Featured Auctions */}
      <div id="featured" style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem 2rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
          <div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Live Auctions</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.125rem' }}>Place your bids before the timer runs out.</p>
          </div>
          <Link to="/dashboard" style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}>View All →</Link>
        </div>
        
        {featuredAuctions.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
            {featuredAuctions.map((auction, idx) => (
              <motion.div 
                key={auction._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <AuctionCard auction={auction} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="clean-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '1.5rem' }}>No active auctions at the moment.</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>List an item from your dashboard to get started.</p>
          </div>
        )}
      </div>

      {/* Trust Elements */}
      <div style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', padding: '4rem 2rem', marginTop: '4rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚡</div>
            <h3 style={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Real-Time Websockets</h3>
            <p style={{ color: 'var(--text-muted)' }}>Experience instantaneous bid updates synchronized across all global users instantly.</p>
          </div>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</div>
            <h3 style={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Secure Transactions</h3>
            <p style={{ color: 'var(--text-muted)' }}>Bank-grade JWT session authentication ensures your funds and bids remain safely locked.</p>
          </div>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏆</div>
            <h3 style={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Verified Sellers</h3>
            <p style={{ color: 'var(--text-muted)' }}>Assets are rigidly vetted through our administrative oversight board before listing.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
