const { MongoClient } = require("mongodb");
require("dotenv").config();

let db;

const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    console.log("✅ MongoDB connected: " + process.env.DB_NAME);
    db = client.db(process.env.DB_NAME);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) throw new Error("❌ Database not initialized. Hãy gọi connectDB() trước!");
  return db;
};

module.exports = { connectDB, getDB };
