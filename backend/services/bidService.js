const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');

const localLocks = new Map();

class BidError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const withLocalAuctionLock = async (auctionId, operation) => {
  const previous = localLocks.get(auctionId) || Promise.resolve();
  let release;
  const current = new Promise(resolve => { release = resolve; });
  localLocks.set(auctionId, current);
  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (localLocks.get(auctionId) === current) localLocks.delete(auctionId);
  }
};

const validateAuctionForBid = (auction, bidderId, amount) => {
  if (!auction) throw new BidError('Auction not found', 404);
  if (auction.status !== 'active' || new Date(auction.endTime).getTime() <= Date.now()) {
    throw new BidError('Bidding has ended for this auction', 409);
  }
  if (String(auction.seller) === String(bidderId)) {
    throw new BidError('You cannot bid on your own auction', 403);
  }
  if (!Number.isFinite(amount) || amount <= 0 || Math.round(amount * 100) / 100 !== amount) {
    throw new BidError('Bid must be a positive amount with at most two decimal places');
  }
  if (amount <= Number(auction.currentBid)) {
    throw new BidError(`Bid must be higher than the current bid of ${auction.currentBid}`, 409);
  }
};

const updateAuctionAndCreateBid = async ({ auctionId, bidderId, amount, session = null }) => {
  const auctionQuery = Auction.findById(auctionId);
  if (session) auctionQuery.session(session);
  const auction = await auctionQuery;
  validateAuctionForBid(auction, bidderId, amount);

  const previousBid = auction.currentBid;
  const previousBidder = auction.highestBidder;
  const now = new Date();
  const updateQuery = Auction.findOneAndUpdate({
    _id: auctionId,
    currentBid: previousBid,
    status: 'active',
    endTime: { $gt: now },
    seller: { $ne: bidderId }
  }, {
    $set: { currentBid: amount, highestBidder: bidderId },
    $inc: { bidCount: 1 }
  }, { returnDocument: 'after', runValidators: true });
  if (session) updateQuery.session(session);
  const updatedAuction = await updateQuery;
  if (!updatedAuction) throw new BidError('Another bid was accepted first. Refresh and try again.', 409);

  let createdBid;
  try {
    const options = session ? { session } : undefined;
    [createdBid] = await Bid.create([{ auction: auctionId, user: bidderId, amount }], options);
    await createdBid.populate('user', 'name avatar');
    await updatedAuction.populate([
      { path: 'seller', select: 'name avatar' },
      { path: 'highestBidder', select: 'name avatar' }
    ]);
    return { auction: updatedAuction, newBid: createdBid };
  } catch (error) {
    if (!session) {
      if (createdBid) await Bid.deleteOne({ _id: createdBid._id });
      await Auction.updateOne({
        _id: auctionId,
        currentBid: amount,
        highestBidder: bidderId
      }, {
        $set: { currentBid: previousBid, highestBidder: previousBidder },
        $inc: { bidCount: -1 }
      });
    }
    throw error;
  }
};

const isStandaloneTransactionError = error =>
  error?.code === 20 ||
  /Transaction numbers are only allowed|does not support transactions|replica set member or mongos/i.test(error?.message || '');

const placeBid = async ({ auctionId, bidderId, amount }) => {
  if (!mongoose.isValidObjectId(auctionId) || !mongoose.isValidObjectId(bidderId)) {
    throw new BidError('Invalid auction or bidder', 400);
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await updateAuctionAndCreateBid({ auctionId, bidderId, amount, session });
    });
    return result;
  } catch (error) {
    if (!isStandaloneTransactionError(error)) throw error;
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Production bidding requires a MongoDB replica set for transaction support');
    }
    return withLocalAuctionLock(auctionId, () =>
      updateAuctionAndCreateBid({ auctionId, bidderId, amount })
    );
  } finally {
    await session.endSession();
  }
};

module.exports = { BidError, placeBid, validateAuctionForBid };
