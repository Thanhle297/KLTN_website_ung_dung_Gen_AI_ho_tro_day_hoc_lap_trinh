// insert_bai18_questions.js
const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;

const client = new MongoClient(uri);

function tc(input, output) {
  return {
    input: Array.isArray(input) ? input : [input],
    expected: output
  };
}

function ex(input, output) {
  return { input, output };
}

async function run() {
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const questions = db.collection("question");

    // XÓA CÁC CÂU HỎI CŨ CỦA BÀI 18
    await questions.deleteMany({ topic: "18", courseId: "10" });
    console.log("✔ Đã xóa câu hỏi cũ của bài 18.");

    // ==========================
    // TẠO DANH SÁCH CÂU HỎI
    // ==========================

    const data = [

      // =======================
      // PHẦN 1: bai18_1
      // =======================

      {
        id: 1,
        lessonId: "bai18_1",
        question: `Bạn đang đăng ký vào CLB Âm nhạc. Nhập tên bài hát yêu thích và in ra:
"Bài hát <tên bài hát> đã được thêm vào danh sách đăng kí."`,
        ex: [
          ex("Hãy trao cho anh", "Bài hát Hãy trao cho anh đã được thêm vào danh sách đăng kí."),
          ex("Chạy ngay đi", "Bài hát Chạy ngay đi đã được thêm vào danh sách đăng kí.")
        ],
        testcase: [
          tc("Hãy trao cho anh", "Bài hát Hãy trao cho anh đã được thêm vào danh sách đăng kí."),
          tc("Chạy ngay đi", "Bài hát Chạy ngay đi đã được thêm vào danh sách đăng kí."),
          tc("Lạc trôi", "Bài hát Lạc trôi đã được thêm vào danh sách đăng kí.")
        ]
      },

      {
        id: 2,
        lessonId: "bai18_1",
        question: `Nhập họ và tên. In ra tên nước ngoài theo dạng: <tên> + " " + <họ>.`,
        ex: [
          ex("Nguyễn\nAn", "An Nguyễn"),
          ex("Trần\nBình", "Bình Trần")
        ],
        testcase: [
          tc(["Nguyễn", "An"], "An Nguyễn"),
          tc(["Trần", "Bình"], "Bình Trần"),
          tc(["Lê", "Nam"], "Nam Lê")
        ]
      },

      {
        id: 3,
        lessonId: "bai18_1",
        question: `Nhập năm sinh và in ra tuổi (năm hiện tại = 2025).`,
        ex: [
          ex("2004", "21"),
          ex("1999", "26")
        ],
        testcase: [
          tc("2004", "21"),
          tc("1999", "26"),
          tc("2010", "15")
        ]
      },

      {
        id: 4,
        lessonId: "bai18_1",
        question: `Nhập điện áp (float). In ra giá trị điện áp gấp đôi.`,
        ex: [
          ex("3.5", "7.0"),
          ex("-2.0", "-4.0")
        ],
        testcase: [
          tc("3.5", "7.0"),
          tc("-2.0", "-4.0"),
          tc("1.25", "2.5")
        ]
      },

      {
        id: 5,
        lessonId: "bai18_1",
        question: `Nhập giá 1 phần bánh mì và số lượng. In ra tổng tiền.`,
        ex: [
          ex("12.5\n2", "25.0"),
          ex("15\n4", "60.0")
        ],
        testcase: [
          tc(["12.5", "2"], "25.0"),
          tc(["15", "4"], "60.0"),
          tc(["10", "3"], "30.0")
        ]
      },

      // =======================
      // PHẦN 2: bai18_2
      // =======================

      {
        id: 6,
        lessonId: "bai18_2",
        question: `Nhập điểm Toán, Lý, Hóa. In ra điểm trung bình.`,
        ex: [
          ex("8\n7.5\n9", "8.166666666666666"),
          ex("7.5\n6.5\n8.5", "7.5")
        ],
        testcase: [
          tc(["8", "7.5", "9"], "8.166666666666666"),
          tc(["7.5", "6.5", "8.5"], "7.5"),
          tc(["9", "9", "9"], "9.0")
        ]
      },

      {
        id: 7,
        lessonId: "bai18_2",
        question: `Nhập giá 1 thiệp và số thiệp. Tính số tiền.`,
        ex: [
          ex("2000\n13", "26000"),
          ex("2500\n31", "77500")
        ],
        testcase: [
          tc(["2000", "13"], "26000"),
          tc(["2500", "31"], "77500"),
          tc(["1000", "10"], "10000")
        ]
      },

      {
        id: 8,
        lessonId: "bai18_2",
        question: `Nhập bán kính r > 0. Tính chu vi và diện tích hình tròn (π=3.14).`,
        ex: [
          ex("5", "31.400000000000002\n78.5"),
          ex("2.5", "15.700000000000001\n19.625")
        ],
        testcase: [
          tc("5", "31.400000000000002\n78.5"),
          tc("2.5", "15.700000000000001\n19.625"),
          tc("1", "6.28\n3.14")
        ]
      },

      {
        id: 9,
        lessonId: "bai18_2",
        question: `Nhập cân nặng (kg) và chiều cao (m). Tính BMI.`,
        ex: [
          ex("50\n1.6", "19.531249999999996"),
          ex("45\n1.5", "20.0")
        ],
        testcase: [
          tc(["50", "1.6"], "19.531249999999996"),
          tc(["45", "1.5"], "20.0"),
          tc(["60", "1.7"], "20.761245674740486")
        ]
      },

      {
        id: 10,
        lessonId: "bai18_2",
        question: `Nhập n và m. In số kẹo mỗi bạn được và phần dư.`,
        ex: [
          ex("17\n5", "3\n2"),
          ex("53\n8", "6\n5")
        ],
        testcase: [
          tc(["17", "5"], "3\n2"),
          tc(["53", "8"], "6\n5"),
          tc(["20", "3"], "6\n2")
        ]
      },

      // =======================
      // PHẦN 3: bai18_3
      // =======================

      {
        id: 11,
        lessonId: "bai18_3",
        question: `Nhập x,y. In tổng, hiệu, tích, thương nguyên, phần dư.`,
        ex: [
          ex("17\n5", "22\n12\n85\n3\n2"),
          ex("20\n4", "24\n16\n80\n5\n0")
        ],
        testcase: [
          tc(["17", "5"], "22\n12\n85\n3\n2"),
          tc(["20", "4"], "24\n16\n80\n5\n0"),
          tc(["9", "2"], "11\n7\n18\n4\n1")
        ]
      },

      {
        id: 12,
        lessonId: "bai18_3",
        question: `Nhập ss → phút và giờ.`,
        ex: [
          ex("3600", "60\n1"),
          ex("125", "2\n0")
        ],
        testcase: [
          tc("3600", "60\n1"),
          tc("125", "2\n0"),
          tc("7200", "120\n2")
        ]
      },

      {
        id: 13,
        lessonId: "bai18_3",
        question: `Nhập ss → ngày, giờ, phút, giây.`,
        ex: [
          ex("684500", "7\n22\n8\n20"),
          ex("86461", "1\n0\n1\n1")
        ],
        testcase: [
          tc("684500", "7\n22\n8\n20"),
          tc("86461", "1\n0\n1\n1"),
          tc("90061", "1\n1\n1\n1")
        ]
      },

      {
        id: 14,
        lessonId: "bai18_3",
        question: `Tam giác: nhập a,b,c. Tính chu vi & diện tích Heron.`,
        ex: [
          ex("3\n4\n5", "12\n6.0"),
          ex("7\n9\n12", "28\n31.304951684997057")
        ],
        testcase: [
          tc(["3","4","5"], "12\n6.0"),
          tc(["7","9","12"], "28\n31.304951684997057"),
          tc(["6","6","6"], "18\n15.588457268119896")
        ]
      },

      {
        id: 15,
        lessonId: "bai18_4",
        question: `Phiếu theo dõi sức khỏe: nhập cân nặng, chiều cao → BMI + lượng nước.`,
        ex: [
          ex("50\n1.6", "19.531249999999996\n1.5"),
          ex("60\n1.7", "20.761245674740486\n1.8")
        ],
        testcase: [
          tc(["50","1.6"], "19.531249999999996\n1.5"),
          tc(["60","1.7"], "20.761245674740486\n1.8"),
          tc(["45","1.5"], "20.0\n1.35")
        ]
      }

    ];

    // Insert câu hỏi
    await questions.insertMany(
      data.map(q => ({
        ...q,
        topic: "18",
        courseId: "10"
      }))
    );

    console.log("✔ Đã chèn đầy đủ 15 câu hỏi Bài 18 vào 3 sublesson.");

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
