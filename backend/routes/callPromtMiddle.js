// routes/callPromtMiddle.js
const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// JSON Schema cho mode "full" (difficulty 0) - có result + instruct + quiz
const fullSchema = {
  type: "object",
  properties: {
    result: {
      type: "string",
      enum: ["PASS", "PARTIAL", "FAIL"],
      description:
        "PASS nếu logic đúng, PARTIAL nếu đúng một phần, FAIL nếu sai",
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
        "Câu hỏi trắc nghiệm gợi mở (rỗng nếu PASS)",
    },
  },
  required: ["result", "instructs", "quizzes"],
  additionalProperties: false,
};

// JSON Schema cho mode "instruct_only" (difficulty 1) - result + instruct, không quiz
const instructOnlySchema = {
  type: "object",
  properties: {
    result: {
      type: "string",
      enum: ["PASS", "PARTIAL", "FAIL"],
      description:
        "PASS nếu logic đúng, PARTIAL nếu đúng một phần, FAIL nếu sai",
    },
    instructs: {
      type: "array",
      items: { type: "string" },
      description: "Danh sách hướng dẫn gợi ý cho học sinh (tiếng Việt)",
    },
  },
  required: ["result", "instructs"],
  additionalProperties: false,
};

// JSON Schema cho mode "result_only" (difficulty 2) - chỉ result
const resultOnlySchema = {
  type: "object",
  properties: {
    result: {
      type: "string",
      enum: ["PASS", "PARTIAL", "FAIL"],
      description:
        "PASS nếu logic đúng, PARTIAL nếu đúng một phần, FAIL nếu sai",
    },
  },
  required: ["result"],
  additionalProperties: false,
};

/**
 * Gọi OpenAI để đánh giá logic code Python của học sinh (Middle Mode)
 * AI LUÔN được gọi bất kể difficulty - chỉ mức chi tiết gợi ý thay đổi
 *
 * @param {Object} params
 * @param {string} params.code - Mã nguồn Python của học sinh
 * @param {string} params.question - Đề bài
 * @param {Array} params.testcaseResults - Kết quả testcase [{input, expected, actual, pass}]
 * @param {number} params.difficulty - Mức độ gợi ý (0=dễ, 1=vừa, 2=khó)
 * @param {number} params.lessonNumber - Số bài học (16-28)
 * @returns {Object} { result: "PASS"|"PARTIAL"|"FAIL", instructs: [], quizzes: [], raw: string }
 */
async function callPromptMiddle({
  code,
  question,
  testcaseResults,
  difficulty = 0,
  lessonNumber,
}) {
  // Validation lessonNumber
  if (!lessonNumber || lessonNumber < 16 || lessonNumber > 28) {
    throw new Error(
      `lessonNumber không hợp lệ: ${lessonNumber}. Phải là số từ 16-28`
    );
  }

  // Giới hạn kiến thức - luôn cần cho việc đánh giá logic
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

  // Format kết quả testcase thành bảng
  const testcaseTable = testcaseResults
    .map(
      (r, i) =>
        `  Testcase ${i + 1}: Input="${r.input}" | Expected="${r.expected}" | Output="${r.actual}" | ${r.pass ? "PASS" : "FAIL"}`
    )
    .join("\n");

  const passedCount = testcaseResults.filter((r) => r.pass).length;
  const totalCount = testcaseResults.length;
  const testcaseSummary = `${passedCount}/${totalCount} testcase PASS`;

  // Quy tắc gợi ý theo difficulty
  let difficultyRule = "";
  let quizRule = "";

  if (difficulty === 0) {
    difficultyRule = `
QUY TẮC VỀ "instructs":
- Mỗi phần tử trong mảng "instructs" là MỘT chuỗi hướng dẫn hoàn chỉnh.
- Hướng dẫn đầu tiên: mô tả ngắn gọn tình trạng bài làm (đúng/sai ở đâu, logic có vấn đề gì).
- Hướng dẫn thứ hai: đưa ra CÁC BƯỚC CỤ THỂ để học sinh tự sửa, KHÔNG đưa code.
  Dùng format có đánh số bước rõ ràng bên trong 1 chuỗi, DÙNG KÝ TỰ XUỐNG DÒNG \\n để tách các bước, ví dụ:
  "Em hãy thử sửa lại chương trình theo các bước sau:\\n1. Dùng input() để nhập giá trị.\\n2. Xử lý dữ liệu theo yêu cầu đề bài.\\n3. In kết quả ra màn hình.\\nEm hãy thử lại nhé!"
- Nếu PASS, chỉ đưa ra lời khen ngắn gọn.
- Nếu PARTIAL, giải thích tại sao chỉ đạt một phần và gợi ý cải thiện.
- KHÔNG đưa code hoàn chỉnh, chỉ mô tả bằng lời các bước cần làm.`;
    quizRule = `
QUY TẮC VỀ "quizzes":
- Nếu PASS → mảng rỗng [].
- Nếu PARTIAL hoặc FAIL → tạo 1-2 câu hỏi trắc nghiệm gợi mở.
- Mỗi câu hỏi có ĐÚNG 3 đáp án, correctIndex là index đáp án đúng (0, 1, hoặc 2).
- Câu hỏi giúp học sinh tự nhận ra vấn đề trong logic code.`;
  } else if (difficulty === 1) {
    difficultyRule = `
QUY TẮC VỀ "instructs":
- Mỗi gợi ý là 1 chuỗi ngắn gọn trong mảng "instructs".
- Dùng câu định hướng như: "hãy kiểm tra lại...", "hãy xem lại yêu cầu...".
- Nếu gợi ý có nhiều ý, DÙNG KÝ TỰ XUỐNG DÒNG \\n để tách từng ý cho dễ đọc.
- Không nói thẳng lỗi sai, chỉ gợi ý hướng.
- Không nêu ví dụ cụ thể, không đưa code.
- Nếu PASS, trả về lời khen ngắn.
- Nếu không có gì để gợi ý, trả về: ["Hãy thử kiểm tra lại đầu vào và kết quả mong đợi."]`;
    quizRule = `
- KHÔNG tạo câu hỏi trắc nghiệm.`;
  } else {
    // difficulty === 2
    difficultyRule = `
- KHÔNG đưa ra bất kỳ hướng dẫn nào.
- Để mảng "instructs" rỗng [].`;
    quizRule = `
- KHÔNG tạo câu hỏi trắc nghiệm.`;
  }

  // PHẦN ĐÁNH GIÁ LOGIC - luôn giống nhau bất kể difficulty
  const evaluationSection = `
PHẦN ĐÁNH GIÁ LOGIC (LUÔN THỰC HIỆN):
Bạn nhận được code học sinh VÀ kết quả chạy testcase tự động. Nhiệm vụ chính là đánh giá LOGIC CODE, không chỉ kết quả output.

TIÊU CHÍ 3 MỨC:
- **PASS**: Logic code đúng theo yêu cầu đề bài, cách giải phù hợp với kiến thức đã học (bài 16 đến ${lessonNumber}).
- **PARTIAL** (đúng một phần):
  + Output đúng (pass testcase) NHƯNG code dùng hardcode, trick, hoặc kiến thức vượt quá bài ${lessonNumber}.
  + Logic có hướng giải quyết đúng NHƯNG output chưa chính xác (sai format, thiếu edge case, lỗi nhỏ).
  + Code thể hiện sự hiểu biết về bài toán nhưng chưa hoàn chỉnh.
- **FAIL**: Logic hoàn toàn sai, không thể hiện hiểu biết về yêu cầu đề bài. Code không liên quan đến bài toán.

QUY TRÌNH ĐÁNH GIÁ:
1. Phân tích yêu cầu đề bài: học sinh cần làm gì?
2. Đọc code: logic có đúng không? Có dùng đúng kiến thức đã học không?
3. Xem kết quả testcase: bao nhiêu pass / fail?
4. Kết hợp:
   - Code logic đúng + all testcase pass → PASS
   - Code logic có vấn đề (hardcode/trick/vượt kiến thức) nhưng pass testcase → PARTIAL
   - Code logic đúng nhưng fail một số testcase (thiếu edge case) → PARTIAL
   - Code logic sai + fail testcase → FAIL
   - Code logic có ý tưởng nhưng fail toàn bộ testcase → xem xét PARTIAL nếu ý tưởng rõ ràng đúng hướng, FAIL nếu không`;

  // Chọn schema và tên
  let schema, schemaName;
  if (difficulty === 0) {
    schema = fullSchema;
    schemaName = "middle_evaluation_full";
  } else if (difficulty === 1) {
    schema = instructOnlySchema;
    schemaName = "middle_evaluation_instruct";
  } else {
    schema = resultOnlySchema;
    schemaName = "middle_evaluation_result";
  }

  const prompt = `
Bạn là giáo viên Tin học ở Việt Nam. Đánh giá bài làm Python của học sinh.
${knowledgeLimit}

${evaluationSection}

${difficultyRule}
${quizRule}

---

ĐỀ BÀI:
${question || "Không có đề"}

MÃ NGUỒN HỌC SINH:
\`\`\`python
${code || "Không có code"}
\`\`\`

KẾT QUẢ TESTCASE TỰ ĐỘNG (${testcaseSummary}):
${testcaseTable}

---

LƯU Ý QUAN TRỌNG:
- PHẢI đánh giá "result" (PASS/PARTIAL/FAIL) dựa trên LOGIC CODE, không chỉ kết quả testcase.
- Trả lời bằng tiếng Việt.
- KHÔNG đưa code hoàn chỉnh cho học sinh.
- Mỗi câu quiz (nếu có) có ĐÚNG 3 đáp án.
`;

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

    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (parseErr) {
      console.error("❌ Lỗi parse JSON từ AI (middle):", parseErr.message);
      console.error("Raw content:", rawContent);
      return {
        result: "FAIL",
        instructs: ["Lỗi xử lý phản hồi từ AI."],
        quizzes: [],
        raw: rawContent,
      };
    }

    // Trả về kết quả - giữ nguyên result từ AI, lọc guide/quizzes theo difficulty
    return {
      result: parsed.result || "FAIL",
      instructs: parsed.instructs || [],
      quizzes: parsed.quizzes || [],
      raw: rawContent,
    };
  } catch (err) {
    console.error("❌ Lỗi gọi OpenAI (middle):", err.message);
    return {
      result: "FAIL",
      instructs: ["Lỗi khi gọi AI để phân tích code."],
      quizzes: [],
      raw: "",
    };
  }
}

module.exports = { callPromptMiddle };
