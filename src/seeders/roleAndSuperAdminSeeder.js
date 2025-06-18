const bcrypt = require('bcryptjs');
const connectDB = require('../config/db'); 
const Role = require('../models/role'); 
const User = require('../models/user'); 
const dotenv = require('dotenv');


dotenv.config();

const roles = ['Admin', 'Super Admin', 'User'];
const defaultSuperAdmin = {
  username: 'superadmin',
  email: 'superadmin@yopmail.com',
  phone: '9999999999',
  password: 'SuperAdmin@123',
};

const seedData = async () => {
    try {
    await connectDB();

    // 1. Seed roles
    let superAdminRole;
    for (const roleName of roles) {
      let role = await Role.findOne({ name: roleName });
      if (!role) {
        role = await Role.create({ name: roleName });
        console.log(`✅ Created role: ${roleName}`);
      } else {
        console.log(`ℹ️ Role already exists: ${roleName}`);
      }
      if (role.name === 'Super Admin') {
        superAdminRole = role;
      }
    }

    // 2. Seed Super Admin user
    const existingUser = await User.findOne({ email: defaultSuperAdmin.email });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(defaultSuperAdmin.password, 10);
      await User.create({
        ...defaultSuperAdmin,
        password: hashedPassword,
        role: superAdminRole._id,
      });
      console.log(`✅ Super Admin user created: ${defaultSuperAdmin.email}`);
    } else {
      console.log(`ℹ️ Super Admin user already exists: ${defaultSuperAdmin.email}`);
    }

    console.log('🎉 Seeding complete.');
    process.exit();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
