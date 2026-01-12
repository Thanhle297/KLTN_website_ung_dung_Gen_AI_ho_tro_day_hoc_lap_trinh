const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function extractResult(text) {
  const m = text.match(/<result>(PASS|FAIL)<\/result>/);
  return m ? m[1] === "PASS" : false;
}

function extractInstructs(text) {
  const instructs = [];
  const regex = /<instruct>([\s\S]*?)<\/instruct>/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    instructs.push(match[1].trim());
  }

  // ✅ LỌC RÁC SAU KHI EXTRACT
  return instructs.filter(
    (s) =>
      s.length > 0 &&
      s !== "." &&
      s !== "**." &&
      s !== "**" &&
      s !== ":" &&
      s !== "**:"
  );
}

async function callPromptSimple({
  code,
  question,
  input,
  output,
  difficulty = 2,
}) {
  let difficultyRule = "";

  if (difficulty === 0) {
    difficultyRule = `
- Chỉ rõ học sinh đang thiếu yêu cầu nào của đề bài.
- Có thể nêu ví dụ mô tả (KHÔNG được đưa code hoàn chỉnh).
- Gợi ý rõ ràng nhưng vẫn mang tính hướng dẫn.
`;
  } else if (difficulty === 1) {
    difficultyRule = `
- Không nói thẳng học sinh sai ở đâu.
- Dùng câu định hướng như: "hãy kiểm tra lại...", "hãy xem lại yêu cầu...".
- Không nêu ví dụ cụ thể.
`;
  } else {
    difficultyRule = `
- Chỉ đánh giá đạt / chưa đạt.
`;
  }

  const prompt = `
Bạn là giáo viên Tin học Việt Nam.

${difficultyRule}
Học sinh vừa làm bài Python theo đề sau:

ĐỀ BÀI:
${question || "Không có đề"}

MÃ NGUỒN HỌC SINH:
\`\`\`python
${code || "Không có code"}
\`\`\`

INPUT: ${input || "Không có input"}
OUTPUT THỰC TẾ: ${output || "Không có output"}

---
Hãy đánh giá bài làm theo 3 bước:

1️⃣ **Phân tích yêu cầu của đề bài**:  
   - Học sinh cần in ra hoặc thực hiện những thông tin, kết quả nào?  
   - Liệt kê các yêu cầu cụ thể (ví dụ: phải in ra tên, tuổi, nghề nghiệp...).

2️⃣ **Đối chiếu đầu ra**:  
   - So sánh OUTPUT của học sinh với yêu cầu trên.  
   - Nếu học sinh chỉ in ra một phần (ví dụ: chỉ có tên mà thiếu tuổi hoặc nghề nghiệp), phải coi là **CHƯA ĐẠT YÊU CẦU**.

3️⃣ **Đưa ra hướng dẫn hoặc nhận xét trong thẻ <instruct>**:
   - Nếu học sinh **đáp ứng đầy đủ yêu cầu và đầu ra hợp lý** →  
     <instruct>Code của bạn chạy đúng và đáp ứng đầy đủ yêu cầu. Chúc mừng!</instruct>
   - Nếu học sinh **thiếu hoặc sai bất kỳ phần nào** →  
     <instruct>Hãy kiểm tra lại: bạn cần in ra đủ tất cả thông tin theo đề bài. Gợi ý chỉnh sửa: ...</instruct>
   - Nếu có lỗi logic, cú pháp, hoặc sai cách nhập/xuất →  
     <instruct>Mô tả lỗi và hướng dẫn cụ thể để sửa.</instruct>

⚠️ Lưu ý:
- Trả lời **ngắn gọn bằng tiếng Việt**.
- Chỉ dùng thẻ <instruct> cho mỗi hướng dẫn, không thêm ký hiệu khác.
- Nếu đề bài có nhiều yêu cầu, phải kiểm tra đủ **từng phần**.
- Không hướng dẫn quá chi tiết đến mức gần như cho học sinh toàn bộ đáp án.

Cuối cùng, hãy kết luận:
- ĐÚNG → <result>PASS</result>
- SAI / THIẾU → <result>FAIL</result>

---

Bắt đầu đánh giá.
`;

  try {
    // 🔍 Log đề bài gửi đi
    // console.log("📘 ĐỀ BÀI GỬI LÊN AI:");
    // console.log(question);
    // console.log("---------------------------------------");
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      temperature: 0.4,
    });

    const text =
      response.output_text ||
      response.candidates?.[0]?.content?.[0]?.text ||
      "Không có phản hồi từ AI.";

    const instructs = extractInstructs(text);
    const guide =
      instructs.length > 0
        ? instructs.join("\n\n")
        : text || "AI không phản hồi.";

    const isCorrect = extractResult(text); // ✅ DÒNG QUYẾT ĐỊNH

    return {
      success: true,
      isCorrect,
      guide: difficulty === 2 ? "" : guide,
      raw: text,
    };
  } catch (err) {
    console.error("❌ Lỗi gọi OpenAI simple:", err);
    return {
      success: false,
      guide: "Lỗi khi gọi AI để phân tích code.",
      raw: "",
    };
  }
}

// ✅ BẮT BUỘC PHẢI CÓ DÒNG NÀY
module.exports = { callPromptSimple };
