// routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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

    const token = jwt.sign(
      { 
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        fullname: user.fullname,
      },
      JWT_SECRET,
      { expiresIn: "2h" },
    );

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
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
