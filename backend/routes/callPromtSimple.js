// routes/callPromtSimple.js
const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// JSON Schema cho response - đảm bảo output ổn định
const codeEvaluationSchema = {
  type: "object",
  properties: {
    result: {
      type: "string",
      enum: ["PASS", "FAIL"],
      description: "PASS nếu bài làm đúng yêu cầu, FAIL nếu sai hoặc thiếu",
    },
    instructs: {
      type: "array",
      items: { type: "string" },
      description: "Danh sách hướng dẫn cho học sinh (tiếng Việt, ngắn gọn)",
    },
    quizzes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "Câu hỏi trắc nghiệm gợi mở giúp học sinh tự tìm ra lỗi",
          },
          answers: {
            type: "array",
            items: { type: "string" },
            description: "3 đáp án lựa chọn",
          },
          correctIndex: {
            type: "integer",
            description: "Index của đáp án đúng (0, 1, hoặc 2)",
          },
        },
        required: ["question", "answers", "correctIndex"],
        additionalProperties: false,
      },
      description: "Câu hỏi trắc nghiệm gợi mở (chỉ khi bài sai và được phép)",
    },
  },
  required: ["result", "instructs", "quizzes"],
  additionalProperties: false,
};

/**
 * Gọi OpenAI để đánh giá bài làm Python của học sinh
 * @param {Object} params - Tham số đầu vào
 * @param {string} params.code - Mã nguồn Python của học sinh
 * @param {string} params.question - Đề bài
 * @param {string} params.input - Input test
 * @param {string} params.output - Output thực tế từ code
 * @param {number} params.difficulty - Mức độ gợi ý (0=dễ, 1=vừa, 2=khó)
 * @returns {Object} Kết quả đánh giá
 */
async function callPromptSimple({
  code,
  question,
  input,
  output,
  difficulty = 2,
}) {
  // Quy tắc theo difficulty level
  let difficultyRule = "";
  let quizRule = "";

  if (difficulty === 0) {
    // DỄ: Hướng dẫn chi tiết + Quiz gợi mở
    difficultyRule = `
- Chỉ rõ học sinh đang thiếu yêu cầu nào của đề bài.
- Có thể nêu ví dụ mô tả (KHÔNG được đưa code hoàn chỉnh).
- Gợi ý rõ ràng nhưng vẫn mang tính hướng dẫn.`;
    quizRule = `
- Nếu bài SAI (FAIL), hãy tạo 1-2 câu hỏi trắc nghiệm gợi mở trong mảng "quizzes".
- Mỗi câu hỏi có đúng 3 đáp án, correctIndex là index đáp án đúng (0, 1, hoặc 2).
- Câu hỏi giúp học sinh tự nhận ra lỗi sai.
- Nếu bài ĐÚNG (PASS), để mảng "quizzes" rỗng.`;
  } else if (difficulty === 1) {
    // VỪA: Hướng dẫn định hướng, không quiz
    difficultyRule = `
- Không nói thẳng học sinh sai ở đâu.
- Dùng câu định hướng như: "hãy kiểm tra lại...", "hãy xem lại yêu cầu...".
- Không nêu ví dụ cụ thể.`;
    quizRule = `
- KHÔNG tạo câu hỏi trắc nghiệm, để mảng "quizzes" rỗng [].`;
  } else {
    // KHÓ: Chỉ kết luận PASS/FAIL
    difficultyRule = `
- Chỉ đánh giá đạt / chưa đạt.
- Không đưa ra bất kỳ hướng dẫn nào.`;
    quizRule = `
- KHÔNG tạo hướng dẫn, để mảng "instructs" rỗng [].
- KHÔNG tạo câu hỏi trắc nghiệm, để mảng "quizzes" rỗng [].`;
  }

  const prompt = `
Bạn là giáo viên Tin học Việt Nam. Đánh giá bài làm Python của học sinh.

QUY TẮC ĐÁNH GIÁ:
${difficultyRule}

QUY TẮC VỀ QUIZ:
${quizRule}

---

ĐỀ BÀI:
${question || "Không có đề"}

MÃ NGUỒN HỌC SINH:
\`\`\`python
${code || "Không có code"}
\`\`\`

INPUT: ${input || "Không có input"}
OUTPUT THỰC TẾ: ${output || "Không có output"}

---

ĐÁNH GIÁ THEO 3 BƯỚC:

1. **Phân tích yêu cầu đề bài**:
   - Học sinh cần thực hiện những gì?
   - Liệt kê các yêu cầu cụ thể.

2. **Đối chiếu đầu ra**:
   - So sánh OUTPUT của học sinh với yêu cầu.
   - Nếu thiếu bất kỳ phần nào → FAIL.

3. **Kết luận**:
   - ĐÚNG → result = "PASS"
   - SAI/THIẾU → result = "FAIL"

---

TRẢ VỀ JSON với cấu trúc:
{
  "result": "PASS" hoặc "FAIL",
  "instructs": ["hướng dẫn 1", "hướng dẫn 2", ...],
  "quizzes": [
    {
      "question": "Câu hỏi gợi mở?",
      "answers": ["Đáp án A", "Đáp án B", "Đáp án C"],
      "correctIndex": 0
    }
  ]
}

LƯU Ý:
- Trả lời bằng tiếng Việt.
- Hướng dẫn ngắn gọn, dễ hiểu.
- KHÔNG đưa code hoàn chỉnh cho học sinh.
- Mỗi câu quiz có ĐÚNG 3 đáp án.
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "code_evaluation",
          strict: true,
          schema: codeEvaluationSchema,
        },
      },
    });

    const rawContent = response.choices[0].message.content || "{}";

    // Log token usage
    if (response.usage) {
      console.log("🔢 Token usage:");
      console.log("  Prompt:", response.usage.prompt_tokens);
      console.log("  Completion:", response.usage.completion_tokens);
      console.log("  Total:", response.usage.total_tokens);
    }

    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (parseErr) {
      console.error("❌ Lỗi parse JSON từ AI:", parseErr.message);
      console.error("Raw content:", rawContent);
      return {
        success: false,
        isCorrect: false,
        guide: "Lỗi xử lý phản hồi từ AI.",
        quizzes: [],
        raw: rawContent,
      };
    }

    // Xây dựng kết quả theo difficulty
    const isCorrect = parsed.result === "PASS";
    const guide =
      difficulty === 2
        ? "" // Không guide cho difficulty 2
        : (parsed.instructs || []).join("\n\n");
    const quizzes =
      difficulty === 0
        ? parsed.quizzes || [] // Chỉ trả quiz cho difficulty 0
        : [];

    return {
      success: true,
      isCorrect,
      guide,
      quizzes,
      raw: rawContent,
    };
  } catch (err) {
    console.error("❌ Lỗi gọi OpenAI:", err.message);
    return {
      success: false,
      isCorrect: false,
      guide: "Lỗi khi gọi AI để phân tích code.",
      quizzes: [],
      raw: "",
    };
  }
}

module.exports = { callPromptSimple };
