const Auction = require('../models/Auction');

exports.createAuction = async (req, res) => {
  try {
    const { title, description, startingBid, durationHours, imageUrl } = req.body;

    const endTime = new Date();
    endTime.setHours(endTime.getHours() + parseInt(durationHours));

    const auction = new Auction({
      title,
      description,
      startingBid,
      currentBid: startingBid,
      endTime,
      imageUrl,
      seller: req.user._id,
    });

    const createdAuction = await auction.save();
    res.status(201).json(createdAuction);
  } catch (error) {
    console.error('Create Auction Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAuctions = async (req, res) => {
  try {
    // Only get active auctions or all based on query
    const status = req.query.status;
    const filter = status ? { status } : {};
    
    const auctions = await Auction.find(filter)
      .populate('seller', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(auctions);
  } catch (error) {
    console.error('Get Auctions Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAuctionById = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('seller', 'name avatar')
      .populate('highestBidder', 'name avatar');
      
    if (auction) {
      res.json(auction);
    } else {
      res.status(404).json({ message: 'Auction not found' });
    }
  } catch (error) {
    console.error('Get Auction By ID Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
