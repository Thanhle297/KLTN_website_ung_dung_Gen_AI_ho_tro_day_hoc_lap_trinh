const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/coursePermission");
const {
  getCurrentUser,
  getTeachers,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateSelf,
} = require("../services/userService");

const router = express.Router();

/* ============================================
   GET USER ĐANG ĐĂNG NHẬP (/me)
=============================================== */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(400).json({ message: "Token không hợp lệ" });
    }

    const user = await getCurrentUser(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

/* ============================================
   GET ALL TEACHERS – ADMIN/TEACHER
=============================================== */
router.get("/teachers", authMiddleware, async (req, res) => {
  try {
    const teachers = await getTeachers();
    res.json(teachers);
  } catch (error) {
    console.error("❌ Get teachers error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

/* ============================================
   GET ALL USERS – ADMIN
=============================================== */
router.get("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const list = await getAllUsers();
    res.json(list);
  } catch (error) {
    console.error("❌ Get all users error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

/* ============================================
   GET ONE USER – ADMIN
=============================================== */
router.get("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    res.json(user);
  } catch (error) {
    console.error("❌ Get user error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

/* ============================================
   CREATE USER – ADMIN
=============================================== */
router.post("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { username, email, password, fullname, role, isActive } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "username, email, password là bắt buộc" });
    }

    const result = await createUser({ username, email, password, fullname, role, isActive });

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    res.json({ message: result.message });
  } catch (error) {
    console.error("❌ Create user error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

/* ============================================
   UPDATE USER – ADMIN
=============================================== */
router.put("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    await updateUser(req.params.id, req.body);
    res.json({ message: "Cập nhật user thành công" });
  } catch (error) {
    console.error("❌ Update user error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

/* ============================================
   DELETE USER – ADMIN
=============================================== */
router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.json({ message: "Xóa user thành công" });
  } catch (error) {
    console.error("❌ Delete user error:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

/* ============================================
   USER TỰ CẬP NHẬT THÔNG TIN
=============================================== */
router.put("/me/update", authMiddleware, async (req, res) => {
  try {
    await updateSelf(req.user.id, req.body);
    res.json({ message: "Cập nhật thông tin thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

module.exports = router;
