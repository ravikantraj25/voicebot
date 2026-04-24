require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');

const seedOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding...');

    const mockOrders = [
      {
        phoneNumber: '+919876543210',
        language: 'english',
        status: 'pending',
        productName: 'Wireless Bluetooth Headphones',
        productQty: 2,
        productPrice: 1499,
      },
      {
        phoneNumber: '+919876543211',
        language: 'hindi',
        status: 'pending',
        productName: 'Running Shoes',
        productQty: 1,
        productPrice: 3499,
      },
      {
        phoneNumber: '+919876543212',
        language: 'kannada',
        status: 'pending',
        productName: 'Smart Fitness Watch',
        productQty: 1,
        productPrice: 2999,
      },
      {
        phoneNumber: '+919876543213',
        language: 'marathi',
        status: 'pending',
        productName: 'Stainless Steel Water Bottle (1L)',
        productQty: 3,
        productPrice: 450,
      },
      {
        phoneNumber: '+919876543214',
        language: 'hindi',
        status: 'pending',
        productName: 'Cotton T-Shirt Pack of 3',
        productQty: 1,
        productPrice: 999,
      }
    ];

    await Order.insertMany(mockOrders);
    console.log(`✅ Successfully seeded ${mockOrders.length} realistic mock orders!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedOrders();
