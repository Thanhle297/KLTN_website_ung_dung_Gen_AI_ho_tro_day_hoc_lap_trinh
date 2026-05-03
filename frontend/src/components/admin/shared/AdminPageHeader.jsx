import React from "react";
import { Box, Typography, Stack, useTheme } from "@mui/material";
import {
  adminHeaderCardSx,
  gradientTextSx,
  iconCircleSx,
} from "../../../styles/adminTokens";

/**
 * Header chung cho các trang admin CRUD.
 *
 * @param {ReactNode} icon      - Icon MUI (vd: <People />)
 * @param {string}    title     - Tiêu đề trang ("Quản lý Người dùng")
 * @param {string}    subtitle  - (Tuỳ chọn) Dòng phụ ("Tổng cộng: 50")
 * @param {ReactNode} actions   - (Tuỳ chọn) Nút CTA / group buttons (góc phải)
 * @param {ReactNode} filters   - (Tuỳ chọn) Dropdowns, search, chips bên dưới title row
 */
const AdminPageHeader = ({ icon, title, subtitle, actions, filters }) => {
  const theme = useTheme();

  return (
    <Box sx={adminHeaderCardSx(theme)}>
      {/* Dòng 1: icon + title + actions */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={2}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          {icon && <Box sx={iconCircleSx(theme)}>{icon}</Box>}
          <Box>
            <Typography variant="h5" sx={gradientTextSx(theme)}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>

        {actions && (
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ flexWrap: "wrap" }}
            justifyContent="flex-end"
          >
            {actions}
          </Stack>
        )}
      </Stack>

      {/* Dòng 2: filters (dropdowns, search, chips) */}
      {filters && <Box sx={{ mt: 2.5 }}>{filters}</Box>}
    </Box>
  );
};

AdminPageHeader.displayName = "AdminPageHeader";

export default React.memo(AdminPageHeader);
