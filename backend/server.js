const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { connectDB } = require("./config/mongodb");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: "2mb" }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Import routes
const executeRoutes = require("./routes/execute");
const openaiRoutes = require("./routes/openai");
const questionRoutes = require("./routes/question");
const authRoutes = require("./routes/auth");
const tempRoutes = require("./routes/tempSubmission");
const aiSimpleRoutes = require("./routes/aiSimple");
const userRoutes = require("./routes/userRoutes"); // ✅ Thêm route người dùng

// ✅ Hàm khởi động server
async function startServer() {
  try {
    await connectDB(app);
    console.log("✅ MongoDB connected successfully.");

    // Mount routes
    app.use("/api", executeRoutes);
    app.use("/api/openai", openaiRoutes);
    app.use("/api", questionRoutes);
    app.use("/api", authRoutes);
    app.use("/api/temp", tempRoutes);
    app.use("/api/ai", aiSimpleRoutes);
    app.use("/api/users", userRoutes); // ✅ Mount route người dùng

    // Kiểm tra hoạt động server
    app.get("/", (req, res) => {
      res.status(200).json({
        message: "✅ Backend server is running successfully.",
        endpoints: [
          "/api/ai/simple",
          "/api/openai",
          "/api/question",
          "/api/temp",
          "/api/users/me",
        ],
      });
    });

    // Xử lý lỗi chung
    app.use((err, req, res, next) => {
      console.error("❌ Uncaught error:", err);
      res.status(500).json({ error: "Lỗi server nội bộ." });
    });

    // ✅ Lắng nghe
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error starting server:", error);
    process.exit(1);
  }
}

startServer();
