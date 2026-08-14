const mongoose = require("mongoose");

// Serverless functions can be invoked many times against the same warm
// instance. Without caching, every request would open a brand new MongoDB
// connection, which quickly exhausts your connection pool. This reuses the
// existing connection (or in-flight connection attempt) across invocations.
let cached = global._mongooseConn;
if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI).then((m) => {
      console.log("MongoDB connected");
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("Database connection failed:", error.message);
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;