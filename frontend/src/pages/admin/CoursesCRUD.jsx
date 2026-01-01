import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Stack,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
  TableContainer,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { Edit, Delete } from "@mui/icons-material";

import useAdminAPI from "../../hook/useAdminAPI";

export default function CoursesCRUD() {
  const api = useAdminAPI();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    courseId: "",
    title: "",
    description: "",
  });

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showMessage = (msg, severity = "success") =>
    setSnack({ open: true, message: msg, severity });

  const handleCloseSnack = () => setSnack((prev) => ({ ...prev, open: false }));

  /* ==================== LOAD ==================== */
  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await api.getCourses();
      setCourses(res.data);
    } catch (err) {
      showMessage("Lỗi tải khóa học", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  /* ==================== FORM ==================== */
  const openCreate = () => {
    setEditing(null);
    setForm({
      courseId: "",
      title: "",
      description: "",
    });
    setOpenDialog(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      courseId: item.courseId,
      title: item.title,
      description: item.description,
    });
    setOpenDialog(true);
  };

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* ==================== SAVE ==================== */
  const handleSave = async () => {
    try {
      if (!form.courseId || !form.title) {
        showMessage("courseId và title là bắt buộc", "warning");
        return;
      }

      if (editing) {
        await api.updateCourse(editing.courseId, form);
        showMessage("Cập nhật khóa học thành công");
      } else {
        await api.createCourse(form);
        showMessage("Thêm khóa học thành công");
      }

      setOpenDialog(false);
      loadCourses();
    } catch {
      showMessage("Lỗi lưu khóa học", "error");
    }
  };

  /* ==================== DELETE ==================== */
  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa khóa học: ${item.title}`)) return;

    try {
      await api.deleteCourse(item.courseId);
      showMessage("Xóa thành công");
      loadCourses();
    } catch {
      showMessage("Lỗi xóa khóa học", "error");
    }
  };

  /* ==================== RENDER ==================== */
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        p: 3,
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: 4,
          p: 3,
          mb: 3,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            📚 Quản lý Khóa học
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreate}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              px: 3,
              py: 1.5,
              borderRadius: 3,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
              "&:hover": {
                background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                transform: "translateY(-2px)",
                boxShadow: "0 6px 20px rgba(102, 126, 234, 0.6)",
              },
              transition: "all 0.3s ease",
            }}
          >
            Thêm khóa học
          </Button>
        </Stack>
      </Box>

      {/* Courses Table */}
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <CircularProgress
            size={60}
            sx={{
              color: "white",
            }}
          />
        </Box>
      ) : (
        <Paper
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      py: 2,
                    }}
                  >
                    ID
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    Tiêu đề
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    Mô tả
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {courses.map((c) => (
                  <TableRow
                    key={c.courseId}
                    sx={{
                      "&:hover": {
                        backgroundColor: "#f7fafc",
                        transform: "scale(1.01)",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                      },
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>{c.courseId}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{c.title}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 300,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "#4a5568",
                      }}
                    >
                      {c.description}
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <IconButton
                          onClick={() => openEdit(c)}
                          sx={{
                            background:
                              "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                            color: "white",
                            width: 36,
                            height: 36,
                            "&:hover": {
                              background:
                                "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                              transform: "scale(1.1)",
                            },
                            transition: "all 0.2s ease",
                          }}
                          size="small"
                        >
                          <Edit sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(c)}
                          sx={{
                            background:
                              "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                            color: "white",
                            width: 36,
                            height: 36,
                            "&:hover": {
                              background:
                                "linear-gradient(135deg, #fee140 0%, #fa709a 100%)",
                              transform: "scale(1.1)",
                            },
                            transition: "all 0.2s ease",
                          }}
                          size="small"
                        >
                          <Delete sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}

                {courses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                      <Typography variant="h6" color="text.secondary">
                        😔 Không có khóa học nào
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
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
          {editing ? "✏️ Chỉnh sửa khóa học" : "➕ Thêm khóa học"}
        </DialogTitle>

        <DialogContent sx={{ mt: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Course ID"
              value={form.courseId}
              onChange={(e) => handleChange("courseId", e.target.value)}
              fullWidth
              disabled={!!editing}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              label="Tiêu đề"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              label="Mô tả"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
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
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
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

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnack}
          severity={snack.severity}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
