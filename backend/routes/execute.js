// routes/execute.js
const express = require("express");
const axios = require("axios");
const { callPromptAI } = require("./callpromt");

const router = express.Router();
require("dotenv").config();

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8001";

// const normalizeString = (str) =>
//   str
//     .trim()
//     .split(/\s+|\n+/)
//     .filter((item) => item !== "")
//     .join(" ");

// Giữ nguyên xuống dòng để so sánh chính xác
const normalizeString = (str) =>
  str
    .replace(/\r/g, "") // loại CR
    .trim(); // không đụng tới \n

router.post("/execute", async (req, res) => {
  const { code, testcases, question, difficulty, lessonId } = req.body;
  // console.log("🚀 Nhận từ FE:", { difficulty, lessonId, question });

  try {
    if (!code || !testcases || testcases.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Missing code or testcases" });
    }

    const pythonPayload = {
      code,
      testcases: testcases.map((tc) => ({
        input: Array.isArray(tc.input) ? tc.input.join("\n") : tc.input,
        expected: tc.expected,
      })),
    };

    const pythonResponse = await axios.post(
      `${PYTHON_SERVICE_URL}/execute`,
      pythonPayload,
      { timeout: 30000 }
    );

    const executionResults = pythonResponse.data.results;

    const results = testcases.map((tc, index) => {
      const execution = executionResults[index];
      const sanitizedInput = Array.isArray(tc.input) ? tc.input : [tc.input];

      if (execution.error) {
        return {
          input: sanitizedInput.join("\n"),
          expected: tc.expected,
          actual: `Lỗi: ${execution.error}`,
          pass: false,
        };
      }

      const normalizedOutput = normalizeString(execution.output);
      const normalizedExpected = normalizeString(tc.expected);

      return {
        input: sanitizedInput.join("\n"),
        expected: tc.expected,
        actual: execution.output,
        pass: normalizedOutput === normalizedExpected,
      };
    });

    const hasError = results.some((r) => !r.pass);

    // --------------------- AI logic ---------------------
    if (hasError) {
      const failedCase = results.find((r) => !r.pass);

      // Khó (2): không gọi AI
      if (difficulty === 2) {
        console.log("🟥 Mức độ hiện tại: KHÓ → Không gọi AI");
        return res.json({
          success: true,
          results,
          guide: "Sai, nhưng ở chế độ Khó sẽ không có gợi ý từ AI.",
          hasGuide: false,
        });
      }

      // Khá (1): chỉ trả <instruct>
      if (difficulty === 1) {
        console.log("🟨 Mức độ hiện tại: KHÁ → Gọi AI (instruct_only)");
        const aiRes = await callPromptAI({
          code,
          question,
          error: failedCase.actual,
          testcase: failedCase,
          mode: "instruct_only",
          lessonId,
        });
        return res.json({
          success: true,
          results,
          ai: { ...aiRes, mode: "instruct_only" }, // ✅ Thêm mode gửi FE
          hasGuide: false,
        });
      }

      // Dễ (0): đầy đủ quiz + instruct + answer
      console.log("🟩 Mức độ hiện tại: DỄ → Gọi AI (full)");
      const aiRes = await callPromptAI({
        code,
        question,
        error: failedCase.actual,
        testcase: failedCase,
        mode: "full",
        lessonId,
      });
      return res.json({
        success: true,
        results,
        ai: { ...aiRes, mode: "full" }, // ✅ Thêm mode gửi FE
        hasGuide: false,
      });
    }

    // Nếu tất cả đúng
    return res.json({
      success: true,
      results,
      guide: "Chúc mừng, em đã làm rất tốt!",
      hasGuide: true,
    });
  } catch (error) {
    console.error("Execution error:", error);
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        success: false,
        error: "Python service không khả dụng",
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

module.exports = router;
