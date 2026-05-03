// components/admin/report/ReportSearchBar.jsx
// Thanh tìm kiếm + nút xuất CSV + làm mới cho trang Báo cáo điểm
import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  useTheme,
} from "@mui/material";
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { gradientButtonSx } from "../../../styles/adminTokens";

/**
 * @param {object}   props
 * @param {string}   props.searchTerm     - Giá trị ô tìm kiếm hiện tại
 * @param {Function} props.onSearchChange - Callback khi thay đổi ô tìm kiếm
 * @param {Function} props.onExport       - Callback xuất CSV
 * @param {boolean}  props.exporting      - Đang xuất?
 * @param {Function} props.onRefresh      - Callback tải lại dữ liệu
 * @param {boolean}  props.loading        - Đang tải?
 */
const ReportSearchBar = ({
  searchTerm,
  onSearchChange,
  onExport,
  exporting,
  onRefresh,
  loading,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        mb: 3,
        display: "flex",
        gap: 2,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <TextField
        placeholder="Tìm kiếm học sinh..."
        size="small"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{ minWidth: 250 }}
      />

      <Box sx={{ flex: 1 }} />

      <Button
        variant="contained"
        startIcon={
          exporting ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <DownloadIcon />
          )
        }
        onClick={onExport}
        disabled={exporting}
        sx={{
          textTransform: "none",
          ...gradientButtonSx(theme),
        }}
      >
        {exporting ? "Đang xuất..." : "Xuất CSV"}
      </Button>

      <Tooltip title="Tải lại dữ liệu">
        <IconButton onClick={onRefresh} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

ReportSearchBar.displayName = "ReportSearchBar";

export default React.memo(ReportSearchBar);
