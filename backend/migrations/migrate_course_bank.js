/**
 * Migration: Tạo Categories từ dữ liệu câu hỏi hiện có + set categoryId
 * 
 * Script chạy 1 lần, có thể chạy lại an toàn (idempotent).
 * Chạy: node backend/migrations/migrate_course_bank.js
 * 
 * Các bước:
 * 1. Tạo Global Categories từ câu hỏi Global Bank
 * 2. Tạo Course Categories từ câu hỏi có courseId
 * 3. Set categoryId trên tất cả câu hỏi
 * 4. Tạo indexes (nếu chưa có)
 */
const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function migrate() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME;

  if (!uri) {
    console.error("MONGO_URI không tìm thấy trong .env");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Kết nối MongoDB thành công");
    const db = client.db(dbName);

    console.log("=== MIGRATION: Course Question Bank ===\n");

    await phase1_createGlobalCategories(db);
    await phase2_createCourseCategories(db);
    await phase3_setCategoryIdOnQuestions(db);
    await phase4_createIndexes(db);

    console.log("\n=== MIGRATION HOÀN TẤT ===");
  } catch (err) {
    console.error("Migration thất bại:", err);
    process.exit(1);
  } finally {
    await client.close();
    console.log("Đã đóng kết nối MongoDB");
  }
}

/**
 * Phase 1: Tạo Global Categories
 * Lấy các giá trị category unique từ câu hỏi Global Bank (isBank=true, courseId=null)
 */
async function phase1_createGlobalCategories(db) {
  console.log("Phase 1: Tạo global categories...");

  // Lấy unique category values từ Global Bank questions
  const globalCategories = await db.collection("question").distinct("category", {
    isBank: true,
    $or: [{ courseId: null }, { courseId: { $exists: false } }]
  });

  let created = 0, skipped = 0;
  for (let i = 0; i < globalCategories.length; i++) {
    const name = globalCategories[i];
    if (!name || name.trim() === "") continue;

    const exists = await db.collection("categories").findOne({
      courseId: null, name: name.trim()
    });

    if (!exists) {
      await db.collection("categories").insertOne({
        courseId: null,
        name: name.trim(),
        description: "",
        order: i,
        createdAt: new Date()
      });
      created++;
    } else {
      skipped++;
    }
  }

  console.log(`  -> Tạo ${created} global categories, bỏ qua ${skipped} đã tồn tại`);
}

/**
 * Phase 2: Tạo Course Categories
 * Lấy các cặp (courseId, category) unique từ câu hỏi có courseId
 */
async function phase2_createCourseCategories(db) {
  console.log("Phase 2: Tạo course categories...");

  // Lấy các cặp (courseId, category) unique từ câu hỏi có courseId
  const pipeline = [
    { $match: { courseId: { $ne: null, $exists: true }, category: { $ne: null } } },
    { $group: { _id: { courseId: "$courseId", category: "$category" } } }
  ];
  const pairs = await db.collection("question").aggregate(pipeline).toArray();

  let created = 0, skipped = 0;
  for (const pair of pairs) {
    const { courseId, category } = pair._id;
    if (!category || category.trim() === "") continue;

    const exists = await db.collection("categories").findOne({
      courseId, name: category.trim()
    });

    if (!exists) {
      const maxOrder = await db.collection("categories")
        .find({ courseId }).sort({ order: -1 }).limit(1).toArray();
      const order = maxOrder.length > 0 ? maxOrder[0].order + 1 : 0;

      await db.collection("categories").insertOne({
        courseId,
        name: category.trim(),
        description: "",
        order,
        createdAt: new Date()
      });
      created++;
    } else {
      skipped++;
    }
  }

  console.log(`  -> Tạo ${created} course categories, bỏ qua ${skipped} đã tồn tại`);
}

/**
 * Phase 3: Set categoryId trên tất cả câu hỏi chưa có
 * Dựa vào trường category (string) để tìm document trong collection categories
 */
async function phase3_setCategoryIdOnQuestions(db) {
  console.log("Phase 3: Set categoryId trên câu hỏi...");

  // Lấy tất cả câu hỏi chưa có categoryId nhưng có category text
  const questions = await db.collection("question").find({
    $or: [{ categoryId: null }, { categoryId: { $exists: false } }],
    category: { $ne: null, $exists: true }
  }).toArray();

  console.log(`  Tìm thấy ${questions.length} câu hỏi cần xử lý`);

  let updated = 0, notFound = 0;
  for (const q of questions) {
    if (!q.category || q.category.trim() === "") continue;

    // Xác định courseId để tìm category phù hợp
    const courseId = q.courseId || null;
    const category = await db.collection("categories").findOne({
      courseId,
      name: q.category.trim()
    });

    if (category) {
      await db.collection("question").updateOne(
        { _id: q._id },
        { $set: { categoryId: category._id } }
      );
      updated++;
    } else {
      notFound++;
      console.log(`  Cảnh báo: Không tìm thấy category "${q.category}" cho câu hỏi #${q.id} (courseId: ${courseId})`);
    }
  }

  console.log(`  -> Cập nhật ${updated} câu hỏi, ${notFound} không tìm thấy category`);
}

/**
 * Phase 4: Tạo Indexes
 * Tất cả lệnh createIndex đều idempotent - chạy lại không lỗi
 */
async function phase4_createIndexes(db) {
  console.log("Phase 4: Tạo indexes...");

  const indexes = [
    { collection: "categories", keys: { courseId: 1, name: 1 }, options: { unique: true }, label: "categories(courseId, name) UNIQUE" },
    { collection: "categories", keys: { courseId: 1, order: 1 }, options: {}, label: "categories(courseId, order)" },
    { collection: "question", keys: { isBank: 1, courseId: 1 }, options: {}, label: "question(isBank, courseId)" },
    { collection: "question", keys: { isBank: 1, courseId: 1, categoryId: 1 }, options: {}, label: "question(isBank, courseId, categoryId)" },
  ];

  for (const idx of indexes) {
    try {
      await db.collection(idx.collection).createIndex(idx.keys, idx.options);
      console.log(`  -> Index: ${idx.label} - OK`);
    } catch (err) {
      if (err.code === 85 || err.codeName === "IndexOptionsConflict") {
        // Index đã tồn tại với tên khác (do mongodb.js tạo khi startup) → bỏ qua
        console.log(`  -> Index: ${idx.label} - Đã tồn tại, bỏ qua`);
      } else {
        throw err;
      }
    }
  }
}

migrate();
