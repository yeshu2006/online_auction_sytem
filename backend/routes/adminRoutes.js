const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Auction = require('../models/Auction');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Admin Users Error:', error);
    res.status(500).json({ message: 'Server error fetching users', error: error.message });
  }
});

router.delete('/auction/:id', protect, admin, async (req, res) => {
  try {
    const auction = await Auction.findByIdAndDelete(req.params.id);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    res.json({ message: 'Auction removed successfully' });
  } catch (error) {
    console.error('Admin Delete Auction Error:', error);
    res.status(500).json({ message: 'Server error deleting auction', error: error.message });
  }
});

module.exports = router;
