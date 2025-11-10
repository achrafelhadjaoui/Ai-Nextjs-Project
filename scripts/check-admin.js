/**
 * Script to check and set admin role for a user
 * Run with: node scripts/check-admin.js <email>
 * Make sure MONGODB_URI is set in .env.local
 */

const mongoose = require('mongoose');
const fs = require('fs');

// Load .env.local manually
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  lines.forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      value = value.replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
} catch (error) {
}

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isVerified: Boolean,
  googleId: String,
  image: String,
  verificationToken: String,
  resetToken: String,
  resetTokenExpiry: Date,
  createdAt: Date,
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function checkAndSetAdmin(email) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    if (!email) {
      const users = await User.find({}).select('email name role');
      users.forEach(user => {
      });
      process.exit(0);
    }

    const user = await User.findOne({ email });

    if (!user) {
      process.exit(1);
    }

    if (user.role === 'admin') {
    } else {
      user.role = 'admin';
      await user.save();
    }

    await mongoose.connection.close();
  } catch (error) {
    process.exit(1);
  }
}

const email = process.argv[2];
checkAndSetAdmin(email);
