const Bid = require('../models/Bid');

exports.getBidsForAuction = async (req, res) => {
  try {
    const bids = await Bid.find({ auction: req.params.auctionId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(bids);
  } catch (error) {
    console.error('Get Bids Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
