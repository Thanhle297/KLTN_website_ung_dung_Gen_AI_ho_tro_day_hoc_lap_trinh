const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { connectDB } = require("./config/mongodb");

const app = express();
const PORT = process.env.PORT || 3001;

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

/* =========================================================
   🚀 KHỞI ĐỘNG SERVER
========================================================= */
async function startServer() {
  try {
    await connectDB(app);
    console.log("✅ MongoDB connected successfully.");

    /* ================== MOUNT ROUTES ================== */
    app.use("/api", executeRoutes);
    app.use("/api/openai", openaiRoutes);
    app.use("/api/questions", questionRoutes);
    app.use("/api", authRoutes);
    app.use("/api/temp", tempRoutes);
    app.use("/api/ai", aiSimpleRoutes);
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
