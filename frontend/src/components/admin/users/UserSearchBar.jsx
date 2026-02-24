import React from "react";
import { TextField, InputAdornment, useTheme } from "@mui/material";
import { Search } from "@mui/icons-material";

const UserSearchBar = ({ value, onChange }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <TextField
      placeholder="🔍 Tìm kiếm theo username..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: 3,
          backgroundColor: isDark ? theme.palette.background.default : "white",
          "& fieldset": {
            borderColor: theme.palette.divider,
          },
          "&:hover fieldset": {
            borderColor: "#667eea",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#667eea",
          },
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search sx={{ color: "#667eea" }} />
          </InputAdornment>
        ),
      }}
    />
  );
};

export default React.memo(UserSearchBar);
