import React from "react";
import { Box, Typography, Button, Stack, useTheme } from "@mui/material";
import { PersonAdd } from "@mui/icons-material";

const UserTableHeader = ({ onAddUser }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        background: isDark
          ? theme.palette.background.paper
          : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderRadius: 4,
        p: 3,
        mb: 3,
        boxShadow: isDark
          ? "0 8px 32px rgba(0, 0, 0, 0.3)"
          : "0 8px 32px rgba(0, 0, 0, 0.1)",
        border: isDark ? `1px solid ${theme.palette.divider}` : "none",
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
          👥 Quản lý Người dùng
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={onAddUser}
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
              boxShadow: "0 6px 20px rgba(102, 126, 234, 0.6)",
            },
            transition: "all 0.3s ease",
          }}
        >
          Thêm User Mới
        </Button>
      </Stack>
    </Box>
  );
};

export default React.memo(UserTableHeader);
