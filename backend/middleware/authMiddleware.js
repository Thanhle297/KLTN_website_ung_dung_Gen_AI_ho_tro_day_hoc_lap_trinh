// middleware/authMiddleware.js
require("dotenv").config();
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET 

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Thiếu token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // gắn thông tin người dùng vào request
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn" });
    }
    return res.status(403).json({ message: "Token không hợp lệ" });
  }
}

module.exports = authMiddleware;
