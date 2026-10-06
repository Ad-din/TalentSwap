const mongoose = require('mongoose');
const dns = require('dns');

// On some Windows setups (certain routers, VPNs, or ISP resolvers), the UDP
// SRV-record lookup that `mongodb+srv://` URIs depend on gets silently
// blocked even though normal DNS works fine - it surfaces as
// "querySrv ECONNREFUSED". Forcing a public DNS resolver works around it.
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri);
    console.log(`[db] Connected to MongoDB: ${mongoose.connection.name}`);
  } catch (err) {
    console.error('[db] MongoDB connection error:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected');
  });
}

module.exports = connectDB;
