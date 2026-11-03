import { ArrowUpRight, Clock3 } from 'lucide-react';
import { Link } from 'react-router-dom';

const AuctionCard = ({ auction, now = 0 }) => {
  const endTime = new Date(auction.endTime);
  const isLive = auction.status === 'active' && (!now || endTime.getTime() > now);
  const remaining = endTime.getTime() - now;
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const countdown = !now
    ? endTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : days > 0
      ? `${days}d ${String(hours).padStart(2, '0')}h left`
      : `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m left`;

  return (
    <article className="auction-card">
      <Link to={`/auction/${auction._id}`} aria-label={`View ${auction.title}`} style={{ color: 'inherit', textDecoration: 'none' }}>
        <div className="auction-image">
          <img
            src={auction.imageUrl || 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1000&q=85'}
            alt={auction.title}
            loading="lazy"
          />
          <span className="lot-tag">
            {isLive && <span className="live-dot" aria-hidden="true" />}
            {isLive ? 'Live lot' : 'Auction ended'}
          </span>
        </div>
        <div className="lot-body">
          <span className="lot-category">Selected lot · No. {String(auction._id).slice(-5).toUpperCase()}</span>
          <h3 className="lot-title">{auction.title}</h3>
          <div className="lot-meta">
            <span>{auction.seller?.name || 'Private collection'}</span>
            <span><Clock3 size={12} style={{ display: 'inline', verticalAlign: '-2px' }} />{' '}
              {isLive ? countdown : 'Closed'}
            </span>
          </div>
          <div className="lot-price-row">
            <div>
              <div className="lot-price-label">Current bid</div>
              <div className="lot-price">${Number(auction.currentBid || 0).toLocaleString()}</div>
            </div>
            <span className="arrow-link">{isLive ? 'View lot' : 'Results'} <ArrowUpRight size={15} /></span>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default AuctionCard;
