import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControlLabel,
  Switch,
} from "@mui/material";

const QuestionFormDialog = ({ open, editing, onClose, onSave }) => {
  const [form, setForm] = useState({
    question: "",
    ex: [{ input: "", output: "" }],
    testcase: [{ input: [""], expected: "" }],
    echo_input: false,
    topic: "",
    courseId: "10",
  });

  useEffect(() => {
    if (editing) {
      setForm({
        question: editing.question,
        category: editing.category || "",
        ex: editing.ex || [{ input: "", output: "" }],
        testcase: editing.testcase || [{ input: [""], expected: "" }],
        echo_input: editing.echo_input ?? false,
        topic: editing.topic || "",
        courseId: editing.courseId || "10",
      });
    } else {
      setForm({
        question: "",
        category: "",
        ex: [{ input: "", output: "" }],
        testcase: [{ input: [""], expected: "" }],
        echo_input: false,
        topic: "",
        courseId: "10",
      });
    }
  }, [editing, open]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSave(form);
  };

  // Examples handlers
  const updateExample = (index, field, value) => {
    const updated = [...form.ex];
    updated[index][field] = value;
    handleChange("ex", updated);
  };

  const addExample = () => {
    handleChange("ex", [...form.ex, { input: "", output: "" }]);
  };

  // Testcase handlers
  const updateTestcase = (index, field, value) => {
    const updated = [...form.testcase];
    if (field === "input") {
      updated[index].input = value.split("\n");
    } else {
      updated[index][field] = value;
    }
    handleChange("testcase", updated);
  };

  const addTestcase = () => {
    handleChange("testcase", [...form.testcase, { input: [""], expected: "" }]);
  };

  const removeTestcase = (index) => {
    const updated = form.testcase.filter((_, i) => i !== index);
    handleChange("testcase", updated);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(10px)",
        },
      }}
    >
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          fontWeight: 700,
          fontSize: "1.5rem",
        }}
      >
        {editing ? "✏️ Chỉnh sửa câu hỏi" : "➕ Thêm câu hỏi"}
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* CÂU HỎI */}
          <TextField
            label="Câu hỏi"
            value={form.question}
            onChange={(e) => handleChange("question", e.target.value)}
            fullWidth
            multiline
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />

          {/* CATEGORY (New) */}
          <TextField
            label="Danh mục (Category)"
            value={form.category || ""}
            onChange={(e) => handleChange("category", e.target.value)}
            fullWidth
            size="small"
            placeholder="VD: Java, Python, Loop..."
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />

          {/* echo_input SWITCH */}
          <FormControlLabel
            control={
              <Switch
                checked={form.echo_input}
                onChange={(e) => handleChange("echo_input", e.target.checked)}
                color="success"
              />
            }
            label={
              <Typography fontWeight={500}>
                In lại input khi chạy (echo_input)
              </Typography>
            }
          />

          {/* EXAMPLES */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Ví dụ (ex)
            </Typography>

            {form.ex.map((item, index) => (
              <Box key={index} sx={{ display: "flex", gap: 2, mb: 2 }}>
                <TextField
                  label="Input"
                  value={item.input}
                  onChange={(e) =>
                    updateExample(index, "input", e.target.value)
                  }
                  fullWidth
                  multiline
                  minRows={2}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />

                <TextField
                  label="Output"
                  value={item.output}
                  onChange={(e) =>
                    updateExample(index, "output", e.target.value)
                  }
                  fullWidth
                  multiline
                  minRows={2}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
            ))}

            <Button
              variant="outlined"
              onClick={addExample}
              sx={{
                borderRadius: 2,
                textTransform: "none",
              }}
            >
              + Thêm ví dụ
            </Button>
          </Box>

          {/* TESTCASE */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Testcase (mỗi dòng là một input)
            </Typography>

            {form.testcase.map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  mb: 2,
                  p: 2,
                  border: "1px solid #ddd",
                  borderRadius: 2,
                }}
              >
                <TextField
                  label="Input (nhiều dòng)"
                  value={(item.input || []).join("\n")}
                  onChange={(e) =>
                    updateTestcase(index, "input", e.target.value)
                  }
                  fullWidth
                  multiline
                  minRows={3}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />

                <TextField
                  label="Expected Output"
                  value={item.expected}
                  onChange={(e) =>
                    updateTestcase(index, "expected", e.target.value)
                  }
                  fullWidth
                  multiline
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />

                <Button
                  color="error"
                  onClick={() => removeTestcase(index)}
                  sx={{
                    alignSelf: "flex-end",
                    borderRadius: 2,
                    textTransform: "none",
                  }}
                >
                  Xóa testcase
                </Button>
              </Box>
            ))}

            <Button
              variant="outlined"
              onClick={addTestcase}
              sx={{
                borderRadius: 2,
                textTransform: "none",
              }}
            >
              + Thêm testcase
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            px: 3,
          }}
        >
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: 2,
            textTransform: "none",
            px: 3,
            "&:hover": {
              background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
            },
          }}
        >
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionFormDialog;
