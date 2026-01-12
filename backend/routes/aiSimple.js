const express = require("express");
const { callPromptSimple } = require("./callPromtSimple");

const router = express.Router();

router.post("/simple", async (req, res) => {
  const { code, question, input, output, difficulty } = req.body;

  try {
    console.log("🤖 Gọi AI (mode simple)...");
    const aiRes = await callPromptSimple({ code, question, input, output,difficulty });

    res.json({
      success: aiRes.success,
      isCorrect : aiRes.isCorrect,
      guide: aiRes.guide,
      // raw: aiRes.raw,
    });
  } catch (err) {
    console.error("❌ Lỗi /api/ai/simple:", err);
    res.status(500).json({
      success: false,
      guide: "Không thể gọi AI để phân tích code.",
    });
  }
});

module.exports = router;
