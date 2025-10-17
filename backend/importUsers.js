// importUsers.js
const fs = require("fs");
const csv = require("csv-parser");
const bcrypt = require("bcryptjs");
const { connectDB, getDB } = require("./config/mongodb");

async function importUsers() {
  await connectDB();
  const db = getDB();
  const users = [];

  fs.createReadStream("10T1.csv")
    .pipe(
      csv({
        separator: ";", // file dùng dấu chấm phẩy
        headers: ["username", "email", "password", "role", "fullname", "isActive"],
        skipLines: 1,   // bỏ dòng tiêu đề gốc
      })
    )
    .on("data", (row) => users.push(row))
    .on("end", async () => {
      for (const u of users) {
        if (!u.username || !u.password) continue;

        const hashed = await bcrypt.hash(u.password, 10);

        await db.collection("users").insertOne({
          username: u.username.trim(),
          email: u.email.trim(),
          password: hashed,
          role: u.role?.trim() || "user",
          fullname: u.fullname.trim(),
          isActive: u.isActive === "true",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      console.log(`✅ Đã import ${users.length} người dùng.`);
      process.exit(0);
    });
}

importUsers().catch((err) => {
  console.error("❌ Lỗi import:", err.message);
  process.exit(1);
});
