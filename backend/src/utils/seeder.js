require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User.model');

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://viraj:zenvio123@zenviodb.cyi542q.mongodb.net/?appName=zenvioDB');
    console.log('✅ Connected to MongoDB');

    const existing = await User.findOne({ email: 'admin@zenvio.io' });
    if (existing) {
      console.log('⚠️  Already seeded. Skipping.');
      process.exit(0);
    }

    const admin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@zenvio.io',
      phone: '+1000000000',
      password: 'Admin@12345',
      role: 'superadmin',
      status: 'active',
      emailVerified: true,
      kyc: { status: 'approved' },
      balance: 99999,
    });

    const testUser = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'user@zenvio.io',
      phone: '+1000000001',
      password: 'User@12345',
      role: 'user',
      status: 'active',
      emailVerified: true,
      kyc: { status: 'approved' },
      balance: 500,
      trustPoints: 150,
    });

    await User.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'pending@zenvio.io',
      phone: '+1000000002',
      password: 'User@12345',
      role: 'user',
      status: 'pending',
      emailVerified: true,
      kyc: {
        status: 'pending',
        submittedAt: new Date(),
        documents: [{ type: 'national_id', fileUrl: '/uploads/sample.jpg', fileName: 'sample.jpg' }],
        personalInfo: {
          dateOfBirth: new Date('1990-01-01'),
          nationality: 'American',
          address: { street: '123 Main St', city: 'New York', state: 'NY', country: 'USA', zipCode: '10001' },
        },
      },
      balance: 0,
    });

    console.log('\n✅ Zenvio seed complete!\n');
    console.log('=========================================');
    console.log('🔑 Admin Login:');
    console.log('   Email:    admin@zenvio.io');
    console.log('   Password: Admin@12345');
    console.log('\n👤 Test User Login:');
    console.log('   Email:    user@zenvio.io');
    console.log('   Password: User@12345');
    console.log(`   Account:  ${testUser.accountNumber}`);
    console.log('=========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seedData();
