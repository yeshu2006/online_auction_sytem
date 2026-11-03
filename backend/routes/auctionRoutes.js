const express = require('express');
const router = express.Router();
const { createAuction, getAuctions, getAuctionById, getMyAuctions } = require('../controllers/auctionController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createAuction)
  .get(getAuctions);

router.get('/mine', protect, getMyAuctions);

router.route('/:id')
  .get(getAuctionById);

module.exports = router;
