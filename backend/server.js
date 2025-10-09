// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const{connectDB} = require("./config/mongodb");

const app = express();
app.use(express.json());
app.use(cors());

// connect DB
connectDB();

// Import routes
const executeRoutes = require("./routes/execute");
const openaiRoutes = require("./routes/openai");
const questionRoutes = require("./routes/question");

// Mount routes
app.use("/api", executeRoutes);
app.use("/api/openai", openaiRoutes);
app.use("/api/questions", questionRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
