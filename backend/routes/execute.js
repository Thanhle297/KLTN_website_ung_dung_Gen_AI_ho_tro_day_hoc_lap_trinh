// routes/execute.js
const express = require("express");
const axios = require("axios");
const { callPromptAI } = require("./callpromt");

const router = express.Router();
require("dotenv").config();

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8001";

// Giữ nguyên xuống dòng để so sánh chính xác
const normalizeString = (str) => str.replace(/\r/g, "").trim();

router.post("/execute", async (req, res) => {
  const {
    code,
    testcases,
    question,
    difficulty,
    lessonId,
    lessonNumber,
    echo_input,
  } = req.body;

  try {
    if (!code || !testcases || testcases.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Missing code or testcases" });
    }

    // Validation lessonNumber
    if (lessonNumber === undefined || lessonNumber === null) {
      return res.status(400).json({
        success: false,
        error: "lessonNumber là bắt buộc",
      });
    }

    const lessonNum = Number(lessonNumber);
    if (isNaN(lessonNum) || lessonNum < 16 || lessonNum > 28) {
      return res.status(400).json({
        success: false,
        error: `lessonNumber không hợp lệ:${lessonNumber}. Phải là số từ 16-28`,
      });
    }

    // =====================
    // 1) Chuẩn hóa payload gửi sang Python
    // =====================
    const pythonPayload = {
      code,
      echo_input: echo_input ?? false, // NEW: truyền echo_input ở cấp QUESTION
      testcases: testcases.map((tc) => ({
        input: Array.isArray(tc.input) ? tc.input.join("\n") : tc.input,
        expected: tc.expected,
      })),
    };

    // =====================
    // 2) Gửi sang Python-service
    // =====================
    const pythonResponse = await axios.post(
      `${PYTHON_SERVICE_URL}/execute`,
      pythonPayload,
      { timeout: 30000 },
    );

    const executionResults = pythonResponse.data.results;

    // =====================
    // 3) Map kết quả chấm
    // =====================
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

    // =====================
    // 4) Nếu có lỗi → Gọi AI tùy theo mức độ
    // =====================
    if (hasError) {
      const failedCase = results.find((r) => !r.pass);

      // Mức khó → không dùng AI
      if (difficulty === 2) {
        return res.json({
          success: true,
          results,
          guide: "Sai, nhưng ở chế độ Khó sẽ không có gợi ý từ AI.",
          hasGuide: false,
        });
      }

      // Mức khá → AI instruct_only
      if (difficulty === 1) {
        const aiRes = await callPromptAI({
          code,
          question,
          error: failedCase.actual,
          testcase: failedCase,
          mode: "instruct_only",
          lessonId,
          lessonNumber: lessonNum,
        });
        return res.json({
          success: true,
          results,
          ai: { ...aiRes, mode: "instruct_only" },
          hasGuide: false,
        });
      }

      // Mức dễ → AI full
      const aiRes = await callPromptAI({
        code,
        question,
        error: failedCase.actual,
        testcase: failedCase,
        mode: "full",
        lessonId,
        lessonNumber: lessonNum,
      });
      return res.json({
        success: true,
        results,
        ai: { ...aiRes, mode: "full" },
        hasGuide: false,
      });
    }

    // =====================
    // 5) Tất cả đúng
    // =====================
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
