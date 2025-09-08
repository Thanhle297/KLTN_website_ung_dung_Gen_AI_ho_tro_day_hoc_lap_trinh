//execute.js
const express = require("express");
const axios = require("axios");
const { callGemini } = require("../services/geminiService");

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

    // Gửi sang Python service
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

    // Đánh giá kết quả
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

    // Nếu có lỗi thì gọi Gemini
    let guide = null;
    const hasError = results.some((r) => !r.pass);

    if (hasError) {
      const failedCase = results.find((r) => !r.pass);

      const prompt = `
${question ? "Câu hỏi: " + question : ""}
Code học sinh:
\`\`\`python
${code}
\`\`\`
Input: ${failedCase.input}
Output (thực tế): ${failedCase.actual}
Expected: ${failedCase.expected}

Bạn là giáo viên Tin học tại Việt Nam. 
Nhiệm vụ của bạn là phân tích code Python do học sinh nộp và chỉ ra lỗi theo format:
#<số dòng>: <lỗi> → <hướng dẫn> (chủ đề: <kiến thức liên quan>).

⚠️ Yêu cầu:
- KHÔNG viết lại toàn bộ code.
- KHÔNG đưa code đã sửa.
- Chỉ gợi ý ngắn gọn, rõ ràng để học sinh tự sửa.
`;

      console.log("🔍 Gemini prompt gửi đi:\n", prompt);

      try {
        const geminiRes = await callGemini(prompt);
        guide =
          geminiRes?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "Không có hướng dẫn.";
      } catch (e) {
        console.error("Gemini guide error:", e.message);
        guide = "Không thể tạo hướng dẫn từ AI.";
      }
    }

    res.json({ success: true, results, guide });
  } catch (error) {
    console.error("Execution error:", error);
    if (error.code === "ECONNREFUSED") {
      return res
        .status(503)
        .json({ success: false, error: "Python service không khả dụng" });
    }
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Internal server error",
      });
  }
});

module.exports = router;
