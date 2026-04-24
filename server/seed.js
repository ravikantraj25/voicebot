/**
 * Database Seed Script
 * Creates 5 realistic mock orders with Indian product names
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const Order = require('./models/Order');

const MOCK_ORDERS = [
  {
    phoneNumber: '+918340286898',
    language: 'hindi',
    status: 'pending',
    productName: 'Wireless Bluetooth Headphones',
    productQty: 2,
    productPrice: 1499,
  },
  {
    phoneNumber: '+918340286898',
    language: 'english',
    status: 'pending',
    productName: 'Running Shoes (Nike Revolution)',
    productQty: 1,
    productPrice: 3499,
  },
  {
    phoneNumber: '+918340286898',
    language: 'kannada',
    status: 'pending',
    productName: 'Stainless Steel Water Bottle (1L)',
    productQty: 3,
    productPrice: 599,
  },
  {
    phoneNumber: '+918340286898',
    language: 'marathi',
    status: 'pending',
    productName: 'Cotton Bedsheet Set (Double Bed)',
    productQty: 1,
    productPrice: 1299,
  },
  {
    phoneNumber: '+918340286898',
    language: 'hindi',
    status: 'pending',
    productName: 'Organic Green Tea (100 Bags)',
    productQty: 2,
    productPrice: 449,
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding database with mock orders...\n');

    // Clear existing pending orders (optional)
    const deleted = await Order.deleteMany({ status: 'pending' });
    console.log(`🗑️  Cleared ${deleted.deletedCount} existing pending orders`);

    // Insert mock orders
    const created = await Order.insertMany(MOCK_ORDERS);
    console.log(`✅ Created ${created.length} mock orders:\n`);

    created.forEach((order, i) => {
      console.log(
        `  ${i + 1}. ${order.productQty}x ${order.productName} — ₹${order.productPrice} (${order.language})`
      );
    });

    console.log('\n🎉 Seed complete! Ready for demo.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedDatabase();
