import unittest
from main import execute_code_with_input  # đổi your_module thành tên file chứa code

class TestExecuteCode(unittest.TestCase):
    def test_simple_print(self):
        code = "print('Hello World')"
        out, err = execute_code_with_input(code, "")
        self.assertEqual(out, "Hello World")
        self.assertIsNone(err)

    def test_with_input(self):
        code = "n = int(input())\nprint(n * 2)"
        out, err = execute_code_with_input(code, "5\n")
        self.assertEqual(out, "10")
        self.assertIsNone(err)

    def test_runtime_error(self):
        code = "print(1/0)"  # lỗi chia cho 0
        out, err = execute_code_with_input(code, "")
        self.assertIsNone(out)
        self.assertIn("ZeroDivisionError", err)

    def test_timeout(self):
        code = "while True: pass"  # vòng lặp vô hạn
        out, err = execute_code_with_input(code, "", timeout=1)
        self.assertIsNone(out)
        self.assertIn("timed out", err)

if __name__ == "__main__":
    unittest.main()
