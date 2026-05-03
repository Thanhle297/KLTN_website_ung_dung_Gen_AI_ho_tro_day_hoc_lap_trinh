const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();
const { getDB } = require("../config/mongodb");
const authMiddleware = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/coursePermission");

const TIMEZONE = "Asia/Ho_Chi_Minh";

function getVietnamDayStart(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const getPart = (type) => parts.find((part) => part.type === type)?.value;
  return new Date(`${getPart("year")}-${getPart("month")}-${getPart("day")}T00:00:00+07:00`);
}

function formatVietnamDateLabel(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
  }).formatToParts(date);

  const day = parts.find((part) => part.type === "day")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${day}-${month}`;
}

// GET /api/admin/stats - Lấy thống kê tổng quan cho Admin Dashboard
router.get("/stats", authMiddleware, adminOnly, async (req, res) => {
  try {
    const db = getDB();
    const loginDateExpr = { $ifNull: ["$loginAt", "$loginTime"] };

    // Đếm tổng số user, course, câu hỏi
    const [totalUsers, totalCourses, totalQuestions] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("courses").countDocuments(),
      db.collection("questions").countDocuments(),
    ]);

    // Sessions hôm nay
    const todayStart = getVietnamDayStart();
    const todaySessions = await db.collection("login_sessions").countDocuments({
      $or: [
        { loginAt: { $gte: todayStart } },
        { loginTime: { $gte: todayStart } },
      ],
    });

    // Biểu đồ login 7 ngày gần nhất
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(todayStart.getDate() - 6);

    const rawLoginChart = await db.collection("login_sessions").aggregate([
      {
        $match: {
          $or: [
            { loginAt: { $gte: sevenDaysAgo } },
            { loginTime: { $gte: sevenDaysAgo } },
          ],
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%d-%m",
              date: loginDateExpr,
              timezone: TIMEZONE,
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1 } },
    ]).toArray();

    const chartMap = new Map(rawLoginChart.map((item) => [item.date, item.count]));
    const loginChart = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + index);
      const label = formatVietnamDateLabel(date);
      return { date: label, count: chartMap.get(label) || 0 };
    });

    // 5 sessions gần nhất
    const recentSessions = await db.collection("login_sessions")
      .aggregate([
        { $addFields: { loginDate: loginDateExpr } },
        { $sort: { loginDate: -1 } },
        { $limit: 5 },
      ])
      .toArray();

    // Enrich sessions with usernames nếu dữ liệu cũ chưa lưu username/fullname.
    const userIds = recentSessions
      .map((s) => s.userId)
      .filter(Boolean)
      .map((id) => {
        try {
          return id instanceof ObjectId ? id : new ObjectId(id);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    const users = userIds.length > 0
      ? await db.collection("users")
          .find({ _id: { $in: userIds } })
          .project({ username: 1, fullname: 1 })
          .toArray()
      : [];
    const userMap = {};
    users.forEach((u) => { userMap[u._id.toString()] = u; });

    const enrichedSessions = recentSessions.map((s) => ({
      _id: s._id,
      username: s.username || userMap[s.userId?.toString()]?.username || "N/A",
      fullname: s.fullname || userMap[s.userId?.toString()]?.fullname || "",
      role: s.role,
      loginTime: s.loginAt || s.loginTime || s.loginDate,
      logoutTime: s.logoutAt || s.logoutTime,
      ip: s.ipAddress || s.ip || "unknown",
    }));

    res.json({
      totalUsers,
      totalCourses,
      todaySessions,
      totalQuestions,
      loginChart,
      recentSessions: enrichedSessions,
    });
  } catch (err) {
    console.error("❌ Lỗi lấy thống kê admin:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

module.exports = router;
