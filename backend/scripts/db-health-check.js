const mongoose = require('mongoose');

const checkDbConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('DB health check: connected');
    process.exit(0);
  } catch (err) {
    console.error('DB health check FAILED:', err.message);
    process.exit(1);
  }
};

checkDbConnection();