// migrations/addEnrolledCoursesToUsers.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { connectDB, getDB } = require("../config/mongodb");

async function addEnrolledCoursesField() {
  await connectDB();
  const db = getDB();

  console.log("🔄 Bắt đầu migration: Thêm field enrolledCourses cho users...");

  // Tìm tất cả user CHƯA có field enrolledCourses
  const result = await db.collection("users").updateMany(
    { enrolledCourses: { $exists: false } }, // Điều kiện: chưa có field
    { $set: { enrolledCourses: [] } } // Thêm field với giá trị []
  );

  console.log(`✅ Đã cập nhật ${result.modifiedCount} user`);
  console.log(`ℹ️  ${result.matchedCount} user được kiểm tra`);

  // Kiểm tra kết quả
  const totalUsers = await db.collection("users").countDocuments();
  const usersWithField = await db.collection("users").countDocuments({
    enrolledCourses: { $exists: true },
  });

  console.log(`\n📊 Thống kê:`);
  console.log(`   Tổng số users: ${totalUsers}`);
  console.log(`   Users có enrolledCourses: ${usersWithField}`);

  if (totalUsers === usersWithField) {
    console.log(
      `\n🎉 Migration thành công! Tất cả users đều có field enrolledCourses.`
    );
  } else {
    console.log(
      `\n⚠️  Cảnh báo: Vẫn còn ${
        totalUsers - usersWithField
      } users chưa có field enrolledCourses.`
    );
  }

  process.exit(0);
}

addEnrolledCoursesField().catch((err) => {
  console.error("❌ Lỗi migration:", err.message);
  process.exit(1);
});
