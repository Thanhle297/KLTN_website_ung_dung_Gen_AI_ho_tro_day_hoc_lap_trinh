// update_echo_input_all_questions.js
const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("🚀 Đã kết nối MongoDB!");

    const db = client.db(process.env.DB_NAME);
    const questions = db.collection("question");

    // Cập nhật mọi câu hỏi chưa có echo_input
    const result = await questions.updateMany(
      { echo_input: { $exists: false } },
      { $set: { echo_input: false } }
    );

    console.log(`✅ Đã cập nhật ${result.modifiedCount} câu hỏi.`);
  } catch (err) {
    console.error("❌ Lỗi cập nhật:", err);
  } finally {
    await client.close();
    console.log("📌 Đã đóng kết nối.");
  }
}

run();
