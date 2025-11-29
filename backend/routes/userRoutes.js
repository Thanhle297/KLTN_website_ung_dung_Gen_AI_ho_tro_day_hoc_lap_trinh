const express = require("express");
const { ObjectId } = require("mongodb");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/* ============================================
   Middleware: Chỉ admin mới được dùng route CRUD
=============================================== */
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Chỉ admin mới có quyền truy cập" });
  }
  next();
}

/* ============================================
   GET USER ĐANG ĐĂNG NHẬP (/me)
=============================================== */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const db = req.app.locals.db;

    if (!req.user?.id) {
      return res.status(400).json({ message: "Token không hợp lệ" });
    }

    const user = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(req.user.id) },
        { projection: { password: 0 } }
      );

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
});

/* ============================================
   GET ALL USERS – ADMIN
=============================================== */
router.get("/", authMiddleware, adminOnly, async (req, res) => {
  const db = req.app.locals.db;
  const list = await db
    .collection("users")
    .find({}, { projection: { password: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  res.json(list);
});

/* ============================================
   GET ONE USER – ADMIN
=============================================== */
router.get("/:id", authMiddleware, adminOnly, async (req, res) => {
  const db = req.app.locals.db;

  const user = await db
    .collection("users")
    .findOne(
      { _id: new ObjectId(req.params.id) },
      { projection: { password: 0 } }
    );

  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy user" });
  }

  res.json(user);
});

/* ============================================
   CREATE USER – ADMIN
=============================================== */
router.post("/", authMiddleware, adminOnly, async (req, res) => {
  const db = req.app.locals.db;

  const { username, email, password, fullname, role, isActive } = req.body;

  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ message: "username, email, password là bắt buộc" });
  }

  const existed = await db.collection("users").findOne({ email });
  if (existed) return res.status(400).json({ message: "Email đã tồn tại" });

  await db.collection("users").insertOne({
    username,
    email,
    password, // nếu muốn hash, bạn cho bcrypt vào đây
    fullname: fullname || "",
    role: role || "user",
    isActive: isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  res.json({ message: "Tạo user thành công" });
});

/* ============================================
   UPDATE USER – ADMIN
=============================================== */
router.put("/:id", authMiddleware, adminOnly, async (req, res) => {
  const db = req.app.locals.db;

  const updateData = { ...req.body, updatedAt: new Date() };

  // không cho sửa _id và password từ route này
  delete updateData._id;
  delete updateData.password;

  await db
    .collection("users")
    .updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

  res.json({ message: "Cập nhật user thành công" });
});

/* ============================================
   DELETE USER – ADMIN
=============================================== */
router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  const db = req.app.locals.db;

  await db.collection("users").deleteOne({
    _id: new ObjectId(req.params.id),
  });

  res.json({ message: "Xóa user thành công" });
});

module.exports = router;
