const bcrypt = require("bcryptjs");
const { connectDB, getDB } = require("./config/mongodb");

async function createUser() {
  await connectDB();
  const db = getDB();

  const hashed = await bcrypt.hash("giaovien123", 10);

  await db.collection("users").insertOne({
    username: "giaovien",
    email: "example@gmail.com",
    password: hashed,
    role: "admin", // hoặc "user"
    fullname: "Nguyễn Trung Khánh",
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
