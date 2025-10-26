const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Trích xuất nội dung trong thẻ <instruct> để lấy hướng dẫn AI
 */
function extractInstructs(text) {
  const instructs = [];
  const regex = /<instruct>([\s\S]*?)<\/instruct>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    instructs.push(match[1].trim());
  }
  return instructs;
}

/**
 * Gọi OpenAI API với prompt nhẹ cho CodeExSimple
 */
async function callPromptSimple({ code, question, input, output }) {
  const prompt = `
Bạn là giáo viên Tin học Việt Nam.
Học sinh vừa chạy một đoạn code Python. Hãy:
1. Phân tích xem kết quả có hợp lý không.
2. Nếu sai, chỉ ra nguyên nhân có thể.
3. Đưa ra gợi ý ngắn gọn để sửa, dùng thẻ <instruct> để bao hướng dẫn.
4. Không viết câu hỏi, không có đáp án, không ghi "đúng/sai" rõ ràng, chỉ hướng dẫn.
5. Nếu kết quả hợp lý thì ghi:
<instruct>Code của bạn chạy đúng, không cần chỉnh sửa.</instruct>

Code học sinh:
\`\`\`python
${code || "Không có code"}
\`\`\`

Đề bài: ${question || "Không có đề"}
Input: ${input || "Không có input"}
Output: ${output || "Không có output"}
`;

  try {
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
      instructs.length > 0 ? instructs.join("\n\n") : text || "AI không phản hồi.";

    return { success: true, guide, raw: text };
  } catch (err) {
    console.error("❌ Lỗi gọi OpenAI simple:", err);
    return {
      success: false,
      guide: "Lỗi khi gọi AI để phân tích code.",
      raw: "",
    };
  }
}

module.exports = { callPromptSimple };
