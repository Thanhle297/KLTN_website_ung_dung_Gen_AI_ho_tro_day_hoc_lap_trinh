const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = rateLimit;
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { connectDB } = require("./config/mongodb");

const app = express();
const PORT = process.env.PORT || 3001;

/* =========================================================
   🛡️ SECURITY: HELMET (Security Headers)
========================================================= */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // MUI can inline styles
      imgSrc: ["'self'", "data:", "https://cdn-icons-png.flaticon.com"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000"],
    },
  },
  crossOriginEmbedderPolicy: false, // Tắt nếu dùng external resources
}));

/* =========================================================
   🛡️ SECURITY: RATE LIMITING
========================================================= */
// Helper: trích userId từ JWT token để rate limit per-user
// Fallback về req.ip nếu không có token (chưa đăng nhập)
function getUserIdFromToken(req) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return ipKeyGenerator(req.ip);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id || ipKeyGenerator(req.ip);
  } catch {
    return ipKeyGenerator(req.ip);
  }
}

// Global limiter: 200 requests / 15 phút (per-user)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Quá nhiều yêu cầu, vui lòng thử lại sau" },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getUserIdFromToken,
});
app.use(globalLimiter);

// Login limiter: 10 lần / 15 phút (per-IP, vì chưa đăng nhập)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút" },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI/Execute limiter: 20 requests / 1 phút (per-user)
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { message: "Quá nhiều yêu cầu AI, vui lòng chờ" },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getUserIdFromToken,
});

/* =========================================================
   🌐 MIDDLEWARE CƠ BẢN
========================================================= */
app.use(express.json({ limit: "2mb" }));

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* =========================================================
   🛑 TẮT CACHE HTTP – BẮT BUỘC CHO LMS
========================================================= */
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

/* =========================================================
   📦 IMPORT ROUTES
========================================================= */
const executeRoutes = require("./routes/execute");
const openaiRoutes = require("./routes/openai");
const questionRoutes = require("./routes/questionRoutes");
const authRoutes = require("./routes/auth");
const tempRoutes = require("./routes/tempSubmission");
const aiSimpleRoutes = require("./routes/aiSimple");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const subLessonRoutes = require("./routes/subLessonRoutes");
const restorePassRoutes = require("./routes/restorepassRoutes");
const submitRoutes = require("./routes/submitRoutes");
const progressRoutes = require("./routes/progressRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const csvRoutes = require("./routes/csvRoutes");
const executeMiddleRoutes = require("./routes/executeMiddle");
const sessionRoutes = require("./routes/sessionRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

/* =========================================================
   🚀 KHỞI ĐỘNG SERVER
========================================================= */
async function startServer() {
  try {
    await connectDB(app);
    console.log("✅ MongoDB connected successfully.");

    /* ================== MOUNT ROUTES ================== */
    app.use("/api/execute", aiLimiter); // Rate limit cho execute
    app.use("/api/execute-middle", aiLimiter); // Rate limit cho execute-middle
    app.use("/api", executeRoutes);
    app.use("/api/openai", aiLimiter, openaiRoutes);
    app.use("/api/questions", questionRoutes);
    app.use("/api/auth", loginLimiter); // Rate limit cho login
    app.use("/api", authRoutes);
    app.use("/api/temp", tempRoutes);
    app.use("/api/ai", aiLimiter, aiSimpleRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/courses", courseRoutes);
    app.use("/api/lessons", lessonRoutes);
    app.use("/api/sublessons", subLessonRoutes);
    app.use("/api/restore-pass", restorePassRoutes);
    app.use("/api/submit", submitRoutes);
    app.use("/api/progress", progressRoutes);
    app.use("/api/enrollments", enrollmentRoutes);
    app.use("/api/csv", csvRoutes);
    app.use("/api", executeMiddleRoutes);
    app.use("/api/sessions", sessionRoutes);
    app.use("/api/categories", categoryRoutes);

    /* ================== HEALTH CHECK ================== */
    app.get("/", (req, res) => {
      res.status(200).json({
        message: "✅ Backend server is running successfully.",
        version: "LMS Production Stable",
        time: new Date().toISOString(),
      });
    });

    /* ================== ERROR HANDLER ================== */
    app.use((err, req, res, next) => {
      console.error("❌ Uncaught error:", err);
      res.status(500).json({ error: "Lỗi server nội bộ." });
    });

    /* ================== LISTEN ================== */
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error starting server:", error);
    process.exit(1);
  }
}

startServer();
