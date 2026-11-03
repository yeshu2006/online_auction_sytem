const test = require('node:test');
const assert = require('node:assert/strict');
const { BidError, validateAuctionForBid } = require('../services/bidService');

const now = Date.now();
const auction = overrides => ({
  _id: '65f000000000000000000001',
  seller: '65f000000000000000000002',
  currentBid: 100,
  endTime: new Date(now + 60_000),
  status: 'active',
  ...overrides
});
const bidderId = '65f000000000000000000003';

test('accepts a valid higher bid on a live auction', () => {
  assert.doesNotThrow(() => validateAuctionForBid(auction(), bidderId, 100.01));
});

test('rejects bids for missing auctions', () => {
  assert.throws(() => validateAuctionForBid(null, bidderId, 101), error =>
    error instanceof BidError && error.status === 404
  );
});

test('rejects bids after an auction closes', () => {
  assert.throws(() => validateAuctionForBid(auction({ endTime: new Date(now - 1) }), bidderId, 101), error =>
    error instanceof BidError && error.status === 409
  );
});

test('rejects self-bids', () => {
  assert.throws(() => validateAuctionForBid(auction(), '65f000000000000000000002', 101), error =>
    error instanceof BidError && error.status === 403
  );
});

test('rejects amounts that do not exceed the current price', () => {
  assert.throws(() => validateAuctionForBid(auction(), bidderId, 100), error =>
    error instanceof BidError && error.status === 409
  );
});

test('rejects invalid currency precision and non-finite amounts', () => {
  for (const amount of [0, -1, 100.001, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => validateAuctionForBid(auction(), bidderId, amount), BidError);
  }
});
