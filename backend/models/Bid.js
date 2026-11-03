const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  auction: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
    validate: {
      validator: value => Math.round(value * 100) / 100 === value,
      message: 'Bid amounts support up to two decimal places'
    }
  },
}, { timestamps: true });

bidSchema.index({ auction: 1, createdAt: -1 });
bidSchema.index({ user: 1, createdAt: -1 });

const Bid = mongoose.model('Bid', bidSchema);
module.exports = Bid;
