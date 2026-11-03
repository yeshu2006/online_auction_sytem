const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 4000 },
  category: { type: String, trim: true, maxlength: 60, default: 'Collectibles' },
  imageUrl: { type: String, default: '', maxlength: 2048 },
  startingBid: { type: Number, required: true, min: 0.01 },
  currentBid: { type: Number, default: function() { return this.startingBid; } },
  bidCount: { type: Number, default: 0 },
  highestBidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  endTime: { type: Date, required: true, index: true },
  status: { type: String, enum: ['active', 'closed'], default: 'active' }
}, { timestamps: true });

auctionSchema.index({ status: 1, endTime: 1, createdAt: -1 });
auctionSchema.index({ title: 'text', description: 'text' });

// Auto-close past auctions
auctionSchema.methods.checkStatus = function() {
  if (this.endTime < new Date() && this.status === 'active') {
    this.status = 'closed';
  }
  return this.status;
};

const Auction = mongoose.model('Auction', auctionSchema);
module.exports = Auction;
