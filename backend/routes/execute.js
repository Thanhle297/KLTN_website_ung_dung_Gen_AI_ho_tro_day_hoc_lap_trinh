// routes/execute.js
const express = require("express");
const axios = require("axios");
const { callPromptAI } = require("./callpromt");

const router = express.Router();
require("dotenv").config();

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8001";

const normalizeString = (str) =>
  str
    .trim()
    .split(/\s+|\n+/)
    .filter((item) => item !== "")
    .join(" ");

router.post("/execute", async (req, res) => {
  const { code, testcases, question } = req.body;

  try {
    if (!code || !testcases || testcases.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Missing code or testcases" });
    }

    // gửi sang Python service
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

    if (hasError) {
      const failedCase = results.find((r) => !r.pass);

      // gọi AI với prompt cứng
      const aiRes = await callPromptAI({
        code,
        question,
        error: failedCase.actual,
        testcase: failedCase,
      });

      return res.json({
        success: true,
        results,
        ai: aiRes, // FE sẽ lấy thẳng dữ liệu này
        hasGuide: false,
      });
    } else {
      return res.json({
        success: true,
        results,
        guide: "Chúc mừng, em đã làm rất tốt!",
        hasGuide: true,
      });
    }
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
