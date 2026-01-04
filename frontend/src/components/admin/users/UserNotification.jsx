import React from "react";
import { Snackbar, Alert } from "@mui/material";

const UserNotification = ({ open, message, severity, onClose }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          borderRadius: 2,
          fontWeight: 600,
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default React.memo(UserNotification);
