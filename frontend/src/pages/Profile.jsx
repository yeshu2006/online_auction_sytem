import { useEffect, useState } from 'react';
import { ArrowUpRight, BadgeCheck, CircleUserRound, Gavel, PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { API_BASE_URL } from '../config';

const Profile = () => {
  const { user, token } = useAuthStore();
  const [profile, setProfile] = useState(user);
  const [myLots, setMyLots] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    Promise.all([
      axios.get(`${API_BASE_URL}/api/auth/profile`, config),
      axios.get(`${API_BASE_URL}/api/auctions/mine`, config),
      axios.get(`${API_BASE_URL}/api/bids/mine?limit=100`, config)
    ]).then(([profileResponse, auctionResponse, bidResponse]) => {
      if (!active) return;
      setProfile(profileResponse.data);
      setMyLots(Array.isArray(auctionResponse.data) ? auctionResponse.data : []);
      setMyBids(Array.isArray(bidResponse.data) ? bidResponse.data : []);
    }).catch(() => {
      if (active) setError('We could not refresh your profile. The details below may be out of date.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [token]);

  return (
    <div className="page-wrap">
      <div className="eyebrow">Your account</div>
      <h1 className="page-title">Collector profile</h1>
      <p className="body-copy" style={{ margin: '10px 0 28px' }}>Your details and the pieces you have brought to the room.</p>

      {error && <div className="notice" role="status" style={{ marginBottom: 18 }}>{error}</div>}
      <section className="profile-hero">
        <div className="profile-avatar">
          {profile?.avatar ? <img src={profile.avatar} alt="" /> : (profile?.name?.trim()?.[0] || 'M').toUpperCase()}
        </div>
        <div>
          <div className="eyebrow">{profile?.role === 'admin' ? 'Salon administrator' : 'Registered collector'}</div>
          <h2 className="profile-name">{profile?.name || 'Collector'}</h2>
          <div className="profile-email">{profile?.email || 'Email unavailable'}</div>
        </div>
        <BadgeCheck size={21} color="var(--gold)" style={{ marginLeft: 'auto' }} aria-label="Registered account" />
      </section>

      <div className="profile-details">
        <div className="profile-detail">
          <span>Member since</span>
          <strong>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Current member'}</strong>
        </div>
        <div className="profile-detail">
          <span>Your role</span>
          <strong>{profile?.role === 'admin' ? 'Administrator' : 'Collector & seller'}</strong>
        </div>
        <div className="profile-detail">
          <span>Recent listed pieces</span>
          <strong>{loading ? '…' : myLots.length}</strong>
        </div>
        <div className="profile-detail">
          <span>Recent bids</span>
          <strong>{loading ? '…' : myBids.length}</strong>
        </div>
        <div className="profile-detail">
          <span>Demo account balance</span>
          <strong>{profile?.balance == null ? 'Not available' : `$${Number(profile.balance).toLocaleString()}`}</strong>
        </div>
      </div>

      <section style={{ marginTop: 38 }}>
        <div className="section-heading">
          <div>
            <div className="eyebrow">Your auction history</div>
            <h2 className="section-title">Recent bids</h2>
          </div>
          <Link className="btn-outline" to="/bids"><Gavel size={15} /> View all bids</Link>
        </div>
        {loading ? (
          <div className="loading-state">Gathering your bid history…</div>
        ) : myBids.length ? (
          <div className="my-bid-list">
            {myBids.slice(0, 5).map((bid, index) => {
              const isLeading = bid.auction && String(bid.auction.highestBidder?._id || bid.auction.highestBidder) === String(user?._id);
              const ended = !bid.auction || bid.auction.status !== 'active' || new Date(bid.auction.endTime) <= new Date();
              return (
                <article className="my-bid-card" key={bid._id}>
                  <div className="my-bid-index mono">{String(index + 1).padStart(2, '0')}</div>
                  <Link to={bid.auction ? `/auction/${bid.auction._id}` : '/bids'} className="my-bid-image" aria-label={bid.auction?.title || 'Removed auction'}>
                    <img src={bid.auction?.imageUrl || 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=400&q=75'} alt="" loading="lazy" />
                  </Link>
                  <div className="my-bid-info">
                    <div className="lot-category">{new Date(bid.auction?.endTime || 0) <= new Date() ? 'Auction concluded' : 'Live auction'}</div>
                    <h2>{bid.auction?.title || 'Auction no longer available'}</h2>
                    <div className="bid-time">{new Date(bid.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="my-bid-result">
                    <strong>${Number(bid.amount).toLocaleString()}</strong>
                    <span className={ended && isLeading ? 'leading' : ended ? 'ended' : isLeading ? 'leading' : 'outbid'}>
                      {ended && isLeading ? 'You won' : ended ? 'Ended' : isLeading ? 'You are leading' : 'Outbid'}
                    </span>
                  </div>
                  {bid.auction && <Link className="bid-open-link" to={`/auction/${bid.auction._id}`} aria-label={`Open ${bid.auction.title}`}><ArrowUpRight size={17} /></Link>}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Gavel size={22} style={{ color: 'var(--gold)', margin: '0 auto' }} />
            <h3>No bids placed yet</h3>
            <p>Your auction activity will appear here after your first bid.</p>
            <Link className="btn-outline" style={{ marginTop: 16 }} to="/">Explore the catalogue</Link>
          </div>
        )}
      </section>

      <section style={{ marginTop: 38 }}>
        <div className="section-heading">
          <div>
            <div className="eyebrow">In your collection</div>
            <h2 className="section-title">Your listed pieces</h2>
          </div>
          <Link className="btn-outline" to="/dashboard"><CircleUserRound size={15} /> Manage collection</Link>
        </div>
        {loading ? (
          <div className="loading-state">Gathering your collection…</div>
        ) : myLots.length ? (
          <div className="auction-grid">
            {myLots.map(lot => (
              <Link className="auction-card" to={`/auction/${lot._id}`} key={lot._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="auction-image">
                  <img src={lot.imageUrl || 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=80'} alt={lot.title} loading="lazy" />
                </div>
                <div className="lot-body">
                  <span className="lot-category">{lot.status === 'active' ? 'In the auction room' : 'Auction concluded'}</span>
                  <h3 className="lot-title">{lot.title}</h3>
                  <div className="lot-price-row">
                    <div><div className="lot-price-label">Current bid</div><div className="lot-price">${Number(lot.currentBid || 0).toLocaleString()}</div></div>
                    <span className="arrow-link">View lot <ArrowUpRight size={15} /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <PackageOpen size={23} style={{ color: 'var(--gold)', margin: '0 auto' }} />
            <h3>A collection begins with one</h3>
            <p>You have not listed a piece yet. Bring something special to the room.</p>
            <Link className="btn-primary" style={{ marginTop: 17 }} to="/dashboard">Present a piece</Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default Profile;
