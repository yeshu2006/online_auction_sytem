require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { verifyToken } = require('./middleware/authMiddleware');
const { BidError, placeBid } = require('./services/bidService');
const Auction = require('./models/Auction');

if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI must be configured before starting the backend');
}
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured before starting the backend');
}

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  exposedHeaders: ['X-Total-Count']
};

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  return next();
});
app.use(express.json({ limit: '100kb' }));

app.set('io', io);

// Basic test route
app.get('/', (req, res) => {
  res.send('API is running...');
});
app.get('/health', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  return res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'unavailable' });
});
const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const bidRoutes = require('./routes/bidRoutes');
const adminRoutes = require('./routes/adminRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/admin', adminRoutes);
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ message: 'Request body must contain valid JSON' });
  }
  console.error('Unhandled API Error:', error);
  return res.status(500).json({ message: 'Unexpected server error' });
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next();

  try {
    socket.user = await verifyToken(token);
    if (!socket.user) return next(new Error('Account no longer exists'));
    return next();
  } catch {
    return next(new Error('Invalid or expired authentication token'));
  }
});

io.on('connection', (socket) => {
  socket.on('join_auction', async (auctionId, acknowledge) => {
    try {
      if (!mongoose.isValidObjectId(auctionId)) {
        if (typeof acknowledge === 'function') acknowledge({ ok: false, message: 'Invalid auction' });
        return;
      }
      const auction = await Auction.findById(auctionId).select('_id status endTime');
      if (!auction) {
        if (typeof acknowledge === 'function') acknowledge({ ok: false, message: 'Auction not found' });
        return;
      }
      socket.join(String(auction._id));
      if (typeof acknowledge === 'function') acknowledge({ ok: true, auctionId: String(auction._id) });
    } catch (err) {
      console.error('Join Auction Error:', err);
      if (typeof acknowledge === 'function') acknowledge({ ok: false, message: 'Unable to join auction room' });
    }
  });

  socket.on('place_bid', async (data, acknowledge) => {
    const reply = typeof acknowledge === 'function' ? acknowledge : () => {};
    if (!socket.user) {
      reply({ ok: false, message: 'Sign in to place a bid' });
      return;
    }

    try {
      const result = await placeBid({
        auctionId: data?.auctionId,
        bidderId: socket.user._id,
        amount: Number(data?.amount)
      });
      io.to(String(result.auction._id)).emit('bid_update', result);
      reply({ ok: true, ...result });
    } catch (error) {
      if (error instanceof BidError) {
        reply({ ok: false, message: error.message, status: error.status });
        return;
      }
      console.error('Socket Place Bid Error:', error);
      reply({ ok: false, message: 'Unable to place bid. Refresh the auction and try again.' });
    }
  });
});

const PORT = process.env.PORT || 5000;
const closeExpiredAuctions = async () => {
  try {
    const now = new Date();
    const expiredAuctions = await Auction.find({ status: 'active', endTime: { $lte: now } })
      .select('_id')
      .limit(100);

    for (const expired of expiredAuctions) {
      const closed = await Auction.findOneAndUpdate({
        _id: expired._id,
        status: 'active',
        endTime: { $lte: now }
      }, { $set: { status: 'closed' } }, { returnDocument: 'after' }).select('_id currentBid highestBidder');
      if (closed) {
        io.to(String(closed._id)).emit('auction_closed', {
          auctionId: String(closed._id),
          currentBid: closed.currentBid,
          highestBidder: closed.highestBidder
        });
      }
    }
  } catch (error) {
    console.error('Auction lifecycle update failed:', error);
  }
};
let auctionLifecycleTimer;

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other backend process or set a different PORT.`);
  } else {
    console.error('Backend server failed to start:', error);
  }
  mongoose.disconnect().catch((disconnectError) => {
    console.error('Failed to disconnect from MongoDB after server startup error:', disconnectError);
  }).finally(() => {
    process.exitCode = 1;
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      closeExpiredAuctions();
      auctionLifecycleTimer = setInterval(closeExpiredAuctions, 30_000);
      auctionLifecycleTimer.unref();
    });
  })
  .catch((error) => {
    console.error('Backend startup failed:', error);
    process.exitCode = 1;
  });

const shutdown = () => {
  if (auctionLifecycleTimer) clearInterval(auctionLifecycleTimer);
  io.close(() => {
    mongoose.disconnect().catch((error) => {
      console.error('Failed to disconnect from MongoDB during shutdown:', error);
      process.exitCode = 1;
    });
  });
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
