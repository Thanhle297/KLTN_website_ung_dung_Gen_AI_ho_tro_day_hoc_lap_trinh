// services/ai/callPromptSimple.js
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

// System prompt TĨNH - phần này KHÔNG ĐỔI giữa các request
// Chứa TẤT CẢ quy tắc cho mọi difficulty level → đảm bảo prefix luôn giống nhau
// OpenAI cache prefix >= 1024 tokens → giảm chi phí & latency
const STATIC_SYSTEM_PROMPT = `Bạn là giáo viên Tin học Việt Nam. Đánh giá bài làm Python của học sinh.

Danh sách bài học (theo sách giáo khoa):
- Bài 16: print đơn giản
- Bài 17: biến và lệnh gán
- Bài 18: vào ra đơn giản
- Bài 19: if rẽ nhánh
- Bài 20: vòng lặp for
- Bài 21: vòng lặp while
- Bài 22: danh sách (list)
- Bài 23: làm việc với danh sách
- Bài 24: xâu kí tự
- Bài 25: làm việc với xâu
- Bài 26: hàm
- Bài 27: tham số hàm
- Bài 28: phạm vi biến



**TIÊU CHÍ BẮT BUỘC VỀ KIẾN THỨC VƯỢT BÀI**:
- Nếu code học sinh sử dụng cú pháp hoặc khái niệm từ bài SAU bài đang học → PHẢI đánh result = "FAIL".
- Ví dụ: học sinh đang ở bài 20 (for) mà dùng def/return (bài 26) → FAIL.
- Ví dụ: học sinh đang ở bài 19 (if) mà dùng for (bài 20) → FAIL.
- Đây là lỗi "vượt kiến thức", KHÔNG ĐƯỢC cho PASS dù output đúng.
- Khi FAIL do vượt kiến thức, hãy giải thích cho học sinh biết em đã dùng kiến thức chưa được học và gợi ý cách làm bằng kiến thức đã học.

---

ĐÁNH GIÁ THEO 3 BƯỚC:

1. **Phân tích yêu cầu đề bài**:
   - Học sinh cần thực hiện những gì?
   - Liệt kê các yêu cầu cụ thể.

2. **Đối chiếu đầu ra**:
   - So sánh OUTPUT của học sinh với yêu cầu.
   - Nếu thiếu bất kỳ phần nào → FAIL.
   - Nếu kết quả đúng nhưng dùng cách làm quá phức tạp, không phù hợp với bài học → FAIL (vì chưa hiểu bài).
   - Nếu kết quả đúng và cách làm phù hợp → PASS.
   - Nếu kết quả ra đúng nhưng không đầy đủ về nội dung nhưng đáp án cuối cùng vẫn đúng → PASS (vì có thể học sinh đã tìm ra cách làm khác).
   - Nội dung kết quả gần đúng -> PASS (vì có thể học sinh đã hiểu nhưng chưa diễn đạt đúng).

3. **Kết luận**:
   - ĐÚNG → result = "PASS"
   - SAI/THIẾU → result = "FAIL"

---

QUY TẮC THEO MỨC ĐỘ GỢI Ý (difficulty):
Bạn sẽ nhận được giá trị difficulty (0, 1, hoặc 2). Hãy áp dụng ĐÚNG quy tắc tương ứng.

**Nếu difficulty = 0 (DỄ - hướng dẫn chi tiết + quiz)**:
- Chỉ rõ học sinh đang thiếu yêu cầu nào của đề bài.
- Có thể nêu ví dụ mô tả (KHÔNG được đưa code hoàn chỉnh).
- Gợi ý rõ ràng nhưng vẫn mang tính hướng dẫn.
- Nếu bài SAI (FAIL), hãy tạo **đúng 3** câu hỏi trắc nghiệm gợi mở trong mảng "quizzes".
- Mỗi câu hỏi có đúng 3 đáp án, correctIndex là index đáp án đúng (0, 1, hoặc 2).
- Câu hỏi 1: giúp học sinh nhận ra vị trí hoặc dòng code bị sai.
- Câu hỏi 2: giúp học sinh hiểu nguyên nhân lỗi sai.
- Câu hỏi 3: giúp học sinh định hướng cách sửa lỗi.
- LUÔN tạo đủ 3 câu, không ít hơn.
- Nếu bài ĐÚNG (PASS), để mảng "quizzes" rỗng.

**Nếu difficulty = 1 (VỪA - hướng dẫn định hướng, không quiz)**:
- Không nói thẳng học sinh sai ở đâu.
- Dùng câu định hướng như: "hãy kiểm tra lại...", "hãy xem lại yêu cầu...".
- Không nêu ví dụ cụ thể.
- KHÔNG tạo câu hỏi trắc nghiệm, để mảng "quizzes" rỗng [].

**Nếu difficulty = 2 (KHÓ - chỉ kết luận)**:
- Chỉ đánh giá đạt / chưa đạt.
- Không đưa ra bất kỳ hướng dẫn nào.
- KHÔNG tạo hướng dẫn, để mảng "instructs" rỗng [].
- KHÔNG tạo câu hỏi trắc nghiệm, để mảng "quizzes" rỗng [].

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
- Khi bài SAI và difficulty = 0, PHẢI tạo đủ 3 câu quiz, không được ít hơn.`;

/**
 * Tạo phần ĐỘNG - chỉ chứa lessonNumber và difficulty number
 * Rất ngắn gọn để không chiếm nhiều uncached tokens
 */
function buildDynamicPrompt(lessonNumber, difficulty) {
  return `Học sinh đang học bài: ${lessonNumber}. Chỉ được dùng kiến thức từ bài 16 đến bài ${lessonNumber}.
Áp dụng quy tắc difficulty = ${difficulty}.`;
}

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
  lessonNumber,
}) {
  // Validation lessonNumber - luôn bắt buộc để kiểm tra kiến thức vượt bài
  if (!lessonNumber || lessonNumber < 16 || lessonNumber > 28) {
    throw new Error(`lessonNumber không hợp lệ: ${lessonNumber}. Phải là số từ 16-28`);
  }

  // Phần dynamic prompt - chứa lessonNumber và difficulty rules
  const dynamicPrompt = buildDynamicPrompt(lessonNumber, difficulty);

  // User prompt: dữ liệu cụ thể từng lần gọi
  const userPrompt = `ĐỀ BÀI:
${question || "Không có đề"}

MÃ NGUỒN HỌC SINH:
\`\`\`python
${code || "Không có code"}
\`\`\`

INPUT: ${input || "Không có input"}
OUTPUT THỰC TẾ: ${output || "Không có output"}`;

  try {
    // Messages được sắp xếp để tối ưu cache:
    // 1. system (STATIC) → phần này giống nhau mọi request → OpenAI cache prefix
    // 2. system (DYNAMIC) → lessonNumber + difficulty rules
    // 3. user → dữ liệu bài làm cụ thể
    const response = await client.chat.completions.create({
      model: "gpt-5.4-mini",
      messages: [
        { role: "system", content: STATIC_SYSTEM_PROMPT },
        { role: "system", content: dynamicPrompt },
        { role: "user", content: userPrompt },
      ],
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
      const { prompt_tokens, completion_tokens, total_tokens, prompt_tokens_details } = response.usage;
      const cached = prompt_tokens_details?.cached_tokens || 0;
      const uncached = prompt_tokens - cached;
      console.log(`🔢 Token usage | Prompt: ${prompt_tokens} (cached: ${cached}, uncached: ${uncached}) | Completion: ${completion_tokens} | Total: ${total_tokens}`);
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
