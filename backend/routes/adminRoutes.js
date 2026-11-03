const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Auction = require('../models/Auction');
const mongoose = require('mongoose');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('name email role avatar createdAt')
      .sort({ createdAt: -1 }).limit(100);
    return res.json(users);
  } catch (error) {
    console.error('Admin Users Error:', error);
    return res.status(500).json({ message: 'Unable to retrieve users' });
  }
});

router.delete('/auction/:id', protect, admin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    const auction = await Auction.findByIdAndDelete(req.params.id);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    req.app.get('io').to(String(auction._id)).emit('auction_removed', { auctionId: String(auction._id) });
    return res.json({ message: 'Auction removed successfully. Bid records are retained for account history.' });
  } catch (error) {
    console.error('Admin Delete Auction Error:', error);
    return res.status(500).json({ message: 'Unable to remove auction' });
  }
});

module.exports = router;
