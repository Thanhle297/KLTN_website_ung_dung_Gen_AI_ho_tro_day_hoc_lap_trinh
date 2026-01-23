const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function syncCounter() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME;

  if (!uri) {
    console.error("❌ MONGO_URI not found in .env");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    const db = client.db(dbName);

    // 1. Find max ID in question collection
    console.log("🔍 Finding max question ID...");
    const maxDoc = await db
      .collection("question")
      .find({})
      .sort({ id: -1 })
      .limit(1)
      .toArray();

    let maxId = 0;
    if (maxDoc.length > 0) {
      maxId = maxDoc[0].id;
    }
    console.log(`📊 Max existing ID is: ${maxId}`);

    // 2. Update counter
    const result = await db
      .collection("counters")
      .findOneAndUpdate(
        { _id: "question_id" },
        { $set: { seq: maxId } },
        { upsert: true, returnDocument: "after" }
      );

    console.log(
      `✅ Counter updated. Next ID will be: ${
        result.value?.seq ? result.value.seq + 1 : maxId + 1
      }`
    );
  } catch (err) {
    console.error("❌ Sync failed:", err);
  } finally {
    await client.close();
    console.log("👋 Connection closed");
  }
}

syncCounter();
