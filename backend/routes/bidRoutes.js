const express = require('express');
const router = express.Router();
const { getBidsForAuction, getMyBids, createBid } = require('../controllers/bidController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createBid);
router.get('/mine', protect, getMyBids);
router.get('/auction/:auctionId', getBidsForAuction);

module.exports = router;
