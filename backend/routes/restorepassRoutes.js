const express = require("express");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/* ============================================
   Middleware: chỉ admin mới được đổi mật khẩu
=============================================== */
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Chỉ admin mới có quyền truy cập" });
  }
  next();
}

/* ============================================
   ADMIN ĐỔI MẬT KHẨU USER
=============================================== */
router.put("/:id/password", authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập mật khẩu mới" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    const result = await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        {
          $set: {
            password: hashed,
            updatedAt: new Date(),
          },
        }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

module.exports = router;
