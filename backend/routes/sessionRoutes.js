// routes/sessionRoutes.js
const express = require("express");
const router = express.Router();
const { getDB } = require("../config/mongodb");
const authMiddleware = require("../middleware/authMiddleware");
const { ObjectId } = require("mongodb");

// Middleware: chỉ admin mới được truy cập
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Chỉ admin mới có quyền truy cập" });
  }
  next();
};

// Helper: tự động đánh dấu sessions đã hết hạn token nhưng chưa có logoutAt
const cleanupExpiredSessions = async (db) => {
  const now = new Date();
  // Dùng aggregation pipeline update để set logoutAt = tokenExpiry và tính duration
  await db.collection("login_sessions").updateMany(
    {
      logoutAt: null,
      tokenExpiry: { $lt: now },
    },
    [
      {
        $set: {
          logoutAt: "$tokenExpiry",
          logoutType: "token_expired",
          duration: {
            $round: [
              { $divide: [{ $subtract: ["$tokenExpiry", "$loginAt"] }, 1000] },
              0,
            ],
          },
        },
      },
    ]
  );
};

// ============================================================
// POST /api/sessions/logout - Ghi nhận logout
// ============================================================
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const { logoutType = "manual" } = req.body;
    const { sessionId } = req.user;
    const db = getDB();

    if (!sessionId) {
      return res.status(400).json({ message: "Không tìm thấy sessionId trong token" });
    }

    const now = new Date();
    const session = await db.collection("login_sessions").findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ message: "Không tìm thấy phiên đăng nhập" });
    }

    // Nếu đã logout rồi thì bỏ qua
    if (session.logoutAt) {
      return res.json({ message: "Phiên đã được đăng xuất trước đó" });
    }

    const duration = Math.round((now - session.loginAt) / 1000); // giây

    await db.collection("login_sessions").updateOne(
      { sessionId },
      {
        $set: {
          logoutAt: now,
          logoutType,
          duration,
        },
      }
    );

    res.json({ message: "Đăng xuất thành công", duration });
  } catch (err) {
    console.error("❌ Lỗi ghi nhận logout:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// ============================================================
// GET /api/sessions/check - Kiểm tra phiên còn hợp lệ không
// (Dùng cho frontend polling, phát hiện bị force_logout)
// ============================================================
router.get("/check", authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.user;
    const db = getDB();

    if (!sessionId) {
      return res.json({ valid: false, reason: "no_session" });
    }

    const session = await db
      .collection("login_sessions")
      .findOne({ sessionId }, { projection: { logoutAt: 1, logoutType: 1 } });

    if (!session) {
      return res.json({ valid: false, reason: "not_found" });
    }

    // Phiên đã bị đá bởi đăng nhập từ IP khác
    if (session.logoutType === "force_logout") {
      return res.json({ valid: false, reason: "force_logout" });
    }

    // Phiên đã logout bằng cách khác (manual, timeout, token_expired)
    if (session.logoutAt) {
      return res.json({ valid: false, reason: session.logoutType || "logged_out" });
    }

    return res.json({ valid: true });
  } catch (err) {
    console.error("❌ Lỗi kiểm tra phiên:", err);
    res.status(500).json({ valid: false, reason: "server_error" });
  }
});

// ============================================================
// GET /api/sessions - Danh sách sessions (admin only)
// ============================================================
router.get("/", authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = getDB();

    // Cleanup sessions hết hạn trước khi query
    await cleanupExpiredSessions(db);

    const {
      userId,
      username,
      role,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (userId) {
      filter.userId = new ObjectId(userId);
    }
    if (username) {
      filter.username = { $regex: username, $options: "i" };
    }
    if (role) {
      filter.role = role;
    }
    if (dateFrom || dateTo) {
      filter.loginAt = {};
      if (dateFrom) filter.loginAt.$gte = new Date(dateFrom);
      if (dateTo) {
        // dateTo là cuối ngày
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.loginAt.$lte = endDate;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [sessions, total] = await Promise.all([
      db
        .collection("login_sessions")
        .find(filter)
        .sort({ loginAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      db.collection("login_sessions").countDocuments(filter),
    ]);

    res.json({
      sessions,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách sessions:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// ============================================================
// GET /api/sessions/stats - Thống kê login (admin only)
// ============================================================
router.get("/stats", authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = getDB();
    await cleanupExpiredSessions(db);

    const { period = "day", dateFrom, dateTo } = req.query;
    const now = new Date();

    // === Thống kê tổng quan ===
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Thứ 2
    weekStart.setHours(0, 0, 0, 0);

    const [totalSessions, todayCount, weekCount, onlineCount, avgDuration] =
      await Promise.all([
        db.collection("login_sessions").countDocuments(),
        db.collection("login_sessions").countDocuments({
          loginAt: { $gte: todayStart, $lte: todayEnd },
        }),
        db.collection("login_sessions").countDocuments({
          loginAt: { $gte: weekStart },
        }),
        db.collection("login_sessions").countDocuments({
          logoutAt: null,
          tokenExpiry: { $gt: now },
        }),
        db
          .collection("login_sessions")
          .aggregate([
            { $match: { duration: { $ne: null } } },
            { $group: { _id: null, avg: { $avg: "$duration" } } },
          ])
          .toArray(),
      ]);

    // === Thống kê theo thời gian (biểu đồ) ===
    let chartDateFrom, chartDateTo;

    if (dateFrom && dateTo) {
      chartDateFrom = new Date(dateFrom);
      chartDateTo = new Date(dateTo);
      chartDateTo.setHours(23, 59, 59, 999);
    } else if (period === "week") {
      // 4 tuần gần nhất
      chartDateFrom = new Date(now);
      chartDateFrom.setDate(now.getDate() - 28);
      chartDateFrom.setHours(0, 0, 0, 0);
      chartDateTo = now;
    } else {
      // 7 ngày gần nhất
      chartDateFrom = new Date(now);
      chartDateFrom.setDate(now.getDate() - 6);
      chartDateFrom.setHours(0, 0, 0, 0);
      chartDateTo = now;
    }

    let groupBy;
    if (period === "week") {
      groupBy = {
        year: { $isoWeekYear: "$loginAt" },
        week: { $isoWeek: "$loginAt" },
      };
    } else {
      groupBy = {
        year: { $year: "$loginAt" },
        month: { $month: "$loginAt" },
        day: { $dayOfMonth: "$loginAt" },
      };
    }

    const chartData = await db
      .collection("login_sessions")
      .aggregate([
        {
          $match: {
            loginAt: { $gte: chartDateFrom, $lte: chartDateTo },
          },
        },
        {
          $group: {
            _id: groupBy,
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: "$userId" },
            avgDuration: { $avg: "$duration" },
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            uniqueUsers: { $size: "$uniqueUsers" },
            avgDuration: { $round: ["$avgDuration", 0] },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    res.json({
      overview: {
        totalSessions,
        todayCount,
        weekCount,
        onlineCount,
        avgDuration: avgDuration[0]?.avg
          ? Math.round(avgDuration[0].avg)
          : 0,
      },
      chartData,
      period,
    });
  } catch (err) {
    console.error("❌ Lỗi thống kê sessions:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// ============================================================
// GET /api/sessions/online - User đang online (admin only)
// ============================================================
router.get("/online", authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = getDB();
    const now = new Date();

    const onlineUsers = await db
      .collection("login_sessions")
      .find({
        logoutAt: null,
        tokenExpiry: { $gt: now },
      })
      .sort({ loginAt: -1 })
      .toArray();

    res.json({ onlineUsers, count: onlineUsers.length });
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách online:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

// ============================================================
// GET /api/sessions/user/:userId - Lịch sử 1 user (admin only)
// ============================================================
router.get("/user/:userId", authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = getDB();
    await cleanupExpiredSessions(db);

    const { userId } = req.params;
    const {
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      period = "day",
    } = req.query;

    const filter = { userId: new ObjectId(userId) };

    if (dateFrom || dateTo) {
      filter.loginAt = {};
      if (dateFrom) filter.loginAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.loginAt.$lte = endDate;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Lấy sessions + tổng
    const [sessions, total, statsAgg] = await Promise.all([
      db
        .collection("login_sessions")
        .find(filter)
        .sort({ loginAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      db.collection("login_sessions").countDocuments(filter),
      db
        .collection("login_sessions")
        .aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              totalLogins: { $sum: 1 },
              avgDuration: { $avg: "$duration" },
              totalDuration: { $sum: "$duration" },
              lastLogin: { $max: "$loginAt" },
            },
          },
        ])
        .toArray(),
    ]);

    // Biểu đồ theo ngày/tuần cho user
    let chartGroupBy;
    if (period === "week") {
      chartGroupBy = {
        year: { $isoWeekYear: "$loginAt" },
        week: { $isoWeek: "$loginAt" },
      };
    } else {
      chartGroupBy = {
        year: { $year: "$loginAt" },
        month: { $month: "$loginAt" },
        day: { $dayOfMonth: "$loginAt" },
      };
    }

    const chartData = await db
      .collection("login_sessions")
      .aggregate([
        { $match: filter },
        {
          $group: {
            _id: chartGroupBy,
            count: { $sum: 1 },
            avgDuration: { $avg: "$duration" },
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            avgDuration: { $round: ["$avgDuration", 0] },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const stats = statsAgg[0] || {
      totalLogins: 0,
      avgDuration: 0,
      totalDuration: 0,
      lastLogin: null,
    };

    res.json({
      sessions,
      stats: {
        ...stats,
        avgDuration: stats.avgDuration ? Math.round(stats.avgDuration) : 0,
      },
      chartData,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("❌ Lỗi lấy lịch sử user:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

module.exports = router;
