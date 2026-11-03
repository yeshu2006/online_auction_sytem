const Auction = require('../models/Auction');
const mongoose = require('mongoose');

exports.createAuction = async (req, res) => {
  try {
    const { title, description, startingBid, durationHours, imageUrl } = req.body;
    const category = typeof req.body.category === 'string' ? req.body.category.trim() : 'Collectibles';
    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    const cleanDescription = typeof description === 'string' ? description.trim() : '';
    const price = Number(startingBid);
    const duration = Number(durationHours);
    const image = typeof imageUrl === 'string' ? imageUrl.trim() : '';
    if (!cleanTitle || cleanTitle.length > 120 || !cleanDescription || cleanDescription.length > 4000 ||
      !Number.isFinite(price) || price <= 0 || Math.round(price * 100) / 100 !== price ||
      !category || category.length > 60 ||
      !Number.isInteger(duration) || duration < 1 || duration > 720) {
      return res.status(400).json({ message: 'Enter a title, description, valid price, and duration between 1 and 720 hours.' });
    }
    if (image && (!/^https?:\/\//i.test(image) || image.length > 2048)) {
      return res.status(400).json({ message: 'Image URL must be a valid HTTP or HTTPS URL.' });
    }

    const endTime = new Date(Date.now() + duration * 60 * 60 * 1000);

    const auction = new Auction({
      title: cleanTitle,
      description: cleanDescription,
      category,
      startingBid: price,
      currentBid: price,
      endTime,
      imageUrl: image,
      seller: req.user._id,
    });

    const createdAuction = await auction.save();
    await createdAuction.populate('seller', 'name avatar');
    return res.status(201).json(createdAuction);
  } catch (error) {
    console.error('Create Auction Error:', error);
    return res.status(500).json({ message: 'Unable to create auction' });
  }
};

exports.getAuctions = async (req, res) => {
  try {
    const { status, search } = req.query;
    if (status && !['active', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid auction status' });
    }
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 100));
    if (page > 100_000) return res.status(400).json({ message: 'Page is out of range' });
    const filter = {};
    if (status) filter.status = status;
    if (typeof search === 'string' && search.trim()) {
      filter.$text = { $search: search.trim().slice(0, 100) };
    }

    const [total, auctions] = await Promise.all([
      Auction.countDocuments(filter),
      Auction.find(filter)
        .populate('seller', 'name avatar')
        .populate('highestBidder', 'name')
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
    ]);
    res.set('X-Total-Count', String(total));
    return res.json(auctions);
  } catch (error) {
    console.error('Get Auctions Error:', error);
    return res.status(500).json({ message: 'Unable to retrieve auctions' });
  }
};

exports.getMyAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find({ seller: req.user._id })
      .populate('seller', 'name avatar')
      .sort({ createdAt: -1, _id: -1 })
      .limit(100);
    return res.json(auctions);
  } catch (error) {
    console.error('Get My Auctions Error:', error);
    return res.status(500).json({ message: 'Unable to retrieve your auctions' });
  }
};

exports.getAuctionById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    const auction = await Auction.findById(req.params.id)
      .populate('seller', 'name avatar')
      .populate('highestBidder', 'name avatar');
      
    if (auction) {
      return res.json(auction);
    } else {
      return res.status(404).json({ message: 'Auction not found' });
    }
  } catch (error) {
    console.error('Get Auction By ID Error:', error);
    return res.status(500).json({ message: 'Unable to retrieve auction' });
  }
};
