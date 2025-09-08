// backend/routes/execute.js
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

    // đánh giá kết quả
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

    // gọi Gemini
    let guide = null;
    let lineHints = [];
    const hasError = results.some((r) => !r.pass);

    let prompt = "";

    if (hasError) {
      const failedCase = results.find((r) => !r.pass);

      prompt = `
${question ? "Câu hỏi: " + question : ""}
Code học sinh:
\`\`\`python
${code}
\`\`\`
Input: ${failedCase.input}
Output (thực tế): ${failedCase.actual}
Expected: ${failedCase.expected}

Bạn là giáo viên Tin học tại Việt Nam. 
Hãy phân tích code Python và trả về lỗi theo ĐÚNG format sau (mỗi dòng 1 lỗi):
#<số dòng>: <mô tả lỗi> → <gợi ý sửa> (chủ đề: <kiến thức>)
`;
    } else {
      prompt = `
${question ? "Câu hỏi: " + question : ""}
Code học sinh:
\`\`\`python
${code}
\`\`\`

Bạn là giáo viên Tin học tại Việt Nam nếu code chạy đúng. Hãy kiểm tra xem có thể cải tiến không:
- Nếu có, gợi ý ngắn gọn (tối ưu, clean code, đổi biến...).
- Nếu không, trả về "Code đã tốt, không cần cải tiến".
- Không cần đưa ra lý do.
`;
    }

    try {
      const geminiRes = await callGemini(prompt);
      const text =
        geminiRes?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Không có phản hồi từ AI.";

      if (hasError) {
        // chỉ parse lineHints, không trả về guide
        lineHints = text
          .split("\n")
          .map((line) => {
            const match = line.match(/^#(\d+): (.+)$/);
            if (match) {
              return { line: parseInt(match[1]), message: match[2] };
            }
            return null;
          })
          .filter(Boolean);
        guide = null; // bỏ guide khi có lỗi
      } else {
        guide = text; // chỉ có guide khi code đúng
      }
    } catch (e) {
      guide = null;
      if (hasError) {
        lineHints = [];
      }
    }

    res.json({
      success: true,
      results,
      guide,
      lineHints,
      hasGuide: !hasError, // code đúng enable hướng dẫn.
    });
  } catch (error) {
    console.error("Execution error:", error);
    if (error.code === "ECONNREFUSED") {
      return res
        .status(503)
        .json({ success: false, error: "Python service không khả dụng" });
    }
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

module.exports = router;
