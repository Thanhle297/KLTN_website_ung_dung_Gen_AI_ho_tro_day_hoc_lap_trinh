import React from "react";
import {
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  useTheme,
} from "@mui/material";
import { Search, CalendarMonth } from "@mui/icons-material";

const LoginFilterBar = ({
  search,
  onSearchChange,
  role,
  onRoleChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  period,
  onPeriodChange,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      backgroundColor: isDark ? theme.palette.background.default : "white",
      "& fieldset": { borderColor: theme.palette.divider },
      "&:hover fieldset": { borderColor: "#667eea" },
      "&.Mui-focused fieldset": { borderColor: "#667eea" },
    },
  };

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      alignItems={{ md: "center" }}
      sx={{ mb: 3 }}
    >
      {/* Tìm kiếm username */}
      <TextField
        placeholder="Tìm theo username..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        size="small"
        sx={{ ...inputSx, minWidth: 220 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: "#667eea", fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Lọc vai trò */}
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Vai trò</InputLabel>
        <Select
          value={role}
          label="Vai trò"
          onChange={(e) => onRoleChange(e.target.value)}
          sx={{
            borderRadius: 2,
            backgroundColor: isDark
              ? theme.palette.background.default
              : "white",
          }}
        >
          <MenuItem value="">Tất cả</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="teacher">Giáo viên</MenuItem>
          <MenuItem value="user">Học sinh</MenuItem>
        </Select>
      </FormControl>

      {/* Từ ngày */}
      <TextField
        type="date"
        label="Từ ngày"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        size="small"
        sx={{ ...inputSx, minWidth: 160 }}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CalendarMonth sx={{ color: "#667eea", fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Đến ngày */}
      <TextField
        type="date"
        label="Đến ngày"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        size="small"
        sx={{ ...inputSx, minWidth: 160 }}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CalendarMonth sx={{ color: "#667eea", fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Xem theo Ngày / Tuần */}
      <ToggleButtonGroup
        value={period}
        exclusive
        onChange={(_, val) => val && onPeriodChange(val)}
        size="small"
        sx={{
          "& .MuiToggleButton-root": {
            textTransform: "none",
            fontWeight: 600,
            px: 2,
            "&.Mui-selected": {
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              "&:hover": {
                background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
              },
            },
          },
        }}
      >
        <ToggleButton value="day">Ngày</ToggleButton>
        <ToggleButton value="week">Tuần</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
};

export default React.memo(LoginFilterBar);
