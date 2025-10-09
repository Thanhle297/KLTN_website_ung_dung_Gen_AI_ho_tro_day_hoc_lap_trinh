// testPromptOpenAI.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// Cấu hình OpenAI
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Hàm parse để bóc tách dữ liệu
function parseBlocks(text) {
  const quizzes = [];
  const instructs = [];
  const corrects = [];
  const answers = [];

  let match;

  // Quiz
  const quizRegex = /<quiz>([\s\S]*?)<\/quiz>/g;
  while ((match = quizRegex.exec(text)) !== null) {
    quizzes.push(match[1].trim());
  }

  // Instruct
  const instructRegex = /<instruct>([\s\S]*?)<\/instruct>/g;
  while ((match = instructRegex.exec(text)) !== null) {
    instructs.push(match[1].trim());
  }

  // Correct
  const correctRegex = /<correct>([\s\S]*?)<\/correct>/g;
  while ((match = correctRegex.exec(text)) !== null) {
    corrects.push(match[1].trim());
  }

  // Answer
  const answerRegex = /<answer>([\s\S]*?)<\/answer>/g;
  while ((match = answerRegex.exec(text)) !== null) {
    answers.push(match[1].trim());
  }

  return { quizzes, instructs, corrects, answers };
}

// Route test
app.get("/api/test", async (req, res) => {
  const prompt = `
Bạn là một giáo viên Tin học ở Việt Nam. Nhiệm vụ chính của bạn là: 
1. Nhận code và kết quả thông báo từ ide do học sinh lập trình bằng Python. 
2. Chấm điểm dựa trên các tiêu chí sau: 
- Tính đúng đắn (Correctness): code có chạy đúng với yêu cầu đề bài không? 
- Hiệu suất (Efficiency): thuật toán có hợp lý, tránh lặp thừa, tránh tốn bộ nhớ không?
- Chất lượng code (Code Quality): đặt tên biến/hàm rõ ràng, có chú thích, dễ đọc, tuân thủ quy tắc lập trình. 
3. Hãy đưa ra các bước hướng dẫn cho học sinh để có thể sửa bài sai hoặc tối ưu nếu code của chính xác được bài nhưng không được cung cấp hẳn đáp án: 
Các bước hướng dẫn của bạn trình bày bao gồm các yếu tố: câu hỏi trắc nghiệm gợi mở, thông báo sửa lỗi tại dòng X. 
- Nếu là câu hỏi trắc nghiệm gợi mở, hãy trình bày trong dấu <quiz> </quiz>.  
  + Nội dung câu hỏi được đặt trong thẻ <question></question>.  
  + Mỗi đáp án đặt trong thẻ <ans></ans>.  
  + Đáp án đúng luôn phải được bọc thêm trong <correct></correct> bên trong <ans>.  
  Ví dụ:  
  <quiz>  
  <question>Đâu là lỗi trong dòng code?</question>  
  <ans><correct>A: Thiếu dấu ngoặc )</correct></ans>  
  <ans>B: Sai biến</ans>  
  <ans>C: Sai vòng lặp</ans>  
  </quiz>  

- Nếu là thông báo thì trình bày trong dấu <instruct></instruct>.  

Khi hiện kết quả, tách các phần thẻ thành từng dòng.  

4. Cấu trúc chung khi thông báo hướng dẫn là đưa ra thông báo tổng quan chương trình.  
- Nếu code đúng, không có bất kì chỉnh sửa nào thêm thì chỉ trả về <instruct></instruct>.  
- Nếu IDE báo lỗi sai thì sau đó sẽ đưa ra câu hỏi theo cấu trúc <quiz></quiz> để hướng dẫn sửa lỗi theo thông báo của IDE lần lượt bao gồm: hỏi về vị trí dòng sai, hỏi về lỗi sai và sau đó đưa ra thông báo gợi ý lỗi cần sửa. Bắt đầu với cú pháp #<số dòng>: Gợi ý định hướng chỉnh sửa.  
- Nếu IDE không báo lỗi nhưng code sai về ngữ nghĩa thì sẽ đưa ra câu hỏi theo cấu trúc <quiz></quiz> để định hướng tìm vị trí sai.  

5. Luôn khuyến khích học sinh tự suy nghĩ và thử lại code, thay vì đưa đáp án hay hướng dẫn cụ thể. Không bao giờ được đưa thẳng đáp án hoàn chỉnh, chỉ hướng dẫn vừa đủ mang tính gợi mở để học sinh tự sửa. Không trình bày các phần giới thiệu, câu dẫn.  

6. Sau tất cả các phần trả lời, ở cuối cùng hãy viết lại câu lệnh chỉnh sửa của dòng sai trong thẻ <answer></answer> theo cú pháp:  
#<số dòng>: đáp án đúng khi chỉnh sửa dòng đó.
*LƯU Ý: PHẦN CHỈNH SỬA DÒNG SAI PHẢI ĐẦY ĐỦ TẤT CẢ DÒNG SAI VÀ PHẦN TRẮC NGHIỆM MỞ PHẢI CHUẨN.  

Ví dụ câu hướng dẫn phù hợp:  
“Em hãy xem lại dòng 1 cũng như cú pháp câu lệnh input xem còn thiếu gì không nhé”.

Code học sinh:
\`\`\`python
n=int(input())
tong = 0
for i in range (1,n+1):
  tong+=i
print(i)
\`\`\`
`;

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      temperature: 0, // cho kết quả chắc chắn
      top_p: 1,
    });

    // Log full object để debug trong terminal
    console.log("=== FULL RESPONSE ===");
    console.dir(response, { depth: null }); // hiển thị toàn bộ JSON

    // Log text đã được AI trả về
    console.log("=== OUTPUT TEXT ===");
    console.log(response.output_text);

    const text =
      response.output_text ||
      response.candidates?.[0]?.content?.[0]?.text ||
      "Không có phản hồi từ AI.";

    const { quizzes, instructs, corrects, answers } = parseBlocks(text);

    res.json({ quizzes, instructs, corrects, answers, raw: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
