require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

app.set('io', io);

// Basic test route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Routes
const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const bidRoutes = require('./routes/bidRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/admin', adminRoutes);

const Auction = require('./models/Auction');
const Bid = require('./models/Bid');
const User = require('./models/User');

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_auction', (auctionId) => {
    socket.join(auctionId);
    console.log(`User ${socket.id} joined auction ${auctionId}`);
  });

  socket.on('place_bid', async (data) => {
    try {
      const { auctionId, userId, amount } = data;
      const auction = await Auction.findById(auctionId);
      if (!auction) return;
      if (amount <= auction.currentBid) return;

      const bid = new Bid({
        auction: auctionId,
        user: userId,
        amount
      });
      await bid.save();

      auction.currentBid = amount;
      auction.highestBidder = userId;
      await auction.save();

      const populatedBid = await Bid.findById(bid._id).populate('user', 'name avatar');
      io.to(auctionId).emit('bid_update', { auction, newBid: populatedBid });
    } catch (err) {
      console.error('Error placing bid:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
