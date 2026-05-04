import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  useTheme,
} from "@mui/material";
import useCategoryAPI from "../../../hook/useCategoryAPI";
import { sortCategoriesByName } from "../../../utils/categorySort";

const QuestionFormDialog = ({
  open,
  editing,
  onClose,
  onSave,
  courseId,
  categories: categoriesProp,
}) => {
  const theme = useTheme();
  const categoryApi = useCategoryAPI();

  const [form, setForm] = useState({
    question: "",
    category: "",
    categoryId: "",
    ex: [{ input: "", output: "" }],
    testcase: [{ input: [""], expected: "" }],
    echo_input: false,
    topic: "",
    courseId: courseId || "",
  });

  // Danh sách categories (từ prop hoặc tự fetch)
  const [categories, setCategories] = useState([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const modules = {
    toolbar: [
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["code-block", "blockquote"],
      ["clean"],
    ],
  };

  // Load categories khi mở dialog
  useEffect(() => {
    if (!open) return;

    if (categoriesProp && categoriesProp.length > 0) {
      setCategories(sortCategoriesByName(categoriesProp));
    } else {
      // Tự fetch nếu không được truyền prop
      categoryApi
        .getCategories(courseId)
        .then((res) =>
          setCategories(sortCategoriesByName(res.data.categories || []))
        )
        .catch((err) => console.error("Lỗi lấy danh mục:", err));
    }
  }, [open, courseId, categoriesProp, categoryApi]);

  useEffect(() => {
    if (editing) {
      setForm({
        question: editing.question,
        category: editing.category || "",
        categoryId: editing.categoryId || "",
        ex: editing.ex || [{ input: "", output: "" }],
        testcase: editing.testcase || [{ input: [""], expected: "" }],
        echo_input: editing.echo_input ?? false,
        topic: editing.topic || "",
        courseId: editing.courseId || courseId || "",
      });
    } else {
      setForm({
        question: "",
        category: "",
        categoryId: "",
        ex: [{ input: "", output: "" }],
        testcase: [{ input: [""], expected: "" }],
        echo_input: false,
        topic: "",
        courseId: courseId || "",
      });
    }
    setShowNewCategory(false);
    setNewCategoryName("");
  }, [editing, open, courseId]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSave(form);
  };

  // Category dropdown change
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === "__create_new__") {
      setShowNewCategory(true);
      return;
    }
    const cat = categories.find((c) => c._id === value);
    setForm((prev) => ({
      ...prev,
      categoryId: value,
      category: cat ? cat.name : "",
    }));
  };

  // Tạo danh mục nhanh
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await categoryApi.createCategory({
        courseId: courseId || null,
        name: newCategoryName.trim(),
      });
      const newCat = res.data.category;
      setCategories((prev) => sortCategoriesByName([...prev, newCat]));
      setForm((prev) => ({
        ...prev,
        categoryId: newCat._id,
        category: newCat.name,
      }));
      setShowNewCategory(false);
      setNewCategoryName("");
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi tạo danh mục");
    }
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
          background: theme.palette.background.paper,
          backdropFilter: "blur(10px)",
        },
      }}
    >
      <DialogTitle
        sx={{
          background: theme.palette.gradient.primary,
          color: "white",
          fontWeight: 700,
          fontSize: "1.5rem",
        }}
      >
        {editing ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi"}
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* CÂU HỎI */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
              Câu hỏi
            </Typography>
            <ReactQuill
              theme="snow"
              value={form.question}
              onChange={(value) => handleChange("question", value)}
              modules={modules}
              style={{
                borderRadius: 8,
              }}
            />
            <style>{`
              .ql-container {
                border-bottom-left-radius: 8px;
                border-bottom-right-radius: 8px;
                min-height: 100px;
              }
              .ql-toolbar {
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
              }
            `}</style>
          </Box>

          {/* CATEGORY - Select Dropdown */}
          <FormControl fullWidth size="small">
            <InputLabel>Danh mục</InputLabel>
            <Select
              value={form.categoryId || ""}
              onChange={handleCategoryChange}
              label="Danh mục"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">
                <em>Không chọn</em>
              </MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat._id} value={cat._id}>
                  {cat.name}
                </MenuItem>
              ))}
              <Divider />
              <MenuItem value="__create_new__">
                <em>+ Tạo danh mục mới...</em>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Inline tạo danh mục mới */}
          {showNewCategory && (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <TextField
                size="small"
                placeholder="Tên danh mục mới"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateCategory();
                }}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim()}
                sx={{ borderRadius: 2, textTransform: "none", minWidth: 60 }}
              >
                Tạo
              </Button>
              <Button
                size="small"
                onClick={() => setShowNewCategory(false)}
                sx={{ borderRadius: 2, textTransform: "none" }}
              >
                Hủy
              </Button>
            </Box>
          )}

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
                  border: `1px solid ${theme.palette.divider}`,
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
            background: theme.palette.gradient.primary,
            borderRadius: 2,
            textTransform: "none",
            px: 3,
            "&:hover": {
              background: theme.palette.gradient.primaryHover,
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
