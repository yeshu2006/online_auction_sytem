import React from 'react';
import { Link } from 'react-router-dom';

const AuctionCard = ({ auction }) => {
  return (
    <div className="clean-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'pointer' }} 
         onMouseOver={(e) => {
           e.currentTarget.style.transform = 'translateY(-4px)';
           e.currentTarget.style.boxShadow = 'var(--shadow-hover)';
         }}
         onMouseOut={(e) => {
           e.currentTarget.style.transform = 'translateY(0)';
           e.currentTarget.style.boxShadow = 'var(--shadow-card)';
         }}>
      
      <div style={{ width: '100%', height: '200px', borderRadius: '0.5rem', overflow: 'hidden', background: 'var(--bg-base)' }}>
        <img src={auction.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800'} 
             alt={auction.title} 
             style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>{auction.title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Ends in: {new Date(auction.endTime).toLocaleDateString()}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Bid</span>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>${auction.currentBid}</p>
        </div>
        <Link to={`/auction/${auction._id}`} className="btn-primary" style={{ textDecoration: 'none' }}>
          Details
        </Link>
      </div>
    </div>
  );
};

export default AuctionCard;
