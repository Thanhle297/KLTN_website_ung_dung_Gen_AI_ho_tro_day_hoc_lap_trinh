import React from "react";
import { TextField, InputAdornment } from "@mui/material";
import { Search } from "@mui/icons-material";

const UserSearchBar = ({ value, onChange }) => {
  return (
    <TextField
      placeholder="🔍 Tìm kiếm theo username..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: 3,
          backgroundColor: "white",
          "& fieldset": {
            borderColor: "#e0e0e0",
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
