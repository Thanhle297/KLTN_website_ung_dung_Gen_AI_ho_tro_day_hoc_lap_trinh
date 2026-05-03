// =============================================================================
// AdminBreadcrumbs.jsx
// Tự động render breadcrumb theo route hiện tại, lấy tên trang từ
// adminMenuConfig (ADMIN_MENU_FLAT). Các trang đặc biệt (course-report)
// được mảng SPECIAL_BREADCRUMBS xử lý riêng.
// =============================================================================

import React, { useMemo } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  Box,
  Breadcrumbs,
  Link as MuiLink,
  Typography,
  useTheme,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import {
  ADMIN_MENU_FLAT,
  ADMIN_MENU_GROUPS,
  findActiveMenuItem,
} from "./adminMenuConfig";

// Map "subpath" -> { label, group }
function buildPathLookup() {
  const map = new Map();
  ADMIN_MENU_GROUPS.forEach((group) => {
    group.items.forEach((item) => {
      map.set(item.path, { label: item.label, group: group.title });
    });
  });
  return map;
}

const PATH_LOOKUP = buildPathLookup();

// Xử lý các route đặc biệt không có trong menu
function getSpecialBreadcrumb(sub) {
  if (sub.startsWith("course-report")) {
    return {
      label: "Báo cáo khóa học",
      parent: "courses",
      parentLabel: "Khóa học",
    };
  }
  return null;
}

function AdminBreadcrumbs() {
  const theme = useTheme();
  const location = useLocation();

  const items = useMemo(() => {
    const sub = location.pathname.replace(/^\/admin\/?/, "");
    const result = [];

    // 1. Trang index (dashboard)
    if (sub === "" || sub === "/") {
      const dash = ADMIN_MENU_FLAT.find((m) => m.exactRoot);
      result.push({ label: dash?.label || "Dashboard", current: true });
      return result;
    }

    // 2. Special routes
    const special = getSpecialBreadcrumb(sub);
    if (special) {
      result.push({
        label: special.parentLabel,
        to: `/admin/${special.parent}`,
      });
      result.push({ label: special.label, current: true });
      return result;
    }

    // 3. Match mục menu chuẩn
    const active = findActiveMenuItem(location.pathname);
    if (active && !active.exactRoot) {
      const meta = PATH_LOOKUP.get(active.path);
      if (meta?.group) {
        // Group chỉ hiển thị dạng text (không điều hướng được)
        result.push({ label: meta.group, muted: true });
      }
      result.push({ label: active.label, current: true });
      return result;
    }

    // 4. Fallback: hiển thị segment thô
    const segments = sub.split("/").filter(Boolean);
    let acc = "";
    segments.forEach((seg, i) => {
      acc += "/" + seg;
      const isLast = i === segments.length - 1;
      result.push({
        label: decodeURIComponent(seg),
        to: !isLast ? `/admin${acc}` : undefined,
        current: isLast,
      });
    });
    return result;
  }, [location.pathname]);

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="Đường dẫn"
      sx={{
        py: 1,
        "& .MuiBreadcrumbs-ol": { flexWrap: "wrap" },
        "& .MuiBreadcrumbs-separator": {
          color: theme.palette.text.disabled,
          mx: 0.75,
        },
      }}
    >
      <MuiLink
        component={RouterLink}
        to="/admin"
        underline="hover"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          color: theme.palette.text.secondary,
          fontWeight: 500,
          fontSize: "0.85rem",
          "&:hover": { color: theme.palette.primary.main },
        }}
      >
        <HomeIcon fontSize="small" />
        <Box component="span">Quản trị</Box>
      </MuiLink>

      {items.map((it, idx) => {
        if (it.current) {
          return (
            <Typography
              key={idx}
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              {it.label}
            </Typography>
          );
        }
        if (it.muted || !it.to) {
          return (
            <Typography
              key={idx}
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 500,
                fontSize: "0.85rem",
              }}
            >
              {it.label}
            </Typography>
          );
        }
        return (
          <MuiLink
            key={idx}
            component={RouterLink}
            to={it.to}
            underline="hover"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
              fontSize: "0.85rem",
              "&:hover": { color: theme.palette.primary.main },
            }}
          >
            {it.label}
          </MuiLink>
        );
      })}
    </Breadcrumbs>
  );
}

export default React.memo(AdminBreadcrumbs);
