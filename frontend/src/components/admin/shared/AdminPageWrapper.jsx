import React from "react";
import { Box, useTheme } from "@mui/material";
import { adminPageWrapperSx } from "../../../styles/adminTokens";

/**
 * Wrapper bao ngoài mọi trang admin — cung cấp background gradient,
 * padding responsive và min-height nhất quán.
 *
 * @param {ReactNode} children  - Nội dung trang
 * @param {object}    sx        - (Tuỳ chọn) Override style bổ sung
 */
const AdminPageWrapper = ({ children, sx }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        ...adminPageWrapperSx(theme),
        minHeight: "100vh",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

AdminPageWrapper.displayName = "AdminPageWrapper";

export default React.memo(AdminPageWrapper);
