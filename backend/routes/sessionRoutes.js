// routes/sessionRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/coursePermission");
const {
  logoutSession,
  checkSession,
  listSessions,
  getStats,
  getOnlineUsers,
  getUserSessions,
} = require("../services/sessionService");

// POST /api/sessions/logout - Ghi nhận logout
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const { logoutType = "manual" } = req.body;
    const result = await logoutSession(req.user.sessionId, logoutType);

    if (!result.success) {
      return res.status(result.status).json({ message: result.message });
    }

    res.json({ message: result.message, duration: result.duration });
  } catch (err) {
    console.error("❌ Lỗi ghi nhận logout:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// GET /api/sessions/check - Kiểm tra phiên còn hợp lệ không
router.get("/check", authMiddleware, async (req, res) => {
  try {
    const result = await checkSession(req.user.sessionId);
    return res.json(result);
  } catch (err) {
    console.error("❌ Lỗi kiểm tra phiên:", err);
    res.status(500).json({ valid: false, reason: "server_error" });
  }
});

// GET /api/sessions - Danh sách sessions (admin only)
router.get("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await listSessions(req.query);
    res.json(result);
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách sessions:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// GET /api/sessions/stats - Thống kê login (admin only)
router.get("/stats", authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await getStats(req.query);
    res.json(result);
  } catch (err) {
    console.error("❌ Lỗi thống kê sessions:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// GET /api/sessions/online - User đang online (admin only)
router.get("/online", authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await getOnlineUsers();
    res.json(result);
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách online:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// GET /api/sessions/user/:userId - Lịch sử 1 user (admin only)
router.get("/user/:userId", authMiddleware, adminOnly, async (req, res) => {
  try {
    const result = await getUserSessions(req.params.userId, req.query);
    res.json(result);
  } catch (err) {
    console.error("❌ Lỗi lấy lịch sử user:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

module.exports = router;
