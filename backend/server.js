// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { connectDB } = require("./config/mongodb");

const app = express();
app.use(express.json());
app.use(cors());

// Import routes
const executeRoutes = require("./routes/execute");
const openaiRoutes = require("./routes/openai");
const questionRoutes = require("./routes/question");
const authRoutes = require("./routes/auth");

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await connectDB(); // ✅ CHỜ MongoDB kết nối xong
    console.log("✅ Database connected and ready");

    // Mount routes SAU khi DB sẵn sàng
    app.use("/api", executeRoutes);
    app.use("/api/openai", openaiRoutes);
    app.use("/api", questionRoutes);
    app.use("/api", authRoutes)

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error while connecting DB:", error);
    process.exit(1);
  }
}

startServer();
