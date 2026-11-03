import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CirclePlus, Clock3, Gavel, PackageOpen, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { API_BASE_URL } from '../config';

const initialForm = { title: '', description: '', category: 'Collectibles', startingBid: '', durationHours: '', imageUrl: '' };

const Dashboard = () => {
  const { user, token } = useAuthStore();
  const [formData, setFormData] = useState(initialForm);
  const [auctions, setAuctions] = useState([]);
  const [bids, setBids] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    Promise.all([
      axios.get(`${API_BASE_URL}/api/auctions/mine`, config),
      axios.get(`${API_BASE_URL}/api/bids/mine?limit=100`, config),
      axios.get(`${API_BASE_URL}/api/watchlist`, config)
    ]).then(([auctionResponse, bidResponse, watchlistResponse]) => {
        if (active) {
          setAuctions(Array.isArray(auctionResponse.data) ? auctionResponse.data : []);
          setBids(Array.isArray(bidResponse.data) ? bidResponse.data : []);
          setWatchlist(Array.isArray(watchlistResponse.data) ? watchlistResponse.data : []);
        }
      })
      .catch(() => {
        if (active) setLoadError('Your dashboard activity could not be loaded. Please refresh to try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  const myAuctions = useMemo(() => auctions.filter(auction => {
    const sellerId = auction.seller?._id || auction.seller;
    return String(sellerId) === String(user?._id);
  }), [auctions, user?._id]);
  const leadingBids = new Set(bids.filter(bid => bid.auction &&
    String(bid.auction.highestBidder?._id || bid.auction.highestBidder) === String(user?._id) &&
    bid.auction.status === 'active' && new Date(bid.auction.endTime) > new Date()
  ).map(bid => String(bid.auction._id))).size;

  const handleSubmit = async event => {
    event.preventDefault();
    setMessage('');
    setError('');
    const startingBid = Number(formData.startingBid);
    const durationHours = Number(formData.durationHours);
    if (!Number.isFinite(startingBid) || startingBid <= 0 || !Number.isFinite(durationHours) || durationHours <= 0) {
      setError('Enter a starting bid and auction duration greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auctions`, {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        startingBid,
        durationHours
      }, { headers: { Authorization: `Bearer ${token}` } });
      setAuctions(previous => [data, ...previous]);
      setFormData(initialForm);
      setMessage('Your lot is now in the catalogue.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not create your auction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrap">
      <div className="dashboard-top">
        <div>
          <div className="eyebrow">Your BidAura account</div>
          <h1 className="page-title">Good day, {user?.name?.split(' ')[0] || 'Collector'}.</h1>
          <p className="body-copy" style={{ margin: '10px 0 0' }}>Your collection, lots, and account details—together in one place.</p>
        </div>
        <Link className="btn-outline" to="/profile"><UserRound size={16} /> View profile</Link>
      </div>

      {loadError && <div className="error-banner" role="alert">{loadError}</div>}
      <div className="stat-grid" style={{ maxWidth: 680, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card"><span>Recent lots</span><strong>{loading ? '…' : myAuctions.length}</strong></div>
        <div className="stat-card"><span>Recent bids</span><strong>{loading ? '…' : bids.length}</strong></div>
        <div className="stat-card"><span>Currently leading</span><strong>{loading ? '…' : leadingBids}</strong></div>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Your listed lots</h2>
            <span className="eyebrow">{myAuctions.length} total</span>
          </div>
          {loading ? (
            <div className="loading-state">Gathering your collection…</div>
          ) : loadError ? (
            <div className="error-banner" role="alert">{loadError}</div>
          ) : myAuctions.length ? (
            <div className="dashboard-lots">
              {myAuctions.map(auction => (
                <Link className="dashboard-lot" to={`/auction/${auction._id}`} key={auction._id}>
                  <img
                    src={auction.imageUrl || 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=400&q=75'}
                    alt=""
                    loading="lazy"
                  />
                  <div>
                    <h3>{auction.title}</h3>
                    <p><Clock3 size={12} style={{ display: 'inline', verticalAlign: '-2px' }} />{' '}
                      Closes {new Date(auction.endTime).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="dashboard-lot-price">${Number(auction.currentBid || 0).toLocaleString()} <ArrowUpRight size={14} /></span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <PackageOpen size={23} style={{ color: 'var(--gold)', margin: '0 auto' }} />
              <h3>Your next lot starts here</h3>
              <p>Share a piece from your collection with the BidAura community.</p>
            </div>
          )}
          <div className="activity-heading">
            <div>
              <div className="eyebrow">Saved for later</div>
              <h3 className="activity-title">Your watchlist</h3>
            </div>
            <Link className="arrow-link" to="/#explore">Explore <ArrowUpRight size={14} /></Link>
          </div>
          {watchlist.length ? (
            <div className="dashboard-lots">
              {watchlist.map(auction => (
                <Link className="dashboard-lot" to={`/auction/${auction._id}`} key={auction._id}>
                  <img src={auction.imageUrl || 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=400&q=75'} alt="" loading="lazy" />
                  <div><h3>{auction.title}</h3><p>{auction.category || 'Collectibles'} · {auction.status}</p></div>
                  <span className="dashboard-lot-price">${Number(auction.currentBid || 0).toLocaleString()} <ArrowUpRight size={14} /></span>
                </Link>
              ))}
            </div>
          ) : !loading && <p className="muted" style={{ fontSize: '.8rem' }}>Your watchlist is empty. Save auctions you want to follow.</p>}
          <div className="activity-heading">
            <div>
              <div className="eyebrow">On the floor</div>
              <h3 className="activity-title">Recent bids</h3>
            </div>
            <Link className="arrow-link" to="/bids">All bids <ArrowUpRight size={14} /></Link>
          </div>
          {bids.length ? (
            <div className="dashboard-lots">
              {bids.slice(0, 5).map(bid => (
                <Link className="dashboard-lot" to={bid.auction ? `/auction/${bid.auction._id}` : '/bids'} key={bid._id}>
                  <img
                    src={bid.auction?.imageUrl || 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=400&q=75'}
                    alt=""
                    loading="lazy"
                  />
                  <div>
                    <h3>{bid.auction?.title || 'Removed auction'}</h3>
                    <p><Gavel size={12} style={{ display: 'inline', verticalAlign: '-2px' }} />{' '}
                      Your bid · {new Date(bid.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="dashboard-lot-price">${Number(bid.amount).toLocaleString()}</span>
                </Link>
              ))}
            </div>
          ) : !loading && (
            <p className="muted" style={{ fontSize: '.8rem' }}>You have not placed a bid yet. <Link to="/" style={{ color: 'var(--gold)' }}>Explore live auctions.</Link></p>
          )}
        </section>

        <aside className="panel">
          <div className="panel-heading"><h2>Present a piece</h2><CirclePlus size={18} color="var(--gold)" /></div>
          <p className="body-copy" style={{ fontSize: '.8rem', margin: '-8px 0 20px' }}>Add a lot to the auction room. You can follow it from your collection.</p>
          {message && <div className="notice" role="status" style={{ marginBottom: 15 }}>{message}</div>}
          <form className="form-stack" onSubmit={handleSubmit}>
            <label className="form-label">Lot title
              <input className="clean-input" type="text" maxLength="120" placeholder="A name for your piece"
                value={formData.title} onChange={event => setFormData({ ...formData, title: event.target.value })} required />
            </label>
            <label className="form-label">Description
              <textarea className="clean-input" rows="4" maxLength="2000" placeholder="Tell its story…"
                value={formData.description} onChange={event => setFormData({ ...formData, description: event.target.value })} required />
            </label>
            <label className="form-label">Category
              <select className="clean-input" value={formData.category} onChange={event => setFormData({ ...formData, category: event.target.value })}>
                {['Art', 'Watches', 'Sneakers', 'Vintage', 'Electronics', 'Cars', 'Jewellery', 'Trading cards', 'Memorabilia', 'Collectibles'].map(category => <option key={category}>{category}</option>)}
              </select>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label className="form-label">Starting bid
                <input className="clean-input" type="number" min="0.01" step="0.01" placeholder="$ 0.00"
                  value={formData.startingBid} onChange={event => setFormData({ ...formData, startingBid: event.target.value })} required />
              </label>
              <label className="form-label">Duration (hours)
                <input className="clean-input" type="number" min="1" step="1" placeholder="24"
                  value={formData.durationHours} onChange={event => setFormData({ ...formData, durationHours: event.target.value })} required />
              </label>
            </div>
            <label className="form-label">Image URL <span className="muted">(optional)</span>
              <input className="clean-input" type="url" placeholder="https://…"
                value={formData.imageUrl} onChange={event => setFormData({ ...formData, imageUrl: event.target.value })} />
            </label>
            {error && !loading && <div className="form-error" role="alert">{error}</div>}
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Preparing your lot…' : 'List this piece'}
            </button>
            <p className="muted" style={{ margin: 0, fontSize: '.68rem', lineHeight: 1.6 }}>
              Prices and account balances in this demo do not represent real funds.
            </p>
          </form>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
