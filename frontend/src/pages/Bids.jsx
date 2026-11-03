import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Clock3, Gavel, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { API_BASE_URL } from '../config';

const Bids = () => {
  const token = useAuthStore(state => state.token);
  const [bids, setBids] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const fetchBids = useCallback(async (page, append = false) => {
    const { data, headers } = await axios.get(`${API_BASE_URL}/api/bids/mine?page=${page}&limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setBids(previous => append ? [...previous, ...data] : data);
    setTotal(Number(headers['x-total-count']) || data.length);
  }, [token]);

  useEffect(() => {
    let active = true;
    fetchBids(1).catch(() => {
      if (active) setError('Your bid history could not be loaded. Please try again.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [fetchBids]);

  const loadMore = async () => {
    setLoadingMore(true);
    setError('');
    try {
      await fetchBids(Math.floor(bids.length / 20) + 1, true);
    } catch {
      setError('More of your bid history could not be loaded. Please try again.');
    } finally {
      setLoadingMore(false);
    }
  };
  const retry = async () => {
    setLoading(true);
    setError('');
    try {
      await fetchBids(1);
    } catch {
      setError('Your bid history could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const classifiedBids = useMemo(() => bids.map(bid => {
    const auction = bid.auction;
    const ended = !auction || auction.status !== 'active' || new Date(auction.endTime) <= new Date();
    const isLeading = !ended && String(auction.highestBidder?._id || auction.highestBidder) === String(bid.user);
    const isWinner = ended && auction && String(auction.highestBidder?._id || auction.highestBidder) === String(bid.user);
    return { ...bid, auction, ended, isLeading, isWinner };
  }), [bids]);
  const visibleBids = classifiedBids.filter(bid =>
    filter === 'all' || (filter === 'leading' && bid.isLeading) ||
    (filter === 'outbid' && !bid.ended && !bid.isLeading) ||
    (filter === 'ended' && bid.ended)
  );
  const leadingCount = new Set(classifiedBids.filter(bid => bid.isLeading || bid.isWinner).map(bid => String(bid.auction._id))).size;
  const bidContent = loading ? (
    <div className="loading-state">Gathering your bid history…</div>
  ) : error && !bids.length ? (
    <div className="empty-state">
      <h3>Bid history unavailable</h3>
      <p>We could not load your account activity.</p>
      <button className="btn-outline" style={{ marginTop: 16 }} type="button" onClick={retry}>Try again</button>
    </div>
  ) : visibleBids.length ? (
    <div className="my-bid-list">
      {visibleBids.map((bid, index) => (
        <article className="my-bid-card" key={bid._id}>
          <div className="my-bid-index mono">{String(index + 1).padStart(2, '0')}</div>
          <Link to={bid.auction ? `/auction/${bid.auction._id}` : '#'} className="my-bid-image" aria-label={bid.auction?.title || 'Removed auction'}>
            <img src={bid.auction?.imageUrl || 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=400&q=75'} alt="" loading="lazy" />
          </Link>
          <div className="my-bid-info">
            <div className="lot-category">{bid.auction?.status === 'active' && !bid.ended ? 'Live auction' : 'Auction concluded'}</div>
            <h2>{bid.auction?.title || 'Auction no longer available'}</h2>
            <div className="bid-time"><Clock3 size={12} style={{ display: 'inline', verticalAlign: '-2px' }} />{' '}
              Your bid · {new Date(bid.createdAt).toLocaleString()}
            </div>
          </div>
          <div className="my-bid-result">
            <strong>${Number(bid.amount).toLocaleString()}</strong>
            <span className={bid.isWinner || bid.isLeading ? 'leading' : bid.ended ? 'ended' : 'outbid'}>
              {bid.isWinner ? 'You won' : bid.ended ? 'Ended' : bid.isLeading ? 'You are leading' : 'Outbid'}
            </span>
          </div>
          {bid.auction && <Link className="bid-open-link" to={`/auction/${bid.auction._id}`} aria-label={`Open ${bid.auction.title}`}><ArrowUpRight size={17} /></Link>}
        </article>
      ))}
    </div>
  ) : (
    <div className="empty-state">
      <Gavel size={23} style={{ color: 'var(--gold)', margin: '0 auto' }} />
      <h3>{bids.length ? 'No bids in this view' : 'Your first bid is waiting'}</h3>
      <p>{bids.length ? 'Choose another filter to see more of your activity.' : 'Explore the auction room and follow an exceptional lot.'}</p>
      {!bids.length && <Link className="btn-primary" style={{ marginTop: 17 }} to="/">Explore the catalogue <Radio size={14} /></Link>}
    </div>
  );

  return (
    <div className="page-wrap">
      <div className="eyebrow">Your activity</div>
      <h1 className="page-title">Your bids.</h1>
      <p className="body-copy" style={{ margin: '10px 0 25px' }}>Every bid you have placed, and where each lot stands now.</p>

      <div className="stat-grid" style={{ maxWidth: 520, gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat-card"><span>Total bids placed</span><strong>{loading ? '…' : total}</strong></div>
        <div className="stat-card"><span>Lots leading or won · loaded bids</span><strong>{loading ? '…' : leadingCount}</strong></div>
      </div>

      <div className="bid-filters" role="group" aria-label="Filter bid history">
        {[
          ['all', 'All bids'],
          ['leading', 'Leading'],
          ['outbid', 'Outbid'],
          ['ended', 'Ended']
        ].map(([value, label]) => (
          <button key={value} className={`filter-button${filter === value ? ' selected' : ''}`}
            type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>
            {label}
          </button>
        ))}
      </div>

      <section className="bid-results">
      {error && <div className="error-banner" role="alert">{error}</div>}
      {bidContent}
        {!loading && bids.length < total && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
            <button className="btn-outline" type="button" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : 'Load more bid history'}
            </button>
          </div>
        )}
      </section>
      </div>
  );
};

export default Bids;
