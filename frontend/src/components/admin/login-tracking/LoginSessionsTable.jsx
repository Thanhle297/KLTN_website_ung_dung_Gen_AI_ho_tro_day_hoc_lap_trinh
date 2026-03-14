import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Stack,
  Avatar,
  Box,
  Pagination,
  Fade,
  useTheme,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  AdminPanelSettings,
  School,
  Person,
  Visibility,
  Circle,
} from "@mui/icons-material";

// Helper: format ngày giờ
const formatDateTime = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Helper: format thời lượng
const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}p`;
  if (m > 0) return `${m}p ${s}s`;
  return `${s}s`;
};

// Map logoutType sang tiếng Việt
const LOGOUT_TYPE_MAP = {
  manual: { label: "Chủ động", color: "success" },
  timeout: { label: "Hết phiên", color: "warning" },
  token_expired: { label: "Token hết hạn", color: "error" },
};

// Map role config
const ROLE_CONFIG = {
  admin: {
    icon: <AdminPanelSettings sx={{ fontSize: 16 }} />,
    label: "Admin",
    color: "secondary",
  },
  teacher: {
    icon: <School sx={{ fontSize: 16 }} />,
    label: "Giáo viên",
    color: "primary",
  },
  user: {
    icon: <Person sx={{ fontSize: 16 }} />,
    label: "Học sinh",
    color: "info",
  },
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const LoginSessionsTable = ({
  sessions = [],
  pagination = {},
  onPageChange,
  onViewUser,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const isOnline = (session) => {
    return !session.logoutAt && new Date(session.tokenExpiry) > new Date();
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        overflow: "hidden",
        backgroundColor: isDark ? theme.palette.background.paper : "white",
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow
              sx={{
                background: isDark
                  ? "rgba(102, 126, 234, 0.1)"
                  : "linear-gradient(135deg, #667eea08 0%, #764ba208 100%)",
              }}
            >
              <TableCell sx={{ fontWeight: 700 }}>Người dùng</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Vai trò</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Đăng nhập</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Đăng xuất</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Thời lượng</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Loại</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                Trạng thái
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                Chi tiết
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có dữ liệu đăng nhập
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session, index) => {
                const online = isOnline(session);
                const roleConf = ROLE_CONFIG[session.role] || ROLE_CONFIG.user;
                const logoutConf = LOGOUT_TYPE_MAP[session.logoutType];

                return (
                  <Fade
                    key={session._id}
                    in={true}
                    style={{ transitionDelay: `${index * 20}ms` }}
                  >
                    <TableRow
                      sx={{
                        "&:hover": {
                          backgroundColor: isDark
                            ? "rgba(102, 126, 234, 0.08)"
                            : "#f7fafc",
                        },
                        transition: "background-color 0.2s",
                      }}
                    >
                      {/* Người dùng */}
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              fontSize: "0.85rem",
                              fontWeight: 700,
                              background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            }}
                          >
                            {getInitials(session.fullname)}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, lineHeight: 1.3 }}
                            >
                              {session.fullname}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: theme.palette.text.secondary,
                                fontFamily: "monospace",
                              }}
                            >
                              {session.username}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Vai trò */}
                      <TableCell>
                        <Chip
                          icon={roleConf.icon}
                          label={roleConf.label}
                          color={roleConf.color}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                        />
                      </TableCell>

                      {/* Đăng nhập */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                          {formatDateTime(session.loginAt)}
                        </Typography>
                      </TableCell>

                      {/* Đăng xuất */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
                          {online ? "—" : formatDateTime(session.logoutAt)}
                        </Typography>
                      </TableCell>

                      {/* Thời lượng */}
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            color: isDark ? "#4facfe" : "#3182ce",
                          }}
                        >
                          {online ? "Đang hoạt động" : formatDuration(session.duration)}
                        </Typography>
                      </TableCell>

                      {/* Loại logout */}
                      <TableCell>
                        {logoutConf ? (
                          <Chip
                            label={logoutConf.label}
                            color={logoutConf.color}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>

                      {/* Trạng thái */}
                      <TableCell align="center">
                        <Chip
                          icon={
                            <Circle
                              sx={{
                                fontSize: 10,
                                color: online ? "#43e97b" : theme.palette.text.disabled,
                              }}
                            />
                          }
                          label={online ? "Online" : "Offline"}
                          size="small"
                          variant="outlined"
                          color={online ? "success" : "default"}
                          sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                        />
                      </TableCell>

                      {/* Xem chi tiết user */}
                      <TableCell align="center">
                        <Tooltip title="Xem lịch sử đăng nhập">
                          <IconButton
                            onClick={() => onViewUser(session)}
                            size="small"
                            sx={{
                              background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              color: "white",
                              width: 32,
                              height: 32,
                              "&:hover": {
                                background:
                                  "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                              },
                            }}
                          >
                            <Visibility sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </Fade>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={(_, page) => onPageChange(page)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Paper>
  );
};

export default React.memo(LoginSessionsTable);
