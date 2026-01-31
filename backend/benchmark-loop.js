const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const PEPPER = "super_secret_pepper_2026";
const SALT_ROUNDS = 10;
const ATTEMPTS = 100;

function sha256WithPepper(password) {
  return crypto
    .createHash("sha256")
    .update(password + PEPPER)
    .digest("hex");
}

async function benchmarkLoop() {
  const realPassword = "admin123";
  const sha = sha256WithPepper(realPassword);
  const bcryptHash = await bcrypt.hash(sha, SALT_ROUNDS);

  const start = Date.now();

  for (let i = 0; i < ATTEMPTS; i++) {
    const guess = "admi" + i; // password đoán
    const guessSha = sha256WithPepper(guess);
    await bcrypt.compare(guessSha, bcryptHash);
  }

  const end = Date.now();

  console.log(`🔁 ${ATTEMPTS} lần thử`);
  console.log(`⏱️ Tổng thời gian: ${end - start} ms`);
  console.log(
    `⚡ Trung bình mỗi lần: ${((end - start) / ATTEMPTS).toFixed(2)} ms`
  );
}

benchmarkLoop();