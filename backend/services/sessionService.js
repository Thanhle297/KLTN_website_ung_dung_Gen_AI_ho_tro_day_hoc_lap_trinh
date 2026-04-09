// services/sessionService.js
// Business logic cho quản lý phiên đăng nhập
const { getDB } = require("../config/mongodb");
const { ObjectId } = require("mongodb");

/**
 * Tự động đánh dấu sessions đã hết hạn token nhưng chưa có logoutAt
 */
async function cleanupExpiredSessions() {
  const db = getDB();
  const now = new Date();
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
}

/**
 * Ghi nhận logout
 * @param {string} sessionId
 * @param {string} logoutType
 * @returns {Promise<{ success: boolean, message: string, duration?: number }>}
 */
async function logoutSession(sessionId, logoutType = "manual") {
  const db = getDB();

  if (!sessionId) {
    return { success: false, status: 400, message: "Không tìm thấy sessionId trong token" };
  }

  const now = new Date();
  const session = await db.collection("login_sessions").findOne({ sessionId });

  if (!session) {
    return { success: false, status: 404, message: "Không tìm thấy phiên đăng nhập" };
  }

  // Nếu đã logout rồi thì bỏ qua
  if (session.logoutAt) {
    return { success: true, message: "Phiên đã được đăng xuất trước đó" };
  }

  const duration = Math.round((now - session.loginAt) / 1000);

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

  return { success: true, message: "Đăng xuất thành công", duration };
}

/**
 * Kiểm tra phiên còn hợp lệ không (dùng cho frontend polling)
 * @param {string} sessionId
 * @returns {Promise<{ valid: boolean, reason?: string }>}
 */
async function checkSession(sessionId) {
  const db = getDB();

  if (!sessionId) {
    return { valid: false, reason: "no_session" };
  }

  const session = await db
    .collection("login_sessions")
    .findOne({ sessionId }, { projection: { logoutAt: 1, logoutType: 1 } });

  if (!session) {
    return { valid: false, reason: "not_found" };
  }

  if (session.logoutType === "force_logout") {
    return { valid: false, reason: "force_logout" };
  }

  if (session.logoutAt) {
    return { valid: false, reason: session.logoutType || "logged_out" };
  }

  return { valid: true };
}

/**
 * Lấy danh sách sessions (admin) với filter và pagination
 * @param {Object} queryParams - { userId, username, role, dateFrom, dateTo, page, limit }
 * @returns {Promise<{ sessions: Array, pagination: Object }>}
 */
async function listSessions(queryParams) {
  const db = getDB();
  await cleanupExpiredSessions();

  const {
    userId,
    username,
    role,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
  } = queryParams;

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

  return {
    sessions,
    pagination: {
      total,
      page: parseInt(page),
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}

/**
 * Thống kê login (admin)
 * @param {Object} queryParams - { period, dateFrom, dateTo }
 * @returns {Promise<Object>}
 */
async function getStats(queryParams) {
  const db = getDB();
  await cleanupExpiredSessions();

  const { period = "day", dateFrom, dateTo } = queryParams;
  const now = new Date();

  // Thống kê tổng quan
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
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

  // Thống kê theo thời gian (biểu đồ)
  let chartDateFrom, chartDateTo;

  if (dateFrom && dateTo) {
    chartDateFrom = new Date(dateFrom);
    chartDateTo = new Date(dateTo);
    chartDateTo.setHours(23, 59, 59, 999);
  } else if (period === "week") {
    chartDateFrom = new Date(now);
    chartDateFrom.setDate(now.getDate() - 28);
    chartDateFrom.setHours(0, 0, 0, 0);
    chartDateTo = now;
  } else {
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

  return {
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
  };
}

/**
 * Lấy danh sách user đang online
 * @returns {Promise<{ onlineUsers: Array, count: number }>}
 */
async function getOnlineUsers() {
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

  return { onlineUsers, count: onlineUsers.length };
}

/**
 * Lấy lịch sử đăng nhập của 1 user (admin)
 * @param {string} userId
 * @param {Object} queryParams
 * @returns {Promise<Object>}
 */
async function getUserSessions(userId, queryParams) {
  const db = getDB();
  await cleanupExpiredSessions();

  const {
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
    period = "day",
  } = queryParams;

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

  return {
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
  };
}

module.exports = {
  cleanupExpiredSessions,
  logoutSession,
  checkSession,
  listSessions,
  getStats,
  getOnlineUsers,
  getUserSessions,
};
