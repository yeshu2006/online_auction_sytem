const express = require('express');
const router = express.Router();
const { createAuction, getAuctions, getAuctionById } = require('../controllers/auctionController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createAuction)
  .get(getAuctions);

router.route('/:id')
  .get(getAuctionById);

module.exports = router;
