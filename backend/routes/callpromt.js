// routes/callpromt.js
const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function parseBlocks(text) {
  const quizzes = [];
  const instructs = [];
  const corrects = [];
  const answers = [];
  let match;

  const quizRegex = /<quiz>([\s\S]*?)<\/quiz>/g;
  while ((match = quizRegex.exec(text)) !== null) quizzes.push(match[1].trim());

  const instructRegex = /<instruct>([\s\S]*?)<\/instruct>/g;
  while ((match = instructRegex.exec(text)) !== null)
    instructs.push(match[1].trim());

  const correctRegex = /<correct>([\s\S]*?)<\/correct>/g;
  while ((match = correctRegex.exec(text)) !== null)
    corrects.push(match[1].trim());

  const answerRegex = /<answer>([\s\S]*?)<\/answer>/g;
  while ((match = answerRegex.exec(text)) !== null)
    answers.push(match[1].trim());

  return { quizzes, instructs, corrects, answers };
}

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
    throw new Error(`lessonNumber không hợp lệ:${lessonNumber}`);
  }
  let prompt = "";

  // ---------------- FULL PROMPT (DỄ) ----------------
  if (mode === "full") {
    prompt = `
Bạn là một giáo viên Tin học ở Việt Nam.Học sinh học lập trình python
theo thứ tự nội dung các bài như sau:
Bài 16: Học về câu lệnh print đơn giản
Bài 17: Học về biến và các lệnh gán
Bài 18: Học về các câu lệnh vào ra đơn giản
Bài 19: Học về câu lệnh rẽ nhánh if
Bài 20: Học về câu lệnh lặp for
Bài 21: Học về câu lệnh lặp while
Bài 22: Học về kiểu dữ liệu danh sách
Bài 23: Học về các lệnh làm việc với dữ liệu danh sách
Bài 24: Học về xâu kí tự
Bài 25: Học về các lệnh làm việc với xâu kí tự
Bài 26: Học về hàm trong python
Bài 27: Học về tham số của hàm
Bài 28: Học về phạm vi của biến
Học sinh hiện tại đang học bài: ${lessonNumber}
**QUAN TRỌNG - GIỚI HẠN KIẾN THỨC**:
- Học sinh CHỈ được học đến bài ${lessonNumber}.
- TUYỆT ĐỐI KHÔNG gợi ý sử dụng kiến thức, cú pháp, hoặc khái niệm từ các bài sau bài ${lessonNumber}.
- Chỉ sử dụng các khái niệm từ bài 16 đến bài ${lessonNumber} để hướng dẫn.
- Nếu code học sinh sử dụng kiến thức vượt quá bài ${lessonNumber}, hãy nhắc em dùng cách đơn giản hơn phù hợp với trình độ.
Nhiệm vụ chính của bạn là:
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
*KHÔNG ĐƯA CODE HOÀN CHỈNH CHO HỌC SINH CHỈ GỢI MỞ ĐỂ HỌC SINH CÓ THỂ DỰA VÀO ĐÓ ĐỂ LÀM BÀI.
*GỢI Ý CHO HỌC SINH ĐƠN GIẢN NHẤT CÓ THỂ.

Ví dụ câu hướng dẫn phù hợp:  
“Em hãy xem lại dòng 1 cũng như cú pháp câu lệnh input xem còn thiếu gì không nhé”.

Code học sinh:
\`\`\`python
${code}
\`\`\`

Đề bài: ${question || "Không có"}
Kết quả sai: ${error}
Expected: ${testcase.expected}
`;
  }

  // ---------------- INSTRUCT ONLY (KHÁ) ----------------
  else if (mode === "instruct_only") {
    prompt = `
Bạn là giáo viên Tin học ở Việt Nam. 
Học sinh đang học bài ${lessonNumber} (chuỗi bài 16-28).
**QUAN TRỌNG**: Chỉ gợi ý dùng kiến thức từ bài 16-${lessonNumber}. KHÔNG đề cập các khái niệm từ bài sau.

Danh sách bài học:
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
Hãy chỉ trả về hướng dẫn trong **một hoặc nhiều thẻ <instruct>**, 
và tuyệt đối KHÔNG được tạo ra bất kỳ thẻ <quiz>, <answer>, <correct>, <question>, <ans> nào.
Nếu trong câu trả lời có chứa các thẻ đó thì hãy **bỏ qua hoàn toàn**, chỉ xuất <instruct>.

Yêu cầu nghiêm ngặt:
- Mỗi gợi ý nằm trong 1 thẻ <instruct>.
- Không có phần mở đầu, kết luận hay lời chào.
- Không giải thích bên ngoài thẻ.
- Không được tạo câu hỏi trắc nghiệm hay đáp án.
- Không được đưa ra code hoàn chỉnh cho học sinh mà chỉ là dạng gợi ý.
- Nếu không có gì để gợi ý, chỉ trả về 1 thẻ <instruct> nói rằng: 
  "<instruct>Hãy thử kiểm tra lại đầu vào và kết quả mong đợi.</instruct>"

Ví dụ hợp lệ:
<instruct>Hãy xem lại dòng 3, có thể em thiếu dấu hai chấm.</instruct>
<instruct>Hãy kiểm tra biến n trước khi sử dụng.</instruct>

Dưới đây là dữ liệu cần xử lý:

Code học sinh:
\`\`\`python
${code}
\`\`\`

Đề bài: ${question || "Không có"}
Kết quả sai: ${error}
Expected: ${testcase.expected}
`;
  }

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
    temperature: 0,
  });

  const text =
    response.output_text ||
    response.candidates?.[0]?.content?.[0]?.text ||
    "Không có phản hồi từ AI.";

  return { ...parseBlocks(text), raw: text };
}

module.exports = { callPromptAI };
