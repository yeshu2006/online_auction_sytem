import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Bell, Bookmark, Check, ChevronDown,
  Clock3, Eye, Flame, Gavel, Heart, Menu, Search, ShieldCheck, Sparkles,
  TrendingUp, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { API_BASE_URL } from '../config';

const categories = [
  { name: 'Art', image: 'photo-1579783902614-a3fb3927b6a5' },
  { name: 'Watches', image: 'photo-1523170335258-f5ed11844a49' },
  { name: 'Sneakers', image: 'photo-1542291026-7eec264c27ff' },
  { name: 'Vintage', image: 'photo-1513364776144-60967b0f800f' },
  { name: 'Electronics', image: 'photo-1526738549149-8e07eca6c147' },
  { name: 'Cars', image: 'photo-1503376780353-7e6692767b70' },
  { name: 'Jewellery', image: 'photo-1611652022419-a9419f74343d' },
  { name: 'Trading cards', image: 'photo-1612036782180-6f0b6cd846fe' },
  { name: 'Memorabilia', image: 'photo-1461896836934-ffe607ba8211' }
];

const clockStart = Date.now();
const imageUrl = (id, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
const fallbackImage = imageUrl('photo-1579783902614-a3fb3927b6a5');
const formatPrice = amount => `$${Number(amount || 0).toLocaleString('en-US')}`;
const readGuestWatchlist = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('bidaura:watchlist') || '[]');
    return Array.isArray(stored) ? stored.filter(id => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

const mapAuction = auction => {
  const endTime = new Date(auction.endTime).getTime();
  const status = auction.status === 'active' && endTime > Date.now()
    ? 'live'
    : auction.highestBidder ? 'sold' : 'closed';
  const sellerName = auction.seller?.name || 'Collector';
  return {
    id: auction._id,
    title: auction.title,
    subtitle: auction.description,
    category: auction.category || 'Collectibles',
    image: auction.imageUrl || fallbackImage,
    price: auction.currentBid ?? auction.startingBid,
    bids: auction.bidCount || 0,
    seller: sellerName,
    endTime,
    status,
    winner: auction.highestBidder?.name || '',
    createdAt: new Date(auction.createdAt).getTime(),
    heat: auction.bidCount > 20 ? 'Popular' : 'Live'
  };
};

function useAuctionClock() {
  const [now, setNow] = useState(clockStart);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function Countdown({ endsAt, now, short = false }) {
  const seconds = Math.max(0, Math.floor((endsAt - now) / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  const label = days
    ? `${days}d ${hours}h`
    : `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  if (short) return <span>{label}</span>;
  return <span className="ba-countdown" aria-label={`${label} remaining`}><Clock3 size={14} /> {label}</span>;
}

function BidAuraHome() {
  const { user, token } = useAuthStore();
  const now = useAuctionClock();
  const [auctions, setAuctions] = useState([]);
  const [totalAuctions, setTotalAuctions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All items');
  const [view, setView] = useState('grid');
  const [saved, setSaved] = useState(readGuestWatchlist);
  const [toast, setToast] = useState('');
  const [activeFilter, setActiveFilter] = useState('Live now');

  const fetchAuctions = useCallback(async (signal, pageNumber = 1, append = false) => {
    const { data, headers } = await axios.get(`${API_BASE_URL}/api/auctions`, {
      params: { page: pageNumber, limit: 100 },
      signal
    });
    const items = Array.isArray(data) ? data.map(mapAuction) : [];
    setAuctions(previous => append ? [...previous, ...items] : items);
    setPage(pageNumber);
    setTotalAuctions(Number(headers['x-total-count']) || items.length);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const startup = window.setTimeout(() => {
      fetchAuctions(controller.signal)
        .catch(() => {
          if (!controller.signal.aborted) setLoadError('Auctions could not be loaded. Check your connection and try again.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 0);
    return () => {
      window.clearTimeout(startup);
      controller.abort();
    };
  }, [fetchAuctions]);

  useEffect(() => {
    let active = true;
    const startup = window.setTimeout(() => {
      if (user && token) {
        axios.get(`${API_BASE_URL}/api/watchlist`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(async ({ data }) => {
          if (!Array.isArray(data)) return;
          const accountSaved = data.map(auction => String(auction._id));
          const guestSaved = readGuestWatchlist();
          const toSync = guestSaved.filter(id => !accountSaved.includes(id));
          await Promise.all(toSync.map(auctionId => axios.post(`${API_BASE_URL}/api/watchlist`, { auctionId }, {
            headers: { Authorization: `Bearer ${token}` }
          })));
          if (active) {
            setSaved([...accountSaved, ...toSync]);
            localStorage.removeItem('bidaura:watchlist');
          }
        }).catch(() => {
          if (active) setToast('Your saved auctions could not be loaded.');
        });
        return;
      }
      setSaved(readGuestWatchlist());
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(startup);
    };
  }, [token, user]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const liveAuctions = useMemo(() => auctions.filter(lot => lot.status === 'live'), [auctions]);
  const soldAuctions = useMemo(() => auctions.filter(lot => lot.status === 'sold'), [auctions]);
  const visibleAuctions = useMemo(() => auctions.filter(lot => {
    const matchesStatus = activeFilter === 'All items' ||
      (activeFilter === 'Live now' && lot.status === 'live') ||
      (activeFilter === 'Upcoming' && lot.startTime && lot.startTime > now) ||
      (activeFilter === 'Recently sold' && lot.status === 'sold');
    const matchesCategory = category === 'All items' || lot.category.toLowerCase() === category.toLowerCase();
    const needle = query.trim().toLowerCase();
    return matchesStatus && matchesCategory &&
      (!needle || `${lot.title} ${lot.category} ${lot.seller}`.toLowerCase().includes(needle));
  }), [activeFilter, auctions, category, now, query]);

  const toggleSaved = async lot => {
    const alreadySaved = saved.includes(lot.id);
    const next = alreadySaved ? saved.filter(id => id !== lot.id) : [...saved, lot.id];
    setSaved(next);
    if (user && token) {
      try {
        await axios({
          method: alreadySaved ? 'delete' : 'post',
          url: alreadySaved ? `${API_BASE_URL}/api/watchlist/${lot.id}` : `${API_BASE_URL}/api/watchlist`,
          data: alreadySaved ? undefined : { auctionId: lot.id },
          headers: { Authorization: `Bearer ${token}` }
        });
        setToast(alreadySaved ? 'Removed from your watchlist' : 'Saved to your account');
      } catch (error) {
        setSaved(saved);
        setToast(error.response?.data?.message || 'Your watchlist could not be updated.');
      }
      return;
    }
    try { localStorage.setItem('bidaura:watchlist', JSON.stringify(next)); }
    catch { setToast('Browser storage is unavailable; this save will not persist.'); return; }
    setToast(alreadySaved ? 'Removed from your watchlist' : 'Saved on this device. Sign in to sync it.');
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      await fetchAuctions(undefined, page + 1, true);
    } catch (error) {
      setToast(error.response?.data?.message || 'More auctions could not be loaded.');
    } finally {
      setLoadingMore(false);
    }
  };

  const featured = liveAuctions.reduce((best, lot) => !best || lot.bids > best.bids ? lot : best, null);
  const endingSoon = [...liveAuctions].sort((a, b) => a.endTime - b.endTime)[0];
  const trending = [...liveAuctions].sort((a, b) => b.bids - a.bids)[0];
  const newest = [...liveAuctions].sort((a, b) => b.createdAt - a.createdAt)[0];
  const recentSale = [...soldAuctions].sort((a, b) => b.endTime - a.endTime)[0];
  const curatedLots = [
    trending && { label: 'Trending now', detail: `${trending.bids} bids`, lot: trending },
    endingSoon && { label: 'Ending soon', detail: <Countdown endsAt={endingSoon.endTime} now={now} short />, lot: endingSoon },
    newest && { label: 'Newly listed', detail: `Listed by ${newest.seller}`, lot: newest },
    recentSale && { label: 'Recent winning moment', detail: `Won by ${recentSale.winner}`, lot: recentSale },
    newest && { label: 'Collector’s pick', detail: newest.category, lot: newest }
  ].filter(Boolean);

  return (
    <div className="bidaura-home">
      <div className="ba-announcement"><Sparkles size={14} /><span>FIND SOMETHING YOU’LL KEEP FOREVER</span><a href="#explore">Explore auctions <ArrowUpRight size={13} /></a></div>

      <section className="ba-hero">
        <div className="ba-hero-copy">
          <div className="ba-overline"><span className="ba-overline-line" /> A marketplace for collectors</div>
          <h1>Discover.<br /><span>Bid.</span> Own.</h1>
          <p>Rare finds. Remarkable stories. Your next forever piece is just one bid away.</p>
          <div className="ba-hero-actions"><a className="ba-button ba-button-gold" href="#explore">Browse auctions <ArrowRight size={16} /></a><Link className="ba-link-button" to={user ? '/dashboard' : '/register'}>Sell an item <ArrowUpRight size={15} /></Link></div>
          <div className="ba-social-proof"><div className="ba-avatar-stack" aria-hidden="true"><span>J</span><span>M</span><span>A</span><span>+</span></div><div><strong>{totalAuctions.toLocaleString()} listed items</strong><span>From collectors in the BidAura community</span></div></div>
        </div>
        <div className="ba-hero-art">
          <img src={featured?.image || fallbackImage} alt={featured?.title || 'Featured collectible auction'} />
          <div className="ba-art-overlay" />
          <div className="ba-hero-stamp"><span>COLLECTED<br />WITH INTENT</span><span className="ba-stamp-star">✳</span></div>
          <div className="ba-featured-float">
            <div className="ba-featured-top"><span className="ba-live-pill"><i /> {featured ? 'Live auction' : 'Auction room'}</span><span>{featured ? featured.category.toUpperCase() : 'BIDAURA'}</span></div>
            <strong>{featured?.title || 'Find your next favourite'}</strong>
            <div className="ba-featured-bottom">
              <div><span>{featured ? 'Current bid' : 'Live auctions'}</span><b>{featured ? formatPrice(featured.price) : liveAuctions.length}</b></div>
              <div><span>{featured ? 'Ends in' : 'Explore'}</span><b>{featured ? <Countdown endsAt={featured.endTime} now={now} short /> : 'Browse lots'}</b></div>
              {featured && <Link to={`/auction/${featured.id}`} aria-label="View featured auction"><ArrowUpRight size={18} /></Link>}
            </div>
          </div>
          <div className="ba-image-caption"><span>{String(liveAuctions.length).padStart(2, '0')} LIVE LOTS</span><span>Objects with a past. Pieces with a future.</span></div>
        </div>
        <a className="ba-scroll-cue" href="#explore"><span>SCROLL TO DISCOVER</span><ArrowDownRight size={15} /></a>
      </section>

      <section className="ba-section ba-explore" id="explore">
        <div className="ba-section-heading">
          <div><div className="ba-overline"><span className="ba-overline-line" /> The good stuff</div><h2>Find your next <em>favourite.</em></h2></div>
          <a className="ba-text-link" href="#explore" onClick={() => { setActiveFilter('All items'); setCategory('All items'); setQuery(''); }}>View all auctions <ArrowRight size={15} /></a>
        </div>
        <div className="ba-market-controls">
          <div className="ba-filter-tabs" role="tablist" aria-label="Auction status">
            {['Live now', 'Upcoming', 'Recently sold', 'All items'].map(filter => <button key={filter} type="button" role="tab" aria-selected={activeFilter === filter} className={activeFilter === filter ? 'is-active' : ''} onClick={() => setActiveFilter(filter)}>{filter === 'Live now' && <span className="ba-live-dot" />}{filter}</button>)}
          </div>
          <div className="ba-market-tools">
            <label className="ba-search"><Search size={16} /><input aria-label="Search auctions" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search auctions" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={14} /></button>}</label>
            <label className="ba-category-select"><span className="sr-only">Filter by category</span><select value={category} onChange={event => setCategory(event.target.value)}><option>All items</option>{categories.map(item => <option key={item.name}>{item.name}</option>)}<option>Collectibles</option></select><ChevronDown size={14} /></label>
            <div className="ba-view-switch" aria-label="Auction layout"><button className={view === 'grid' ? 'is-active' : ''} type="button" onClick={() => setView('grid')} aria-label="Grid view"><span className="ba-grid-icon">▦</span></button><button className={view === 'list' ? 'is-active' : ''} type="button" onClick={() => setView('list')} aria-label="List view"><Menu size={17} /></button></div>
          </div>
        </div>
        {loadError && <div className="ba-market-error" role="alert">{loadError}<button type="button" onClick={() => { setLoading(true); setLoadError(''); fetchAuctions().catch(() => setLoadError('Auctions could not be loaded. Check your connection and try again.')).finally(() => setLoading(false)); }}>Try again</button></div>}
        <div className={`ba-auction-grid${view === 'list' ? ' ba-list-view' : ''}`}>
          {loading ? Array.from({ length: 6 }, (_, index) => <div className="ba-skeleton-card" key={index} aria-hidden="true"><div /><span /><span /></div>) :
            visibleAuctions.map((lot, index) => (
              <article key={lot.id} className={`ba-auction-card ba-card-${index + 1}`}>
                <button className={`ba-watch${saved.includes(lot.id) ? ' is-saved' : ''}`} type="button" aria-label={saved.includes(lot.id) ? 'Remove from watchlist' : 'Add to watchlist'} onClick={() => toggleSaved(lot)}><Heart size={17} fill={saved.includes(lot.id) ? 'currentColor' : 'none'} /></button>
                <Link className="ba-card-open" to={`/auction/${lot.id}`} aria-label={`View ${lot.title}`}>
                  <div className="ba-card-image"><img src={lot.image} alt={lot.title} loading="lazy" /><span className={`ba-status-chip ba-status-${lot.status}`}>{lot.status === 'live' ? <><i /> Live now</> : lot.status === 'sold' ? 'Sold' : 'Closed'}</span>{lot.status === 'live' && <span className="ba-heat"><Flame size={12} /> {lot.heat}</span>}{lot.status === 'sold' && <span className="ba-sold-stamp"><Check size={12} /> Won by {lot.winner}</span>}<span className="ba-card-view"><Eye size={14} /> View auction</span></div>
                  <div className="ba-card-copy"><div className="ba-card-kicker"><span>{lot.category}</span><span>Lot {lot.id.slice(-5).toUpperCase()}</span></div><h3>{lot.title}</h3><p>{lot.subtitle}</p>
                    <div className="ba-card-footer"><div className="ba-price-info"><span>{lot.status === 'sold' ? 'Winning bid' : lot.status === 'live' ? 'Current bid' : 'Last bid'}</span><strong>{formatPrice(lot.price)}</strong></div><div className="ba-bid-info"><span><Gavel size={13} /> {lot.bids} bids</span>{lot.status === 'live' ? <Countdown endsAt={lot.endTime} now={now} /> : <span>{new Date(lot.endTime).toLocaleDateString()}</span>}</div></div>
                    <div className="ba-seller-line"><span className="ba-seller-avatar">{lot.seller[0]?.toUpperCase() || 'C'}</span><span>Listed by <b>{lot.seller}</b></span><span className="ba-verified"><Check size={10} /></span></div>
                  </div>
                </Link>
              </article>
            ))}
          {!loading && !loadError && !visibleAuctions.length && <div className="ba-empty"><Search size={24} /><strong>{activeFilter === 'Upcoming' ? 'No upcoming lots are scheduled.' : 'No auctions found.'}</strong><span>{query ? 'Try another search or category.' : 'Check back soon for new listings.'}</span></div>}
        </div>
        <div className="ba-explore-more"><span>{loading ? 'Loading auctions…' : `Showing ${visibleAuctions.length} of ${totalAuctions} lots`}</span>{auctions.length < totalAuctions ? <button type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load more auctions'} <ArrowRight size={15} /></button> : <button type="button" onClick={() => { setActiveFilter('All items'); setCategory('All items'); setQuery(''); }}>Show all available lots <ArrowRight size={15} /></button>}</div>
      </section>

      {!!curatedLots.length && <section className="ba-curated-section"><div className="ba-section"><div className="ba-section-heading"><div><div className="ba-overline"><span className="ba-overline-line" /> Worth a closer look</div><h2>The room is getting <em>interesting.</em></h2></div></div><div className="ba-curated-grid">{curatedLots.map(({ label, detail, lot }) => <Link className="ba-curated-card" key={`${label}-${lot.id}`} to={`/auction/${lot.id}`}><span className="ba-curated-image"><img src={lot.image} alt="" loading="lazy" /><ArrowUpRight size={17} /></span><span className="ba-curated-label">{label}</span><strong>{lot.title}</strong><span className="ba-curated-detail">{detail}</span></Link>)}</div></div></section>}

      <section className="ba-category-section"><div className="ba-section ba-categories" id="categories"><div className="ba-section-heading"><div><div className="ba-overline"><span className="ba-overline-line" /> A world of wonderful things</div><h2>What catches <em>your eye?</em></h2></div><p>Browse a category and see what collectors have listed.</p></div>
        <div className="ba-category-grid">{categories.map((item, index) => { const count = auctions.filter(lot => lot.category.toLowerCase() === item.name.toLowerCase()).length; return <button className={`ba-category-tile ba-category-${index + 1}`} type="button" key={item.name} onClick={() => { setCategory(item.name); setActiveFilter('All items'); document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' }); }}><img src={imageUrl(item.image, 600)} alt="" loading="lazy" /><span className="ba-category-shade" /><span className="ba-category-copy"><b>{item.name}</b><small>{count} {count === 1 ? 'lot' : 'lots'}</small></span><ArrowUpRight size={16} /></button>; })}</div>
      </div></section>

      <section className="ba-section ba-story-section"><div className="ba-story-image"><img src={imageUrl('photo-1577083552431-6e5fd01aa342', 1200)} alt="A colorful collector's painting" loading="lazy" /><span className="ba-story-image-label">A little more than an object.</span></div><div className="ba-story-copy"><div className="ba-overline"><span className="ba-overline-line" /> More than a marketplace</div><h2>Every piece has a past.<br />Make it part of <em>yours.</em></h2><p>Behind every great find is a story worth keeping. Discover remarkable objects from collectors and give them a new chapter.</p><div className="ba-story-stats"><div><strong>{totalAuctions.toLocaleString()}</strong><span>listed items</span></div><div><strong>{liveAuctions.length}</strong><span>live auctions</span></div><div><strong>{soldAuctions.length}</strong><span>successful sales</span></div></div><a className="ba-text-link" href="#explore">Meet your next favourite <ArrowRight size={15} /></a></div></section>

      <section className="ba-section ba-final-section"><div className="ba-final-image"><img src={imageUrl('photo-1513364776144-60967b0f800f', 1200)} alt="An artist's studio full of color and character" loading="lazy" /></div><div className="ba-final-card"><div className="ba-overline"><span className="ba-overline-line" /> Your next chapter starts here</div><h2>Some things just<br />feel like <em>you.</em></h2><p>Join a community of people who know a good find when they see one.</p><Link className="ba-button ba-button-gold" to={user ? '/dashboard' : '/register'}>{user ? 'Go to your dashboard' : 'Create your account'} <ArrowRight size={16} /></Link></div></section>

      <div className="ba-trust-strip"><div><ShieldCheck size={18} /><span>Curated with care</span></div><i /><div><Gavel size={17} /><span>Real-time bidding</span></div><i /><div><Bookmark size={16} /><span>Made for collectors</span></div><i /><div><Bell size={16} /><span>Never miss a moment</span></div></div>

      <footer className="ba-footer"><div className="ba-footer-main"><div className="ba-footer-brand"><Link to="/" className="ba-logo"><span className="ba-logo-mark"><Gavel size={19} /></span><span>bid<span>aura</span><small>THE ART OF THE FIND</small></span></Link><p>Good finds. Great stories.<br />A little friendly competition.</p></div>
        <div className="ba-footer-col"><b>Explore</b><a href="#explore" onClick={() => setActiveFilter('Live now')}>Live auctions</a><a href="#explore" onClick={() => setActiveFilter('Upcoming')}>Upcoming drops</a><a href="#categories">Categories</a><a href="#explore" onClick={() => setActiveFilter('Recently sold')}>Recently sold</a></div>
        <div className="ba-footer-col"><b>Make it yours</b><Link to={user ? '/dashboard' : '/register'}>Sell an item</Link><Link to="/register">Create an account</Link><Link to="/dashboard">Your collection</Link><Link to="/bids">Your bids</Link></div>
        <div className="ba-footer-col"><b>Your account</b><Link to={user ? '/profile' : '/login'}>Profile</Link><Link to="/bids">Bid history</Link><Link to="/help">Help & auction rules</Link><a href="mailto:support@bidaura.com">Contact support</a></div>
      </div><div className="ba-footer-bottom"><span>© {new Date().getFullYear()} BidAura</span><div><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/help">Help</Link></div><span>Made for the love of finding.</span></div></footer>

      <div className="ba-mobile-nav" aria-label="Mobile navigation"><a href="#explore"><Search size={18} /><span>Explore</span></a><a href="#explore" onClick={() => setActiveFilter('Live now')}><Gavel size={18} /><span>Live</span></a><Link to={user ? '/dashboard' : '/register'} className="ba-mobile-sell"><span>+</span><span>Sell</span></Link><Link to="/dashboard"><TrendingUp size={18} /><span>Dashboard</span></Link><Link to={user ? '/profile' : '/login'}><span className="ba-mobile-profile">{user?.name?.[0] || '•'}</span><span>Profile</span></Link></div>
      {toast && <div className="ba-toast" role="status"><Check size={15} />{toast}</div>}
    </div>
  );
}

export default BidAuraHome;
