import { Box, Paper } from "@mui/material";

export default function AdminPageCard({ children }) {
  return (
    <Box sx={{ p: 1 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
        {children}
      </Paper>
    </Box>
  );
}
