import React from "react";
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  CircularProgress,
  Typography,
  useTheme,
} from "@mui/material";
import CourseRow from "./CourseRow";
import { adminCardSx } from "../../../styles/adminTokens";

const CoursesTable = React.memo(
  ({ courses, loading, onEdit, onDelete, onManageUsers, onManageTeachers, onViewReport }) => {
    const theme = useTheme();
    
    if (loading) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
<CircularProgress
            size={60}
            sx={{
              color: theme.palette.primary.main,
            }}
          />
        </Box>
      );
    }

    return (
<Paper sx={adminCardSx(theme)}>
        <TableContainer>
          <Table>
            <TableHead>
<TableRow
                sx={{
                  background: theme.palette.gradient.primary,
                }}
              >
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    py: 2,
                  }}
                >
                  ID
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Tiêu đề
                </TableCell>
                <TableCell
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Mô tả
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Thao tác
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {courses.map((course) => (
                <CourseRow
                  key={course.courseId}
                  course={course}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onManageUsers={onManageUsers}
                  onManageTeachers={onManageTeachers}
                  onViewReport={onViewReport}
                />
              ))}

              {courses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                      😔 Không có khóa học nào
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }
);

CoursesTable.displayName = "CoursesTable";

export default CoursesTable;
