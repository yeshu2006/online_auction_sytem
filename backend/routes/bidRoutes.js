const express = require('express');
const router = express.Router();
const { getBidsForAuction } = require('../controllers/bidController');

router.get('/auction/:auctionId', getBidsForAuction);

module.exports = router;
