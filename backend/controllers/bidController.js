const mongoose = require('mongoose');
const Bid = require('../models/Bid');
const { BidError, placeBid } = require('../services/bidService');

exports.getBidsForAuction = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.auctionId)) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
    const bids = await Bid.find({ auction: req.params.auctionId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit);
    return res.json(bids);
  } catch (error) {
    console.error('Get Bids Error:', error);
    return res.status(500).json({ message: 'Unable to retrieve bid history' });
  }
};

exports.getMyBids = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    if (page > 100_000) return res.status(400).json({ message: 'Page is out of range' });
    const filter = { user: req.user._id };
    const [total, bids] = await Promise.all([
      Bid.countDocuments(filter),
      Bid.find(filter)
      .populate({
        path: 'auction',
        select: 'title imageUrl currentBid startingBid endTime status seller highestBidder',
        populate: [
          { path: 'seller', select: 'name avatar' },
          { path: 'highestBidder', select: 'name avatar' }
        ]
      })
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
    ]);
    res.set('X-Total-Count', String(total));
    return res.json(bids);
  } catch (error) {
    console.error('Get My Bids Error:', error);
    return res.status(500).json({ message: 'Unable to retrieve your bids' });
  }
};

exports.createBid = async (req, res) => {
  try {
    const result = await placeBid({
      auctionId: req.body.auctionId,
      bidderId: req.user._id,
      amount: Number(req.body.amount)
    });
    req.app.get('io').to(String(result.auction._id)).emit('bid_update', result);
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof BidError) return res.status(error.status).json({ message: error.message });
    console.error('Place Bid Error:', error);
    return res.status(500).json({ message: 'Unable to place bid. Please refresh the auction and try again.' });
  }
};
