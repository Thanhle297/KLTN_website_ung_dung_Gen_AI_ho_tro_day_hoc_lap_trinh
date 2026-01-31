const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Giả lập pepper (thực tế lấy từ process.env)
const PEPPER = "super_secret_pepper_2026";

// Hàm SHA256 + pepper
function sha256WithPepper(password) {
  return crypto
    .createHash("sha256")
    .update(password + PEPPER)
    .digest("hex");
}

async function testHash() {
  const plainPassword = "admin123";

  console.log("🔹 Password gốc:");
  console.log(plainPassword);

  // Bước 1: SHA256 + pepper
  const sha256Hash = sha256WithPepper(plainPassword);
  console.log("\n🔹 Sau SHA256(password + pepper):");
  console.log(sha256Hash);

  // Bước 2: bcrypt
  const bcryptHash = await bcrypt.hash(sha256Hash, 10);
  console.log("\n🔹 Sau bcrypt:");
  console.log(bcryptHash);

  // Test verify
  const isMatch = await bcrypt.compare(sha256Hash, bcryptHash);
  console.log("\n🔹 Verify lại (bcrypt.compare):");
  console.log(isMatch ? "✅ MATCH" : "❌ NOT MATCH");
}

testHash().catch(console.error);