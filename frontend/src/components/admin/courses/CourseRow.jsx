import React from "react";
import { TableRow, TableCell, IconButton, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { Edit, Delete, People, Assessment, School } from "@mui/icons-material";

const CourseRow = React.memo(
  ({ course, onEdit, onDelete, onManageUsers, onManageTeachers, onViewReport }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    return (
      <TableRow
        sx={{
          transition: "all 0.2s ease",
          cursor: "pointer",
          "&:hover": {
            backgroundColor: isDark ? "rgba(102, 126, 234, 0.08)" : "#f7fafc",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          },
        }}
      >
        {/* Course ID (badge style) */}
        <TableCell>
          <Typography
            variant="body2"
            sx={{
              color: isDark ? theme.palette.text.secondary : "#718096",
              fontFamily: "monospace",
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#edf2f7",
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              display: "inline-block",
              fontWeight: 600,
            }}
          >
            {course.courseId}
          </Typography>
        </TableCell>

        {/* Title */}
        <TableCell>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: isDark ? theme.palette.text.primary : "#2d3748",
            }}
          >
            {course.title}
          </Typography>
        </TableCell>

        {/* Description */}
        <TableCell
          sx={{
            maxWidth: 300,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: isDark ? theme.palette.text.secondary : "#4a5568",
            }}
          >
            {course.description}
          </Typography>
        </TableCell>

        {/* Actions */}
        <TableCell align="right">
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="Chỉnh sửa khóa học">
              <IconButton
                onClick={() => onEdit(course)}
                sx={{
                  background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                  color: "white",
                  width: 36,
                  height: 36,
                  "&:hover": {
                    background: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
                  },
                  transition: "all 0.2s ease",
                }}
                size="small"
              >
                <Edit sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Xóa khóa học">
              <IconButton
                onClick={() => onDelete(course)}
                sx={{
                  background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                  color: "white",
                  width: 36,
                  height: 36,
                  "&:hover": {
                    background: "linear-gradient(135deg, #fee140 0%, #fa709a 100%)",
                  },
                  transition: "all 0.2s ease",
                }}
                size="small"
              >
                <Delete sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Quản lý giáo viên">
              <IconButton
                onClick={() => onManageTeachers(course)}
                sx={{
                  background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
                  color: "white",
                  width: 36,
                  height: 36,
                  "&:hover": {
                    background: "linear-gradient(135deg, #38ef7d 0%, #11998e 100%)",
                  },
                  transition: "all 0.2s ease",
                }}
                size="small"
              >
                <School sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Quản lý học sinh">
              <IconButton
                onClick={() => onManageUsers(course)}
                sx={{
                  background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                  color: "white",
                  width: 36,
                  height: 36,
                  "&:hover": {
                    background: "linear-gradient(135deg, #f5576c 0%, #f093fb 100%)",
                  },
                  transition: "all 0.2s ease",
                }}
                size="small"
              >
                <People sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Xem điểm học sinh">
              <IconButton
                onClick={() => onViewReport(course)}
                sx={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  width: 36,
                  height: 36,
                  "&:hover": {
                    background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
                  },
                  transition: "all 0.2s ease",
                }}
                size="small"
              >
                <Assessment sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>
      </TableRow>
    );
  }
);

CourseRow.displayName = "CourseRow";
export default CourseRow;