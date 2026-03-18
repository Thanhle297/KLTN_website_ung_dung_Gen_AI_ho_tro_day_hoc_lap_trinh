// routes/callpromt.js
const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// JSON Schema cho mode "full" - có quiz + instruct
const fullPromptSchema = {
  type: "object",
  properties: {
    quizzes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description:
              "Câu hỏi trắc nghiệm gợi mở giúp học sinh tự tìm ra lỗi",
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
      description:
        "Câu hỏi trắc nghiệm gợi mở (rỗng nếu code đúng hoàn toàn)",
    },
    instructs: {
      type: "array",
      items: { type: "string" },
      description: "Danh sách hướng dẫn cho học sinh (tiếng Việt, ngắn gọn)",
    },
  },
  required: ["quizzes", "instructs"],
  additionalProperties: false,
};

// JSON Schema cho mode "instruct_only" - chỉ instruct, không quiz/answer
const instructOnlySchema = {
  type: "object",
  properties: {
    instructs: {
      type: "array",
      items: { type: "string" },
      description: "Danh sách hướng dẫn gợi ý cho học sinh (tiếng Việt)",
    },
  },
  required: ["instructs"],
  additionalProperties: false,
};

/**
 * Gọi OpenAI để đánh giá và hướng dẫn bài làm Python của học sinh
 * @param {Object} params - Tham số đầu vào
 * @param {string} params.code - Mã nguồn Python của học sinh
 * @param {string} params.question - Đề bài
 * @param {string} params.error - Kết quả lỗi từ IDE
 * @param {Object} params.testcase - Testcase chứa expected
 * @param {string} params.mode - "full" hoặc "instruct_only"
 * @param {number} params.lessonNumber - Số bài học (16-28)
 * @returns {Object} Kết quả đánh giá {quizzes, instructs, raw}
 */
async function callPromptAI({
  code,
  question,
  error,
  testcase,
  mode = "full",
  lessonNumber,
}) {
  // Validation lessonNumber
  if (!lessonNumber || lessonNumber < 16 || lessonNumber > 28) {
    throw new Error(`lessonNumber không hợp lệ: ${lessonNumber}`);
  }

  // Phần giới hạn kiến thức dùng chung cho cả 2 mode
  const knowledgeLimit = `
Học sinh học lập trình Python theo thứ tự nội dung các bài:
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

Học sinh hiện tại đang học bài: ${lessonNumber}
**QUAN TRỌNG - GIỚI HẠN KIẾN THỨC**:
- Học sinh CHỈ được học đến bài ${lessonNumber}.
- TUYỆT ĐỐI KHÔNG gợi ý sử dụng kiến thức, cú pháp, hoặc khái niệm từ các bài sau bài ${lessonNumber}.
- Chỉ sử dụng các khái niệm từ bài 16 đến bài ${lessonNumber} để hướng dẫn.
- Nếu code học sinh sử dụng kiến thức vượt quá bài ${lessonNumber}, hãy nhắc em dùng cách đơn giản hơn phù hợp với trình độ.`;

  // Phần dữ liệu bài làm dùng chung
  const studentData = `
Code học sinh:
\`\`\`python
${code}
\`\`\`

Đề bài: ${question || "Không có"}
Kết quả sai: ${error}
Expected: ${testcase.expected}`;

  let prompt = "";
  let schema = null;
  let schemaName = "";

  // ---------------- FULL PROMPT (DỄ) ----------------
  if (mode === "full") {
    schema = fullPromptSchema;
    schemaName = "code_evaluation_full";
    prompt = `
Bạn là một giáo viên Tin học ở Việt Nam.
${knowledgeLimit}

NHIỆM VỤ:
1. Nhận code và kết quả thông báo từ IDE do học sinh lập trình bằng Python.
2. Chấm điểm dựa trên:
   - Tính đúng đắn (Correctness): code có chạy đúng với yêu cầu đề bài không?
   - Hiệu suất (Efficiency): thuật toán có hợp lý, tránh lặp thừa không?
   - Chất lượng code (Code Quality): đặt tên biến rõ ràng, dễ đọc.
3. Đưa ra hướng dẫn cho học sinh sửa bài sai hoặc tối ưu, KHÔNG đưa đáp án hoàn chỉnh.

QUY TẮC VỀ "instructs":
- Mỗi phần tử trong mảng "instructs" là MỘT chuỗi hướng dẫn hoàn chỉnh.
- Hướng dẫn đầu tiên: mô tả ngắn gọn tình trạng bài làm (đúng/sai ở đâu).
- Hướng dẫn thứ hai: đưa ra CÁC BƯỚC CỤ THỂ để học sinh tự viết lại, KHÔNG đưa code.
  Dùng format có đánh số bước rõ ràng bên trong 1 chuỗi, ví dụ:
  "Em hãy thử viết lại chương trình theo các bước sau:\n1. Dùng input() để nhập s1 và s2.\n2. Dùng toán tử in để kiểm tra s2 có trong s1 không.\n3. Dùng câu lệnh if để in ra \"Có\" nếu đúng, ngược lại in \"Không\".\nEm hãy thử lại nhé!"
- Nếu code đúng hoàn toàn, chỉ đưa ra lời khen ngắn gọn.
- Nếu IDE báo lỗi cú pháp, gợi ý vị trí dòng sai và hướng sửa.
- KHÔNG đưa code hoàn chỉnh, chỉ mô tả bằng lời các bước cần làm.

QUY TẮC VỀ "quizzes":
- Nếu code đúng hoàn toàn → mảng rỗng [].
- Nếu IDE báo lỗi → tạo **đúng 3** câu hỏi trắc nghiệm gợi mở:
  + Câu 1: hỏi về vị trí dòng sai.
  + Câu 2: hỏi về nguyên nhân lỗi sai.
  + Câu 3: hỏi về cách sửa lỗi.
- Nếu IDE không báo lỗi nhưng code sai ngữ nghĩa → tạo **đúng 3** câu hỏi trắc nghiệm để định hướng tìm vị trí sai và cách sửa.
- Mỗi câu hỏi có ĐÚNG 3 đáp án, correctIndex là index đáp án đúng (0, 1, hoặc 2).
- LUÔN tạo đủ 3 câu hỏi, không ít hơn.

LƯU Ý QUAN TRỌNG:
- KHÔNG đưa code hoàn chỉnh cho học sinh, chỉ gợi mở.
- Gợi ý đơn giản nhất có thể.
- Luôn khuyến khích học sinh tự suy nghĩ và thử lại code.
- Trả lời bằng tiếng Việt.

${studentData}`;
  }

  // ---------------- INSTRUCT ONLY (KHÁ) ----------------
  else if (mode === "instruct_only") {
    schema = instructOnlySchema;
    schemaName = "code_evaluation_instruct";
    prompt = `
Bạn là giáo viên Tin học ở Việt Nam.
${knowledgeLimit}

NHIỆM VỤ:
Chỉ trả về hướng dẫn gợi ý trong mảng "instructs".
TUYỆT ĐỐI KHÔNG tạo câu hỏi trắc nghiệm hay đáp án code.

YÊU CẦU NGHIÊM NGẶT:
- Mỗi gợi ý là 1 chuỗi ngắn gọn trong mảng "instructs".
- Dùng câu định hướng như: "hãy kiểm tra lại...", "hãy xem lại yêu cầu...".
- Không có phần mở đầu, kết luận hay lời chào.
- Không được đưa ra code hoàn chỉnh cho học sinh, chỉ gợi ý.
- Không liệt kê các bước chi tiết, chỉ gợi ý ngắn gọn.
- Nếu không có gì để gợi ý, trả về: ["Hãy thử kiểm tra lại đầu vào và kết quả mong đợi."]
- Trả lời bằng tiếng Việt.

Ví dụ hợp lệ:
["Hãy xem lại dòng 3, có thể em thiếu dấu hai chấm.", "Hãy kiểm tra biến n trước khi sử dụng."]

${studentData}`;
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: schemaName,
          strict: true,
          schema: schema,
        },
      },
    });

    const rawContent = response.choices[0].message.content || "{}";

    // Log token usage
    // if (response.usage) {
    //   console.log("🔢 Token usage (callPromptAI):");
    //   console.log("  Mode:", mode);
    //   console.log("  Prompt:", response.usage.prompt_tokens);
    //   console.log("  Completion:", response.usage.completion_tokens);
    //   console.log("  Total:", response.usage.total_tokens);
    // }

    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (parseErr) {
      console.error("❌ Lỗi parse JSON từ AI:", parseErr.message);
      console.error("Raw content:", rawContent);
      return {
        quizzes: [],
        instructs: ["Lỗi xử lý phản hồi từ AI."],
        raw: rawContent,
      };
    }

    // Log response từ AI
    // console.log("📤 callPromptAI Response:");
    // console.log("  Mode:", mode);
    // console.log("  Quizzes:", parsed.quizzes?.length || 0);
    // console.log("  Instructs:", parsed.instructs?.length || 0);
    // console.log("  Parsed:", JSON.stringify(parsed, null, 2));

    // Trả về kết quả
    return {
      quizzes: parsed.quizzes || [],
      instructs: parsed.instructs || [],
      raw: rawContent,
    };
  } catch (err) {
    console.error("❌ Lỗi gọi OpenAI:", err.message);
    return {
      quizzes: [],
      instructs: ["Lỗi khi gọi AI để phân tích code."],
      raw: "",
    };
  }
}

module.exports = { callPromptAI };
