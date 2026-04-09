const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, default: '' }, // Optional image URL
  startingBid: { type: Number, required: true },
  currentBid: { type: Number, default: function() { return this.startingBid; } },
  highestBidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  endTime: { type: Date, required: true },
  status: { type: String, enum: ['active', 'closed'], default: 'active' }
}, { timestamps: true });

// Auto-close past auctions
auctionSchema.methods.checkStatus = function() {
  if (this.endTime < new Date() && this.status === 'active') {
    this.status = 'closed';
  }
  return this.status;
};

const Auction = mongoose.model('Auction', auctionSchema);
module.exports = Auction;
