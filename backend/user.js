const bcrypt = require("bcryptjs");
const { connectDB, getDB } = require("./config/mongodb");

async function createUser() {
  await connectDB();
  const db = getDB();

  const hashed = await bcrypt.hash("admin123", 10);

  await db.collection("users").insertOne({
    username: "thanhle",
    email: "thanhle01112004@gmail.com",
    password: hashed,
    role: "admin", // hoặc "admin"
    fullname: "Lê Quang Thành",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("✅ Tạo user thành công!");
  process.exit(0);
}

createUser().catch((err) => {
  console.error("❌ Lỗi:", err.message);
  process.exit(1);
});
