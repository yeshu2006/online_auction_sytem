import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Clock3, Gavel, Radio, Wifi, WifiOff } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import useAuctionStore from '../store/auctionStore';
import useAuthStore from '../store/authStore';
import PriceHistoryChart from '../components/PriceHistoryChart';
import { API_BASE_URL } from '../config';

const timeRemaining = endTime => {
  const difference = new Date(endTime).getTime() - Date.now();
  if (!Number.isFinite(difference) || difference <= 0) return 'Auction ended';
  const days = Math.floor(difference / 86400000);
  const hours = Math.floor((difference % 86400000) / 3600000);
  const minutes = Math.floor((difference % 3600000) / 60000);
  const seconds = Math.floor((difference % 60000) / 1000);
  return `${days ? `${days}d ` : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const AuctionDetails = () => {
  const { id } = useParams();
  const { user, token } = useAuthStore();
  const { setCurrentAuction, updateBid } = useAuctionStore();
  const socket = useMemo(() => io(API_BASE_URL, {
    autoConnect: false,
    transports: ['websocket'],
    auth: token ? { token } : {},
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
  }), [token]);
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedId, setLoadedId] = useState(null);
  const [pending, setPending] = useState(false);
  const [clock, setClock] = useState(0);
  const [connected, setConnected] = useState(false);

  const fetchAuctionData = useCallback(async () => {
    const [auctionResponse, bidsResponse] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/auctions/${id}`),
      axios.get(`${API_BASE_URL}/api/bids/auction/${id}?limit=100`)
    ]);
    setAuction(auctionResponse.data);
    setCurrentAuction(auctionResponse.data);
    const bids = Array.isArray(bidsResponse.data) ? bidsResponse.data : [];
    setBids(bids);
    return { auction: auctionResponse.data, bids };
  }, [id, setCurrentAuction]);

  useEffect(() => {
    let active = true;
    let joinRetryTimer;
    Promise.all([
      axios.get(`${API_BASE_URL}/api/auctions/${id}`),
      axios.get(`${API_BASE_URL}/api/bids/auction/${id}?limit=100`)
    ]).then(([auctionResponse, bidsResponse]) => {
      if (!active) return;
      setAuction(auctionResponse.data);
      setCurrentAuction(auctionResponse.data);
      setBids(Array.isArray(bidsResponse.data) ? bidsResponse.data : []);
    }).catch(() => {
      if (active) {
        setAuction(null);
        setIsError(true);
        setMessage('This lot could not be opened. It may have been removed or the connection is unavailable.');
      }
    }).finally(() => {
      if (active) {
        setLoading(false);
        setLoadedId(id);
      }
    });

    const handleBidUpdate = ({ auction: updatedAuction, newBid } = {}) => {
      if (!newBid || String(newBid.auction?._id || newBid.auction || id) !== String(id)) return;
      if (updatedAuction) {
        setAuction(updatedAuction);
        setCurrentAuction(updatedAuction);
      } else {
        setAuction(previous => previous ? {
          ...previous,
          currentBid: newBid.amount,
          highestBidder: newBid.user
        } : previous);
        updateBid(id, newBid.amount, newBid.user);
      }
      setBids(previous => previous.some(bid => bid._id === newBid._id)
        ? previous
        : [newBid, ...previous]);
      setIsError(false);
      setMessage(String(newBid.user?._id || newBid.user) === String(user?._id)
        ? 'Your bid is now the leading bid.'
        : 'A new bid has been placed.');
    };

    function joinRoom() {
      if (joinRetryTimer) window.clearTimeout(joinRetryTimer);
      const connectionId = socket.id;
      socket.timeout(10000).emit('join_auction', id, (error, response) => {
        if (!active || socket.id !== connectionId) return;
        if (error || !response?.ok) {
          setConnected(false);
          setIsError(true);
          setMessage(response?.message || 'Unable to join this auction room. Retrying…');
          joinRetryTimer = window.setTimeout(() => {
            if (active && socket.connected) joinRoom();
          }, 3000);
        } else if (socket.connected) {
          setConnected(true);
          setIsError(false);
          setMessage('Live connection restored. Auction state is up to date.');
          fetchAuctionData().catch(() => {
            setIsError(true);
            setMessage('Live connection restored, but the latest auction state could not be refreshed.');
          });
        }
      });
    }
    const handleDisconnect = () => {
      setConnected(false);
      if (joinRetryTimer) window.clearTimeout(joinRetryTimer);
    };
    const handleConnectError = () => {
      setConnected(false);
      setIsError(true);
      setMessage('Live connection unavailable. Reconnecting…');
    };
    const handleAuctionRemoved = ({ auctionId } = {}) => {
      if (String(auctionId) !== String(id)) return;
      setAuction(null);
      setIsError(true);
      setMessage('This auction has been removed by an administrator.');
      setLoading(false);
      setLoadedId(id);
    };
    const handleAuctionClosed = ({ auctionId, currentBid, highestBidder } = {}) => {
      if (String(auctionId) !== String(id)) return;
      setAuction(previous => previous ? {
        ...previous,
        status: 'closed',
        currentBid: currentBid ?? previous.currentBid,
        highestBidder: highestBidder ?? previous.highestBidder
      } : previous);
      setCurrentAuction(previous => previous?._id === id ? {
        ...previous,
        status: 'closed',
        currentBid: currentBid ?? previous.currentBid,
        highestBidder: highestBidder ?? previous.highestBidder
      } : previous);
      setMessage('This auction has concluded.');
    };

    socket.on('bid_update', handleBidUpdate);
    socket.on('connect', joinRoom);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('auction_removed', handleAuctionRemoved);
    socket.on('auction_closed', handleAuctionClosed);
    socket.connect();
    return () => {
      active = false;
      socket.off('bid_update', handleBidUpdate);
      socket.off('connect', joinRoom);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('auction_removed', handleAuctionRemoved);
      socket.off('auction_closed', handleAuctionClosed);
      socket.disconnect();
      if (joinRetryTimer) window.clearTimeout(joinRetryTimer);
    };
  }, [fetchAuctionData, id, setCurrentAuction, socket, updateBid, user?._id]);

  useEffect(() => {
    let interval;
    const startup = window.setTimeout(() => {
      setClock(Date.now());
      interval = window.setInterval(() => setClock(Date.now()), 1000);
    }, 0);
    return () => {
      window.clearTimeout(startup);
      if (interval) window.clearInterval(interval);
    };
  }, []);

  const isLive = useMemo(() => auction?.status === 'active' && new Date(auction.endTime).getTime() > clock, [auction, clock]);
  const isSeller = String(auction?.seller?._id || auction?.seller) === String(user?._id);

  const handlePlaceBid = async event => {
    event.preventDefault();
    setMessage('');
    const amount = Number(bidAmount);
    if (!user || !token) {
      setIsError(true);
      setMessage('Sign in to take part in the bidding.');
      return;
    }
    if (!isLive) {
      setIsError(true);
      setMessage('Bidding has closed for this lot.');
      return;
    }
    if (isSeller) {
      setIsError(true);
      setMessage('You cannot bid on a lot you have listed.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= Number(auction.currentBid)) {
      setIsError(true);
      setMessage(`Your bid must be greater than $${Number(auction.currentBid).toLocaleString()}.`);
      return;
    }
    setIsError(false);
    setPending(true);
    setMessage(connected ? 'Submitting your bid…' : 'Submitting your bid. Live updates will resume when the room reconnects…');
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/bids`, {
        auctionId: id,
        amount
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      });
      setAuction(data.auction);
      setCurrentAuction(data.auction);
      if (data.newBid) {
        setBids(previous => previous.some(bid => bid._id === data.newBid._id)
          ? previous
          : [data.newBid, ...previous]);
      }
      setIsError(false);
      setMessage('Your bid was accepted.');
      setBidAmount('');
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      if (serverMessage) {
        setIsError(true);
        setMessage(serverMessage);
      } else {
        try {
          const latest = await fetchAuctionData();
          const bidWasAccepted = latest.bids.some(bid =>
            String(bid.user?._id || bid.user) === String(user._id) &&
            Number(bid.amount) === amount
          );
          setIsError(!bidWasAccepted);
          setMessage(bidWasAccepted
            ? 'Your bid was accepted. The latest auction state has been restored.'
            : 'We could not confirm whether your bid was accepted. Check the current bid and history before trying again.');
          if (bidWasAccepted) setBidAmount('');
        } catch {
          setIsError(true);
          setMessage('We could not confirm your bid because the server is unavailable. Refresh the lot before trying again.');
        }
      }
    } finally {
      setPending(false);
    }
  };

  if (loading || loadedId !== id || !clock) return <div className="loading-state" role="status">Opening the lot…</div>;
  if (!auction) {
    return <div className="page-wrap">
      <Link to="/" className="arrow-link"><ArrowLeft size={15} /> Return to catalogue</Link>
      <div className="error-banner" role="alert">{message || 'This auction could not be found.'}</div>
    </div>;
  }

  return (
    <div className="page-wrap">
      <Link to="/" className="arrow-link" style={{ marginBottom: 23 }}><ArrowLeft size={15} /> Back to the catalogue</Link>
      <div className="auction-detail-grid">
        <section className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <img
            className="auction-detail-image"
            src={auction.imageUrl || 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1400&q=85'}
            alt={auction.title}
          />
          <div className="auction-detail-body">
            <div className="eyebrow">Lot no. {String(auction._id).slice(-6).toUpperCase()} &nbsp;·&nbsp; {auction.seller?.name || 'Private collection'}</div>
            <h1>{auction.title}</h1>
            <p className="body-copy" style={{ whiteSpace: 'pre-wrap' }}>{auction.description}</p>
            <div className="bid-summary">
              <div><span>Current bid</span><strong>${Number(auction.currentBid || 0).toLocaleString()}</strong></div>
              <div><span>{isLive ? 'Time remaining' : 'Auction status'}</span><strong>{isLive ? timeRemaining(auction.endTime) : 'Concluded'}</strong></div>
            </div>
            <div className="auction-live-state">
              <span className={connected ? 'connection-pill connected' : 'connection-pill'}>
                {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
                {connected ? 'Live connection' : 'Reconnecting'}
              </span>
              <span className="mono muted" style={{ fontSize: '.68rem' }}>
              Starting bid &nbsp; ${Number(auction.startingBid || 0).toLocaleString()}
              &nbsp;&nbsp;·&nbsp;&nbsp; Closes {new Date(auction.endTime).toLocaleString()}
              </span>
            </div>

            {message && (
              <div className={`notice${isError ? ' notice-error' : ''}`} role={isError ? 'alert' : 'status'} style={{ marginTop: 18 }}>
                {message}
              </div>
            )}

            {isLive && !isSeller && (
              user ? (
                <form onSubmit={handlePlaceBid} style={{ marginTop: 22 }}>
                  <label className="form-label" htmlFor="bid-amount">Your bid (USD)</label>
                  <div className="bid-row">
                    <input
                      id="bid-amount"
                      className="clean-input"
                      type="number"
                      min={Number(auction.currentBid) + 0.01}
                      step="0.01"
                      value={bidAmount}
                      onChange={event => setBidAmount(event.target.value)}
                      placeholder={`Above $${Number(auction.currentBid).toLocaleString()}`}
                      required
                      disabled={pending}
                    />
                    <button className="btn-primary" type="submit" disabled={pending}>
                      <Gavel size={15} /> {pending ? 'Awaiting room…' : 'Place bid'}
                    </button>
                  </div>
                  <p className="muted" style={{ margin: '10px 0 0', fontSize: '.68rem' }}>
                    Demo auction only. No real payment is taken.
                  </p>
                </form>
              ) : (
                <div className="notice" style={{ marginTop: 20 }}>
                  <Link to="/login" style={{ color: 'var(--gold)' }}>Sign in</Link> to place a bid on this lot.
                </div>
              )
            )}
            {isSeller && isLive && <div className="notice" style={{ marginTop: 20 }}>This is your lot. You can follow the bidding, but cannot bid on it.</div>}
            {!isLive && <div className="notice" style={{ marginTop: 20 }}>Bidding has closed for this lot.</div>}
          </div>
        </section>

        <aside className="auction-side-column">
          <PriceHistoryChart startingBid={auction.startingBid} bids={bids} />
          <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow"><Radio size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> &nbsp;Auction room</div>
              <h2 style={{ marginTop: 6 }}>Bid history</h2>
            </div>
            {isLive && <span className="lot-tag" style={{ position: 'static' }}><span className="live-dot" /> LIVE</span>}
          </div>
          <div className="bid-list">
            {bids.length ? bids.map(bid => (
              <div className="bid-list-item" key={bid._id}>
                <div>
                  <div className="bidder">{bid.user?.name || 'Collector'}</div>
                  <div className="bid-time"><Clock3 size={11} style={{ display: 'inline', verticalAlign: '-1px' }} />{' '}
                    {new Date(bid.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="bid-amount">${Number(bid.amount).toLocaleString()}</div>
              </div>
            )) : (
              <div className="empty-state" style={{ padding: '34px 14px' }}>
                <h3>The room is open</h3>
                <p>No bids have been placed yet. The first bid sets the tone.</p>
              </div>
            )}
          </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default AuctionDetails;
