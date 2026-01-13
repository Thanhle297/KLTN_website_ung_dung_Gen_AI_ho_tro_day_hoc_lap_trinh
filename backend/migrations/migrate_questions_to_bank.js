const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") }); // Adjust path to env

async function migrate() {
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
    const collection = db.collection("question");

    // 1. Fetch all questions
    const allQuestions = await collection.find().toArray();
    console.log(`📊 Found ${allQuestions.length} questions to process...`);

    let updatedCount = 0;

    // 2. Loop and update
    for (const q of allQuestions) {
      // Map topic to category, fallback to 'General'
      const category = q.category || q.topic || "General";

      await collection.updateOne(
        { _id: q._id }, // Using _id is safer
        {
          $set: {
            isBank: true,
            category: category,
          },
        }
      );
      updatedCount++;
    }

    console.log(`✅ Migration complete. Updated ${updatedCount} documents.`);
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await client.close();
    console.log("👋 Connection closed");
  }
}

migrate();
