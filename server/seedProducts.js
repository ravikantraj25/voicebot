/**
 * Seed Products
 * Run: node seedProducts.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const connectDB = require('./config/db');

const products = [
  {
    name: 'Sony WH-1000XM5 Wireless Headphones',
    description: 'Industry-leading noise canceling with Auto NC Optimizer. Crystal-clear hands-free calling with 4 beamforming microphones. Up to 30 hours battery life with quick charging.',
    price: 24990,
    originalPrice: 34990,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    brand: 'Sony',
    rating: 4.7,
    reviewCount: 2847,
    isFeatured: true,
    features: ['Active Noise Cancellation', '30hr Battery', 'Multipoint Connection', 'Speak-to-Chat'],
    specifications: new Map([['Driver Size', '30mm'], ['Frequency Response', '4Hz-40kHz'], ['Weight', '250g'], ['Bluetooth', '5.2']]),
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Galaxy AI is here. The most powerful Galaxy smartphone with built-in AI, a 200MP camera, and the iconic S Pen built in.',
    price: 129999,
    originalPrice: 144999,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1592950048680-e4d9f0d6b781?w=500',
    brand: 'Samsung',
    rating: 4.6,
    reviewCount: 5623,
    isFeatured: true,
    features: ['Galaxy AI', '200MP Camera', 'S Pen', 'Titanium Frame'],
    specifications: new Map([['Display', '6.8" QHD+'], ['Processor', 'Snapdragon 8 Gen 3'], ['RAM', '12GB'], ['Storage', '256GB']]),
  },
  {
    name: 'Nike Air Max 270 React',
    description: 'Taking the classic silhouette and infusing it with Nike React foam for an insanely comfortable ride. The Air Max 270 React brings together heritage and innovation.',
    price: 12995,
    originalPrice: 15995,
    category: 'clothing',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    brand: 'Nike',
    rating: 4.4,
    reviewCount: 1893,
    isFeatured: true,
    features: ['React Foam', 'Max Air Unit', 'Breathable Mesh', 'Rubber Outsole'],
  },
  {
    name: 'Apple MacBook Air M3',
    description: 'Supercharged by the M3 chip. Up to 18 hours of battery life. A stunningly thin design with a brilliant Liquid Retina display.',
    price: 114900,
    originalPrice: 119900,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
    brand: 'Apple',
    rating: 4.8,
    reviewCount: 3421,
    isFeatured: true,
    features: ['M3 Chip', '18hr Battery', 'Liquid Retina Display', 'MagSafe Charging'],
    specifications: new Map([['Chip', 'Apple M3'], ['RAM', '8GB'], ['Storage', '256GB SSD'], ['Display', '13.6" Retina']]),
  },
  {
    name: 'Levi\'s 501 Original Fit Jeans',
    description: 'The original blue jean since 1873. Levi\'s 501 jeans sit at the waist with a straight leg. A blank canvas for self-expression.',
    price: 3999,
    originalPrice: 5999,
    category: 'clothing',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
    brand: "Levi's",
    rating: 4.3,
    reviewCount: 7823,
    features: ['100% Cotton', 'Button Fly', 'Straight Leg', 'Classic Fit'],
  },
  {
    name: 'Dyson V15 Detect Vacuum',
    description: 'Reveals invisible dust with a precisely-angled laser. Counts and sizes the particles you\'re sucking up. The most powerful cordless vacuum.',
    price: 54900,
    originalPrice: 62900,
    category: 'home',
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500',
    brand: 'Dyson',
    rating: 4.6,
    reviewCount: 892,
    isFeatured: true,
    features: ['Laser Dust Detection', '60min Runtime', 'HEPA Filtration', 'LCD Screen'],
  },
  {
    name: 'The Alchemist by Paulo Coelho',
    description: 'A fable about following your dream. The Alchemist has become a modern classic, selling over 65 million copies worldwide.',
    price: 299,
    originalPrice: 499,
    category: 'books',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
    brand: 'HarperOne',
    rating: 4.5,
    reviewCount: 28493,
    features: ['International Bestseller', 'Translated in 80 Languages'],
  },
  {
    name: 'Maybelline Fit Me Foundation',
    description: 'Lightweight, natural-finish foundation that fits skin tone and texture. Oil-free formula for a poreless-looking finish.',
    price: 549,
    originalPrice: 699,
    category: 'beauty',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
    brand: 'Maybelline',
    rating: 4.2,
    reviewCount: 14521,
    features: ['Oil-Free', 'SPF 18', 'Poreless Finish', '18 Shades'],
  },
  {
    name: 'Yonex Astrox 99 Badminton Racket',
    description: 'Used by world champion Kento Momota. The Astrox 99 delivers steep and powerful attacks with its Rotational Generator System.',
    price: 16990,
    originalPrice: 19990,
    category: 'sports',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500',
    brand: 'Yonex',
    rating: 4.7,
    reviewCount: 436,
    isFeatured: true,
    features: ['Rotational Generator System', 'Nanomesh Neo', 'Head Heavy Balance'],
  },
  {
    name: 'LEGO Technic Lamborghini Sián',
    description: 'Build a detailed replica of the Lamborghini Sián FKP 37. Features a sequential 8-speed gearbox, moving pistons, and steering.',
    price: 34999,
    originalPrice: 39999,
    category: 'toys',
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=500',
    brand: 'LEGO',
    rating: 4.9,
    reviewCount: 1234,
    isFeatured: true,
    features: ['3696 Pieces', '8-Speed Gearbox', 'Moving Pistons', 'Display Stand'],
  },
  {
    name: 'boAt Airdopes 441 TWS Earbuds',
    description: 'True wireless earbuds with IWP technology, 30 hours total playback, IPX7 water resistance, and instant voice assistant support.',
    price: 1499,
    originalPrice: 4490,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=500',
    brand: 'boAt',
    rating: 4.1,
    reviewCount: 45231,
    features: ['30hr Playback', 'IPX7 Waterproof', 'Touch Controls', 'Voice Assistant'],
  },
  {
    name: 'Organic India Tulsi Green Tea',
    description: 'A unique blend of the finest Tulsi and premium green tea. Rich in antioxidants, boosts immunity, and helps relieve stress.',
    price: 249,
    originalPrice: 320,
    category: 'grocery',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500',
    brand: 'Organic India',
    rating: 4.3,
    reviewCount: 8921,
    features: ['100% Organic', 'Rich Antioxidants', 'Caffeine Free', '25 Tea Bags'],
  },
];

const seedProducts = async () => {
  try {
    await connectDB();
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');
    
    // Insert new products
    const created = await Product.insertMany(products);
    console.log(`✅ Seeded ${created.length} products successfully!`);
    
    created.forEach(p => {
      console.log(`  📦 ${p.name} — ₹${p.price} (${p.category})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedProducts();
