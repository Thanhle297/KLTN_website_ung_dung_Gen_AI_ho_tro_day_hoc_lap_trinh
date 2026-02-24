import { Box, Paper, useTheme } from "@mui/material";

export default function AdminPageCard({ children }) {
  const theme = useTheme();
  
  return (
    <Box sx={{ p: 1 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          borderRadius: 3,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {children}
      </Paper>
    </Box>
  );
}
