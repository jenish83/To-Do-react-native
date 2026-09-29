const dns = require('dns');
const mongoose = require('mongoose');

// Node on Windows can pick 127.0.0.1 as its resolver. That local resolver
// refuses Atlas SRV lookups (querySrv ECONNREFUSED) even when system DNS works.
function usePublicDnsIfLocalResolver() {
  const servers = dns.getServers();
  const localOnly = servers.length > 0 && servers.every((server) => server.startsWith('127.0.0.1'));
  if (localOnly) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
}

// Connects to MongoDB using the URI from .env
async function connectDB() {
  try {
    usePublicDnsIfLocalResolver();
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1); // no point running the API without a database
  }
}

module.exports = connectDB;
