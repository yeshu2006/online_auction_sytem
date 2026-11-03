require('dotenv').config();
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const User = require('../models/User');

const apiUrl = (process.env.SMOKE_API_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');
const categories = ['Art', 'Watches', 'Sneakers', 'Vintage', 'Electronics', 'Cars', 'Jewellery', 'Trading cards', 'Memorabilia'];
const runId = crypto.randomUUID();
const sellerEmail = `bidaura-smoke-seller-${runId}@example.invalid`;
const bidderEmail = `bidaura-smoke-bidder-${runId}@example.invalid`;
const smokeTitle = `Production smoke ${runId}`;
const createdTestAuctionIds = [];

async function request(path, { method = 'GET', token, body, expected = 200 } = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (response.status !== expected) {
    throw new Error(`${method} ${path}: expected ${expected}, received ${response.status}`);
  }
  return { data, headers: response.headers };
}

async function createAccount(email, name) {
  const { data } = await request('/api/auth/register', {
    method: 'POST',
    expected: 201,
    body: { name, email, password: crypto.randomBytes(24).toString('base64url') }
  });
  return data;
}

async function runSmokeTest() {
  const adminEmail = process.env.BIDAURA_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.BIDAURA_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error('Set BIDAURA_ADMIN_EMAIL and BIDAURA_ADMIN_PASSWORD to run production smoke checks');
  }

  await mongoose.connect(process.env.MONGO_URI);
  let seller;
  let bidder;
  let adminToken;
  let adminWatchlistId;
  try {
    const { data: health } = await request('/health');
    if (health.status !== 'ok') throw new Error('MongoDB health check did not return ok');
    console.log('PASS MongoDB readiness');

    const { data: lots } = await request('/api/auctions?limit=100');
    if (!Array.isArray(lots)) throw new Error('Auction catalogue response is not a list');
    for (const category of categories) {
      const lot = lots.find(item => item.category === category);
      if (!lot) throw new Error(`Missing seeded auction category: ${category}`);
      const { data: bids } = await request(`/api/bids/auction/${lot._id}`);
      if (!Array.isArray(bids) || bids.length < 1) throw new Error(`No recorded bid for ${category}`);
    }
    console.log('PASS public catalogue and bid history in all nine categories');

    const login = await request('/api/auth/login', {
      method: 'POST',
      expected: 200,
      body: { email: adminEmail, password: adminPassword }
    });
    adminToken = login.data.token;
    if (login.data.role !== 'admin') throw new Error('Configured account does not have the admin role');
    await request('/api/auth/profile', { token: adminToken });
    await request('/api/admin/users', { token: adminToken });
    await request('/api/watchlist', { token: adminToken });
    await request('/api/watchlist', { expected: 401 });
    const firstLot = lots.find(item => item.category === categories[0]);
    adminWatchlistId = firstLot._id;
    await request('/api/watchlist', { method: 'POST', token: adminToken, body: { auctionId: adminWatchlistId } });
    const { data: adminSaved } = await request('/api/watchlist', { token: adminToken });
    if (!adminSaved.some(item => String(item._id) === String(adminWatchlistId))) {
      throw new Error('Admin watchlist did not persist');
    }
    await request(`/api/watchlist/${adminWatchlistId}`, { method: 'DELETE', token: adminToken });
    adminWatchlistId = null;
    console.log('PASS admin login, profile, admin authorization, and JWT-protected watchlist');

    seller = await createAccount(sellerEmail, 'Production Smoke Seller');
    bidder = await createAccount(bidderEmail, 'Production Smoke Bidder');
    const { data: testLot } = await request('/api/auctions', {
      method: 'POST',
      expected: 201,
      token: seller.token,
      body: {
        title: smokeTitle,
        description: 'Temporary production smoke-test listing.',
        category: 'Collectibles',
        startingBid: 10,
        durationHours: 24
      }
    });
    createdTestAuctionIds.push(testLot._id);
    await request('/api/bids', {
      method: 'POST',
      expected: 403,
      token: seller.token,
      body: { auctionId: testLot._id, amount: 20 }
    });
    const { data: placed } = await request('/api/bids', {
      method: 'POST',
      expected: 201,
      token: bidder.token,
      body: { auctionId: testLot._id, amount: 20 }
    });
    if (Number(placed.auction.currentBid) !== 20) throw new Error('Accepted bid did not update the auction price');
    const { data: history } = await request(`/api/bids/auction/${testLot._id}`);
    if (!history.some(bid => Number(bid.amount) === 20)) throw new Error('Accepted bid was not persisted in history');
    await request('/api/watchlist', { method: 'POST', token: bidder.token, body: { auctionId: testLot._id } });
    const { data: saved } = await request('/api/watchlist', { token: bidder.token });
    if (!saved.some(item => String(item._id) === String(testLot._id))) throw new Error('Watchlist did not persist');
    await request(`/api/watchlist/${testLot._id}`, { method: 'DELETE', token: bidder.token });
    console.log('PASS registration, listing, self-bid rejection, transactional bid, bid history, and watchlist');
  } finally {
    if (mongoose.connection.readyState === 1) {
      if (adminWatchlistId && adminToken) {
        const admin = await User.findOne({ email: process.env.BIDAURA_ADMIN_EMAIL?.trim().toLowerCase() });
        if (admin) await User.updateOne({ _id: admin._id }, { $pull: { watchlist: adminWatchlistId } });
      }
      await Bid.deleteMany({ auction: { $in: createdTestAuctionIds } });
      await Auction.deleteMany({ _id: { $in: createdTestAuctionIds } });
      await User.deleteMany({ email: { $in: [sellerEmail, bidderEmail] } });
    }
    await mongoose.disconnect();
  }
}

runSmokeTest().catch(error => {
  console.error(`FAIL production smoke test: ${error.message}`);
  mongoose.disconnect().finally(() => { process.exitCode = 1; });
});
