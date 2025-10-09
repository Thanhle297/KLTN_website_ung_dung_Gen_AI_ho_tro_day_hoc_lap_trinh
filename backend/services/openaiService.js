// services/openaiService.js
const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // key của server bạn
  // baseURL: process.env.OPENAI_BASE_URL,       // URL của server tương thích
});

// Hàm gọi model
async function callOpenAI(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano", // model tương thích
      messages: [
        { role: "system", content: "Bạn là giáo viên Tin học tại Việt Nam." },
        { role: "user", content: prompt },
      ],
      // timeout: 30000, // timeout max 30s
      max_tokens: 1000, // max token 1 lan su dung
      temperature: 0.7, // tao sinh 0.7
    });

    console.log("Prompt tokens:", completion.usage.prompt_tokens);
    console.log("Completion tokens:", completion.usage.completion_tokens);
    console.log("Tổng token:", completion.usage.total_tokens);

    // Trả về theo format execute.js đang parse
    return {
      candidates: [
        {
          content: {
            parts: [
              {
                text: completion.choices[0].message.content,
              },
            ],
          },
        },
      ],
    };
  } catch (err) {
    console.error("OpenAI API error:", err);
    throw err;
  }
}

module.exports = { callOpenAI };
