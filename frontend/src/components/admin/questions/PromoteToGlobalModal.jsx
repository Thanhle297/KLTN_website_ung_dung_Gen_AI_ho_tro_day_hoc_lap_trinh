import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import { toast } from "sonner";
import useAdminAPI from "../../../hook/useAdminAPI";

const PromoteToGlobalModal = ({
  open,
  onClose,
  selectedQuestionIds,
  sourceCourseId,
  questions,
  onSuccess,
}) => {
  const theme = useTheme();
  const api = useAdminAPI();

  const [step, setStep] = useState("confirm"); // "confirm" | "result"
  const [promoting, setPromoting] = useState(false);
  const [results, setResults] = useState(null);

  // Reset khi mở
  useEffect(() => {
    if (open) {
      setStep("confirm");
      setResults(null);
    }
  }, [open]);

  // Strip HTML helper
  const stripHtml = (html) => {
    if (!html) return "";
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim()
      .substring(0, 80);
  };

  // Lấy câu hỏi đã chọn
  const selectedQuestions = (questions || []).filter((q) =>
    (selectedQuestionIds || []).includes(q.id)
  );

  // Promote
  const handlePromote = async (skipDuplicateCheck = false) => {
    const ids = skipDuplicateCheck
      ? results
          .filter((r) => r.status === "duplicate_warning")
          .map((r) => r.sourceId)
      : selectedQuestionIds;

    if (!ids || !ids.length) return;

    setPromoting(true);
    try {
      const res = await api.promoteToGlobal(
        ids,
        sourceCourseId,
        skipDuplicateCheck
      );
      const data = res.data;

      if (!skipDuplicateCheck && data.totalWarnings > 0) {
        // Có cảnh báo trùng lặp → chuyển sang bước result
        setResults(data.promoted);
        setStep("result");
        toast.success(`Đã đẩy ${data.totalCreated} câu hỏi lên ngân hàng chung`);
        if (data.totalCreated > 0) {
          onSuccess && onSuccess();
        }
      } else {
        // Tất cả thành công
        toast.success(
          `Đã đẩy ${data.totalCreated} câu hỏi lên ngân hàng chung`
        );
        onSuccess && onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi đẩy câu hỏi");
    } finally {
      setPromoting(false);
    }
  };

  // Đẩy force các câu trùng lặp
  const handleForcePromote = () => {
    handlePromote(true);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          background: theme.palette.gradient.danger,
          color: "white",
          fontWeight: 700,
        }}
      >
        {step === "confirm"
          ? "Đẩy câu hỏi lên Ngân hàng chung"
          : "Kết quả"}
      </DialogTitle>

      <DialogContent dividers>
        {step === "confirm" ? (
          <>
            <Typography sx={{ mb: 2 }}>
              Bạn đang đẩy <strong>{selectedQuestions.length}</strong> câu hỏi
              lên Ngân hàng chung.
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Bản gốc trong khóa học vẫn được giữ nguyên. Danh mục sẽ được
                tạo tự động nếu chưa tồn tại.
              </Typography>
            </Alert>

            {/* Danh sách câu hỏi */}
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Danh mục</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Nội dung (tóm tắt)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedQuestions.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell>{q.id}</TableCell>
                      <TableCell>{q.category || "—"}</TableCell>
                      <TableCell>{stripHtml(q.question)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <>
            {/* Bước 2: Kết quả */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {results &&
                results.map((r) => (
                  <Box
                    key={r.sourceId}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor:
                        r.status === "created"
                          ? "rgba(76, 175, 80, 0.08)"
                          : "rgba(255, 152, 0, 0.08)",
                      border: "1px solid",
                      borderColor:
                        r.status === "created"
                          ? "rgba(76, 175, 80, 0.3)"
                          : "rgba(255, 152, 0, 0.3)",
                    }}
                  >
                    {r.status === "created" ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <WarningIcon color="warning" fontSize="small" />
                    )}
                    <Typography variant="body2">
                      Câu #{r.sourceId}
                      {r.status === "created"
                        ? ` → Tạo thành công (ID mới: ${r.newGlobalId})`
                        : ` → ${r.message}`}
                    </Typography>
                    {r.status === "created" && (
                      <Chip
                        label="Thành công"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                    {r.status === "duplicate_warning" && (
                      <Chip
                        label="Trùng lặp"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                ))}
            </Box>

            {results &&
              results.some((r) => r.status === "duplicate_warning") && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Một số câu hỏi có nội dung tương tự trong Ngân hàng chung. Bạn
                  có thể bấm "Đẩy câu trùng lặp" để tạo bản sao bất kể trùng.
                </Alert>
              )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {step === "confirm" ? (
          <>
            <Button onClick={onClose} sx={{ textTransform: "none" }}>
              Hủy
            </Button>
            <Button
              variant="contained"
              onClick={() => handlePromote(false)}
              disabled={promoting || !selectedQuestions.length}
              sx={{ textTransform: "none" }}
            >
              {promoting
                ? "Đang xử lý..."
                : "Đẩy lên Ngân hàng chung"}
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => {
                onSuccess && onSuccess();
                onClose();
              }}
              sx={{ textTransform: "none" }}
            >
              Đóng
            </Button>
            {results &&
              results.some((r) => r.status === "duplicate_warning") && (
                <Button
                  variant="contained"
                  color="warning"
                  onClick={handleForcePromote}
                  disabled={promoting}
                  sx={{ textTransform: "none" }}
                >
                  {promoting ? "Đang xử lý..." : "Đẩy câu trùng lặp"}
                </Button>
              )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(PromoteToGlobalModal);
