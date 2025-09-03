// const express = require('express');
// const cors = require('cors');
// const axios = require('axios');
// const bodyParser = require('body-parser');

// const app = express();
// const PORT = process.env.PORT || 3001;
// const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // Logging middleware
// app.use((req, res, next) => {
//     console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
//     next();
// });

// // Routes
// app.post('/api/execute', async (req, res) => {
//     try {
//         const { code, testcases, timeout = 5 } = req.body;

//         // Validate input
//         if (!code || !testcases || !Array.isArray(testcases)) {
//             return res.status(400).json({
//                 success: false,
//                 error: 'Invalid request: code and testcases are required'
//             });
//         }

//         // Forward request to Python service
//         const response = await axios.post(`${PYTHON_SERVICE_URL}/execute`, {
//             code,
//             testcases,
//             timeout
//         }, {
//             timeout: (timeout + 2) * 1000 // Add buffer to axios timeout
//         });

//         res.json(response.data);

//     } catch (error) {
//         console.error('Error executing code:', error.message);

//         if (error.response) {
//             // Python service returned an error
//             res.status(error.response.status).json(error.response.data);
//         } else if (error.code === 'ECONNREFUSED') {
//             res.status(503).json({
//                 success: false,
//                 error: 'Python execution service is unavailable'
//             });
//         } else {
//             res.status(500).json({
//                 success: false,
//                 error: 'Internal server error'
//             });
//         }
//     }
// });

// // Health check endpoint
// app.get('/api/health', async (req, res) => {
//     try {
//         const pythonHealth = await axios.get(`${PYTHON_SERVICE_URL}/health`);
//         res.json({
//             status: 'healthy',
//             services: {
//                 api: 'healthy',
//                 pythonExecutor: pythonHealth.data.status,
//                 value: pythonHealth.data.a // 👈 thêm dòng này để trả về a=10
//             }
//         });
//     } catch (error) {
//         res.status(503).json({
//             status: 'unhealthy',
//             services: {
//                 api: 'healthy',
//                 pythonExecutor: 'unavailable'
//             }
//         });
//     }
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({
//         success: false,
//         error: 'Something went wrong!'
//     });
// });

// app.listen(PORT, () => {
//     console.log(`Node.js backend running on port ${PORT}`);
//     console.log(`Python service URL: ${PYTHON_SERVICE_URL}`);
// });

// server.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8001";

// Helper functions từ FE
const normalizeString = (str) => {
  return str
    .trim()
    .split(/\s+|\n+/)
    .filter((item) => item !== "")
    .join(" ");
};

app.post("/api/execute", async (req, res) => {
  const startTime = Date.now(); // ⏱ bắt đầu

  const { code, testcases, questionId } = req.body;

  try {
    // Validate input
    if (!code || !testcases || testcases.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Missing code or testcases",
      });
    }

    // Chuẩn bị data cho Python service
    const pythonPayload = {
      code: code,
      testcases: testcases.map((tc) => ({
        input: Array.isArray(tc.input) ? tc.input.join("\n") : tc.input,
        expected: tc.expected,
      })),
    };

    // Gọi Python service
    const pythonResponse = await axios.post(
      `${PYTHON_SERVICE_URL}/execute`,
      pythonPayload,
      { timeout: 30000 } // 30s timeout
    );

    const executionResults = pythonResponse.data.results;

    // Format kết quả giống như FE cũ
    const results = testcases.map((tc, index) => {
      const execution = executionResults[index];
      const sanitizedInput = Array.isArray(tc.input) ? tc.input : [tc.input];

      if (execution.error) {
        // Xử lý lỗi giống FE
        let errorMessage = execution.error;
        if (execution.error.includes("NameError")) {
          const varName = execution.error.match(/name '(.+)' is not defined/);
          if (varName) {
            errorMessage = `Lỗi: Biến '${varName[1]}' chưa được định nghĩa.`;
          }
        }

        return {
          input: sanitizedInput.join("\n"),
          expected: tc.expected,
          actual: `Lỗi: ${errorMessage}`,
          pass: false,
        };
      }

      // So sánh kết quả
      const normalizedOutput = normalizeString(execution.output);
      const normalizedExpected = normalizeString(tc.expected);

      return {
        input: sanitizedInput.join("\n"),
        expected: tc.expected,
        actual: execution.output,
        pass: normalizedOutput === normalizedExpected,
      };
    });

    const endTime = Date.now(); // ⏱ kết thúc
    console.log(
      `[${new Date().toISOString()}] /api/execute completed in ${
        endTime - startTime
      } ms`
    );

    res.json({
      success: true,
      results: results,
    });
  } catch (error) {
    const endTime = Date.now();
    console.log(
      `[${new Date().toISOString()}] /api/execute failed in ${
        endTime - startTime
      } ms`
    );

    console.error("Execution error:", error);

    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        success: false,
        error: "Python service không khả dụng",
        time: `${endTime - startTime} ms`
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
      time: `${endTime - startTime} ms`
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
