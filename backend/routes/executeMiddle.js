// routes/executeMiddle.js
const express = require("express");
const axios = require("axios");
const { callPromptMiddle } = require("./callPromtMiddle");

const router = express.Router();
require("dotenv").config();

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8001";

// Giữ nguyên xuống dòng để so sánh chính xác
const normalizeString = (str) => str.replace(/\r/g, "").trim();

/**
 * Kết hợp kết quả testcase + AI logic → 3 mức
 * @param {Array} testcaseResults - Kết quả testcase [{pass: boolean}]
 * @param {string} aiResult - "PASS" | "PARTIAL" | "FAIL"
 * @returns {string} "correct" | "partial" | "wrong"
 */
function getCombinedStatus(testcaseResults, aiResult) {
  const total = testcaseResults.length;
  const passed = testcaseResults.filter((r) => r.pass).length;
  const allPass = passed === total;
  const allFail = passed === 0;

  // All testcase pass + AI PASS → correct
  if (allPass && aiResult === "PASS") return "correct";
  // All testcase pass nhưng AI phát hiện vấn đề → partial
  if (allPass && aiResult !== "PASS") return "partial";
  // Một số pass + AI đánh giá logic đúng hoặc đúng phần → partial
  if (!allFail && aiResult === "PASS") return "partial";
  if (!allFail && aiResult === "PARTIAL") return "partial";
  // All fail nhưng AI thấy logic đúng → partial (có ý tưởng đúng)
  if (allFail && aiResult === "PASS") return "partial";
  // Còn lại → wrong
  return "wrong";
}

router.post("/execute-middle", async (req, res) => {
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
    // =====================
    // 1) Validation
    // =====================
    if (!code || !testcases || testcases.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Missing code or testcases" });
    }

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
        error: `lessonNumber không hợp lệ: ${lessonNumber}. Phải là số từ 16-28`,
      });
    }

    // =====================
    // 2) Chuẩn hóa payload gửi sang Python service
    // =====================
    const pythonPayload = {
      code,
      echo_input: echo_input ?? false,
      testcases: testcases.map((tc) => ({
        input: Array.isArray(tc.input) ? tc.input.join("\n") : tc.input,
        expected: tc.expected,
      })),
    };

    // =====================
    // 3) Gửi sang Python service chạy testcase
    // =====================
    const pythonResponse = await axios.post(
      `${PYTHON_SERVICE_URL}/execute`,
      pythonPayload,
      { timeout: 30000 }
    );

    const executionResults = pythonResponse.data.results;

    // =====================
    // 4) Map kết quả testcase
    // =====================
    const testcaseResults = testcases.map((tc, index) => {
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

    // =====================
    // 5) GỌI AI CHẤM LOGIC - LUÔN CHẠY BẤT KỂ DIFFICULTY
    // =====================
    const aiResponse = await callPromptMiddle({
      code,
      question,
      testcaseResults,
      difficulty: difficulty ?? 0,
      lessonNumber: lessonNum,
    });

    // =====================
    // 6) Kết hợp kết quả testcase + AI → 3 mức
    // =====================
    const combinedStatus = getCombinedStatus(testcaseResults, aiResponse.result);

    // =====================
    // 7) Lọc guide/quizzes theo difficulty (chỉ lọc output, KHÔNG skip AI call)
    // =====================
    let popupMode = null;
    let instructs = [];
    let quizzes = [];

    if (difficulty === 0) {
      popupMode = "full";
      instructs = aiResponse.instructs || [];
      quizzes = aiResponse.quizzes || [];
    } else if (difficulty === 1) {
      popupMode = "instruct_only";
      instructs = aiResponse.instructs || [];
      quizzes = [];
    } else {
      // difficulty === 2: không có gợi ý, chỉ có kết quả
      popupMode = null;
      instructs = [];
      quizzes = [];
    }

    // =====================
    // 8) Trả response
    // =====================
    return res.json({
      success: true,
      results: testcaseResults,
      aiResult: aiResponse.result, // "PASS" | "PARTIAL" | "FAIL"
      combinedStatus, // "correct" | "partial" | "wrong"
      ai: {
        mode: popupMode,
        instructs,
        quizzes,
      },
      guide:
        combinedStatus === "correct"
          ? "Chúc mừng, em đã làm rất tốt!"
          : instructs.length > 0
            ? instructs.join("\n\n")
            : null,
    });
  } catch (error) {
    console.error("Execute-middle error:", error);

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
