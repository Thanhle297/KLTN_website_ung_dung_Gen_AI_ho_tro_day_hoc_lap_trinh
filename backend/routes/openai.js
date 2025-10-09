// routes/openai.js
const express = require("express");
const { callOpenAI } = require("../services/openaiService");

const router = express.Router();

router.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  // Kiểm tra đầu vào chi tiết hơn
  if (!prompt) {
    return res.status(400).json({
      success: false,
      error: "Thiếu prompt",
    });
  }

  if (typeof prompt !== "string") {
    return res.status(400).json({
      success: false,
      error: "Prompt phải là chuỗi ký tự",
    });
  }

  if (prompt.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "Prompt không được để trống",
    });
  }

  try {
    const result = await callOpenAI(prompt);
    console.log("OpenAI response success:", result); // Thêm logging
    res.json({
      success: true,
      result,
    });
  } catch (error) {
    // Xử lý các loại lỗi cụ thể
    if (error.name === "TimeoutError") {
      return res.status(408).json({
        success: false,
        error: "Yêu cầu hết thời gian chờ",
      });
    }

    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        error: "Lỗi xác thực API key",
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: "Đã vượt quá giới hạn request",
      });
    }

    console.error("OpenAI API Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    res.status(500).json({
      success: false,
      error: "Đã xảy ra lỗi máy chủ",
      chiTiet: error.message,
    });
  }
});

module.exports = router;
