const { MongoClient } = require("mongodb");
require("dotenv").config();

let db;

const connectDB = async (app = null) => {
  try {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    db = client.db(process.env.DB_NAME);
    console.log("✅ MongoDB connected:", process.env.DB_NAME);

    if (app) app.locals.db = db; // ✅ gắn luôn vào app nếu có
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
