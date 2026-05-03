// =============================================================================
// AdminSidebar.jsx
// Drawer + nav menu có phân nhóm (Tổng quan / Người dùng / Học liệu / Câu hỏi).
// Responsive:
//   - mobile (<sm): temporary drawer (overlay)
//   - tablet (sm-lg) khi sidebarOpen=true: collapsed mode (icon only, w=72)
//   - desktop: persistent drawer w=260
// =============================================================================

import React, { memo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Toolbar,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ADMIN_MENU_GROUPS } from "./adminMenuConfig";

export const DRAWER_FULL_WIDTH = 260;
export const DRAWER_COLLAPSED_WIDTH = 72;

const TRANSITION =
  "width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease";

// ---- Single menu item ------------------------------------------------------
const SidebarItem = memo(function SidebarItem({
  item,
  isSelected,
  isCollapsed,
  onClick,
}) {
  const { label, path, Icon } = item;
  const theme = useTheme();

  const button = (
    <ListItemButton
      component={Link}
      to={`/admin/${path}`}
      selected={isSelected}
      onClick={onClick}
      sx={{
        borderRadius: 2,
        mb: 0.5,
        py: 1.1,
        px: isCollapsed ? 1.5 : 2,
        minHeight: 44,
        justifyContent: isCollapsed ? "center" : "flex-start",
        position: "relative",
        transition:
          "background-color 0.2s ease, color 0.2s ease, transform 0.15s ease",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        color: theme.palette.text.secondary,

        "&.Mui-selected": {
          backgroundColor: theme.palette.adminBg.sidebarSelected,
          color: theme.palette.primary.main,
          fontWeight: 600,
          "&::before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: 8,
            bottom: 8,
            width: 3,
            borderRadius: 2,
            background: theme.palette.gradient.primary,
          },
          "& .MuiListItemIcon-root": { color: theme.palette.primary.main },
          "&:hover": {
            backgroundColor: theme.palette.adminBg.sidebarSelected,
          },
        },
        "&:hover": {
          backgroundColor: theme.palette.adminBg.sidebarHover,
          color: theme.palette.text.primary,
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2,
        },
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: isCollapsed ? 0 : 36,
          mr: isCollapsed ? 0 : 1.25,
          color: "inherit",
          justifyContent: "center",
          "& svg": { fontSize: 22 },
        }}
      >
        <Icon />
      </ListItemIcon>
      {!isCollapsed && (
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            fontWeight: isSelected ? 600 : 500,
            fontSize: "0.92rem",
            noWrap: true,
            color: "inherit",
          }}
        />
      )}
    </ListItemButton>
  );

  if (isCollapsed) {
    return (
      <Tooltip title={label} placement="right" arrow>
        {button}
      </Tooltip>
    );
  }
  return button;
});

// ---- Sidebar content -------------------------------------------------------
const SidebarContent = memo(function SidebarContent({
  isCollapsed,
  currentPath,
  onItemClick,
}) {
  const theme = useTheme();

  const isItemSelected = (path, exactRoot) => {
    const sub = currentPath.replace(/^\/admin\/?/, "");
    if (exactRoot) return sub === "" || sub === "/";
    if (!path) return false;
    return sub === path || sub.startsWith(path + "/");
  };

  return (
    <Box sx={{ overflow: "auto", py: 1.5, px: isCollapsed ? 1 : 1.5 }}>
      {ADMIN_MENU_GROUPS.map((group, idx) => (
        <List
          key={group.id}
          dense
          disablePadding
          subheader={
            !isCollapsed ? (
              <ListSubheader
                disableSticky
                sx={{
                  bgcolor: "transparent",
                  color: theme.palette.text.secondary,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  lineHeight: 2,
                  mt: idx === 0 ? 0 : 1.5,
                  pl: 1.25,
                }}
              >
                {group.title}
              </ListSubheader>
            ) : (
              // Khi collapsed: thêm separator nhẹ thay subheader
              idx > 0 && (
                <Box
                  sx={{
                    mx: "auto",
                    my: 1,
                    width: 24,
                    height: 1,
                    bgcolor: theme.palette.divider,
                  }}
                />
              )
            )
          }
        >
          {group.items.map((item) => (
            <SidebarItem
              key={item.path || "dashboard"}
              item={item}
              isSelected={isItemSelected(item.path, item.exactRoot)}
              isCollapsed={isCollapsed}
              onClick={onItemClick}
            />
          ))}
        </List>
      ))}
    </Box>
  );
});

// ---- Drawer wrapper --------------------------------------------------------
function AdminSidebar({ open, onClose, isMobile, isCollapsed }) {
  const theme = useTheme();
  const location = useLocation();
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg"));

  // Collapsed chỉ áp dụng cho tablet (không áp cho mobile temporary)
  const collapsed = !isMobile && (isCollapsed ?? (isTablet && open));
  const width = isMobile
    ? DRAWER_FULL_WIDTH
    : collapsed
    ? DRAWER_COLLAPSED_WIDTH
    : DRAWER_FULL_WIDTH;

  const handleItemClick = useCallback(() => {
    if (isMobile) onClose?.();
  }, [isMobile, onClose]);

  const drawerPaperSx = {
    width,
    boxSizing: "border-box",
    transition: TRANSITION,
    overflowX: "hidden",
  };

  return (
    <Box component="nav" aria-label="Điều hướng quản trị">
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={onClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              ...drawerPaperSx,
              width: DRAWER_FULL_WIDTH,
            },
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
          <SidebarContent
            isCollapsed={false}
            currentPath={location.pathname}
            onItemClick={handleItemClick}
          />
        </Drawer>
      ) : (
        <Drawer
          variant="persistent"
          open={open}
          sx={{
            "& .MuiDrawer-paper": drawerPaperSx,
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
          <SidebarContent
            isCollapsed={collapsed}
            currentPath={location.pathname}
            onItemClick={handleItemClick}
          />
        </Drawer>
      )}
    </Box>
  );
}

export default React.memo(AdminSidebar);
