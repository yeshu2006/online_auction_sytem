require('dotenv').config();
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const { placeBid } = require('../services/bidService');

const categories = [
  { name: 'Art', title: 'Color Study No. 8', description: 'Original abstract artwork on canvas, signed by the artist.', startingBid: 180, photo: 'photo-1579783902614-a3fb3927b6a5' },
  { name: 'Watches', title: 'Steel Chronograph, 1990s', description: 'Classic stainless steel chronograph, carefully preserved and fully inspected.', startingBid: 420, photo: 'photo-1523170335258-f5ed11844a49' },
  { name: 'Sneakers', title: 'Air Runner, Archive Edition', description: 'Rare collector sneakers in excellent condition with original packaging.', startingBid: 95, photo: 'photo-1542291026-7eec264c27ff' },
  { name: 'Vintage', title: 'Mid-century Lounge Chair', description: 'A restored mid-century lounge chair with original detailing.', startingBid: 350, photo: 'photo-1505693416388-ac5ce068fe85' },
  { name: 'Electronics', title: '35mm Rangefinder Camera', description: 'A well-kept film camera with a clear viewfinder and working shutter.', startingBid: 210, photo: 'photo-1516035069371-29a1b244cc32' },
  { name: 'Cars', title: 'Classic Roadster Model', description: 'A collectible classic roadster model from a private motoring collection.', startingBid: 600, photo: 'photo-1503376780353-7e6692767b70' },
  { name: 'Jewellery', title: 'Gold Pendant, Modernist', description: 'A signed modernist pendant in excellent condition, presented in its case.', startingBid: 260, photo: 'photo-1611652022419-a9419f74343d' },
  { name: 'Trading cards', title: 'First Edition Card Set', description: 'A carefully stored vintage trading-card set for collectors.', startingBid: 140, photo: 'photo-1612036782180-6f0b6cd846fe' },
  { name: 'Memorabilia', title: 'Signed Matchday Programme', description: 'An authenticated signed programme from a memorable championship match.', startingBid: 110, photo: 'photo-1461896836934-ffe607ba8211' }
];

const requiredValue = (name, value) => {
  if (!value) throw new Error(`${name} must be provided through the environment`);
  return value;
};

async function seedMarketplace() {
  if (process.env.ALLOW_MARKETPLACE_SEED !== 'YES') {
    throw new Error('Set ALLOW_MARKETPLACE_SEED=YES to confirm database changes');
  }
  const adminEmail = requiredValue('BIDAURA_ADMIN_EMAIL', process.env.BIDAURA_ADMIN_EMAIL).trim().toLowerCase();
  const adminPassword = requiredValue('BIDAURA_ADMIN_PASSWORD', process.env.BIDAURA_ADMIN_PASSWORD);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) || adminPassword.length < 8 || adminPassword.length > 128) {
    throw new Error('Admin email or password does not meet the account requirements');
  }
  requiredValue('MONGO_URI', process.env.MONGO_URI);

  await mongoose.connect(process.env.MONGO_URI);
  try {
    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      admin.name = admin.name || 'BidAura Administrator';
      admin.role = 'admin';
      admin.password = adminPassword;
      await admin.save();
    } else {
      admin = await User.create({
        name: 'BidAura Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
    }

    let seller = await User.findOne({ email: 'marketplace-seed@bidaura.local' });
    if (!seller) {
      seller = await User.create({
        name: 'BidAura Archive',
        email: 'marketplace-seed@bidaura.local',
        password: crypto.randomBytes(32).toString('hex')
      });
    }

    const now = new Date();
    let createdAuctions = 0;
    let createdBids = 0;
    for (const item of categories) {
      const title = `BidAura Archive — ${item.title}`;
      let auction = await Auction.findOne({ seller: seller._id, title });
      if (!auction) {
        auction = await Auction.create({
          title,
          description: item.description,
          category: item.name,
          imageUrl: `https://images.unsplash.com/${item.photo}?auto=format&fit=crop&w=1200&q=85`,
          startingBid: item.startingBid,
          currentBid: item.startingBid,
          endTime: new Date(now.getTime() + 72 * 60 * 60 * 1000),
          seller: seller._id,
          status: 'active'
        });
        createdAuctions += 1;
      } else if (auction.status !== 'active' || auction.endTime <= now) {
        auction.status = 'active';
        auction.endTime = new Date(now.getTime() + 72 * 60 * 60 * 1000);
        await auction.save();
      }

      const existingBid = await Bid.exists({ auction: auction._id, user: admin._id });
      if (!existingBid) {
        await placeBid({
          auctionId: auction._id,
          bidderId: admin._id,
          amount: Number(auction.currentBid) + 10
        });
        createdBids += 1;
      }
    }

    console.log(JSON.stringify({
      adminConfigured: true,
      categoriesSeeded: categories.length,
      auctionsCreated: createdAuctions,
      bidsCreated: createdBids
    }));
  } finally {
    await mongoose.disconnect();
  }
}

seedMarketplace().catch(error => {
  console.error(`Marketplace setup failed: ${error.message}`);
  mongoose.disconnect().finally(() => { process.exitCode = 1; });
});
