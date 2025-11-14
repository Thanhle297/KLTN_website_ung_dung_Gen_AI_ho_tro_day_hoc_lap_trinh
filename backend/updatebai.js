// update_bai18.js
const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    await db.collection("lessons").updateOne(
      { lessonId: "bai18" },
      {
        $set: {
          mode: "group",
          display: true,
          subLessons: [
            {
              lessonId: "bai18_1",
              displayId: "Luyện tập mức độ dễ",
              title: "Phần 1",
              description: "Các lệnh vào ra cơ bản dễ",
              mode: "auto",
              display: true
            },
            {
              lessonId: "bai18_2",
              displayId: "Luyện tập",
              title: "Phần 2",
              description: "Các bài tập thực hành cơ bản",
              mode: "auto",
              display: true
            },
            {
              lessonId: "bai18_3",
              displayId: "Luyện tập nâng cao",
              title: "Phần nâng cao",
              description: "Bài tập nâng cao",
              mode: "auto",
              display: true
            },
            {
              lessonId: "bai18_4",
              displayId: "Luyện tập nâng cao",
              title: "Phần nâng cao",
              description: "Bài tập linh động",
              mode: "simple",
              display: true
            }
          ]
        }
      }
    );

    console.log("Đã cập nhật bài 18 thành group + 3 subLessons.");
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
