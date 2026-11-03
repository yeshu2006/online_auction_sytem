const express = require('express');
const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
const auctionFields = 'title description category imageUrl startingBid currentBid bidCount endTime status seller highestBidder';

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'watchlist',
        select: auctionFields,
        populate: [
          { path: 'seller', select: 'name avatar' },
          { path: 'highestBidder', select: 'name' }
        ]
      });
    return res.json((user?.watchlist || []).filter(Boolean));
  } catch (error) {
    console.error('Get Watchlist Error:', error);
    return res.status(500).json({ message: 'Unable to retrieve your watchlist' });
  }
});

router.post('/', async (req, res) => {
  const auctionId = req.body?.auctionId;
  if (!mongoose.isValidObjectId(auctionId)) {
    return res.status(400).json({ message: 'A valid auction ID is required' });
  }

  try {
    const exists = await Auction.exists({ _id: auctionId });
    if (!exists) return res.status(404).json({ message: 'Auction not found' });
    await User.updateOne({ _id: req.user._id }, { $addToSet: { watchlist: auctionId } });
    return res.status(200).json({ message: 'Auction saved to your watchlist' });
  } catch (error) {
    console.error('Add Watchlist Error:', error);
    return res.status(500).json({ message: 'Unable to save this auction' });
  }
});

router.delete('/:auctionId', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.auctionId)) {
    return res.status(400).json({ message: 'A valid auction ID is required' });
  }

  try {
    await User.updateOne({ _id: req.user._id }, { $pull: { watchlist: req.params.auctionId } });
    return res.json({ message: 'Auction removed from your watchlist' });
  } catch (error) {
    console.error('Remove Watchlist Error:', error);
    return res.status(500).json({ message: 'Unable to remove this auction' });
  }
});

module.exports = router;
