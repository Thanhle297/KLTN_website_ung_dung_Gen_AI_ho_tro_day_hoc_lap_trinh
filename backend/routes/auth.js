// routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { getDB } = require("../config/mongodb");

const JWT_SECRET = process.env.JWT_SECRET;

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = getDB();
    const user = await db.collection("users").findOne({ username });

    if (!user)
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    if (!user.isActive)
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Sai mật khẩu" });

    // Tạo sessionId unique cho phiên đăng nhập
    const sessionId = uuidv4();
    const now = new Date();
    const tokenExpiry = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 giờ

    const token = jwt.sign(
      { 
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        fullname: user.fullname,
        sessionId,
      },
      JWT_SECRET,
      { expiresIn: "2h" },
    );

    // Ghi nhận phiên đăng nhập vào login_sessions
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    await db.collection("login_sessions").insertOne({
      userId: user._id,
      username: user.username,
      fullname: user.fullname,
      role: user.role,
      loginAt: now,
      logoutAt: null,
      logoutType: null,
      duration: null,
      ipAddress,
      userAgent,
      tokenExpiry,
      sessionId,
    });

    // Trả về field phù hợp theo role
    const responseData = {
      message: "Đăng nhập thành công",
      token,
      fullname: user.fullname,
      role: user.role,
      userId: user._id.toString(),
    };

    if (user.role === "teacher") {
      responseData.teachingCourses = user.teachingCourses || [];
    } else {
      responseData.enrolledCourses = user.enrolledCourses || [];
    }

    res.json(responseData);
  } catch (err) {
    console.error("❌ Lỗi đăng nhập:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
