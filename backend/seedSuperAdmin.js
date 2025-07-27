const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://navneet:navneet%40315@cluster0.edecrl2.mongodb.net/saascrm';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const email = 'superadmin@example.com';
    const password = 'superadmin123';
    const name = 'Super Admin';

    // Check if superadmin already exists
    const exists = await User.findOne({ email });
    if (exists) {
      console.log('Superadmin already exists.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'superadmin'
    });
    await user.save();
    console.log('Superadmin created:', { email, password });
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
