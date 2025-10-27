const express = require("express");
const { ObjectId } = require("mongodb");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Lấy thông tin user hiện tại
router.get("/me", authMiddleware, async (req, res) => {
  try {
    // console.log(">>> req.user:", req.user);
    const db = req.app.locals.db;

    // nếu không có id, trả lỗi rõ ràng
    if (!req.user || !req.user.id) {
      return res.status(400).json({ message: "Token không chứa id user" });
    }

    const user = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(req.user.id) },
        { projection: { password: 0 } }
      );

    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    res.json(user);
  } catch (err) {
    // console.error("❌ Lỗi trong /me:", err);
    res.status(500).json({ message: "Lỗi server nội bộ", error: err.message });
  }
});

// ✅ Cập nhật thông tin
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { fullname, email } = req.body;

    await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { fullname, email, updatedAt: new Date() } }
      );
    res.json({ message: "Cập nhật thành công" });
  } catch {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
