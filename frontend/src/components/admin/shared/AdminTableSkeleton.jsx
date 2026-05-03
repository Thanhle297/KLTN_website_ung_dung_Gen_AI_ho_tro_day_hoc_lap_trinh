import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Paper,
  useTheme,
} from "@mui/material";
import { adminCardSx } from "../../../styles/adminTokens";

/**
 * Skeleton loading cho bảng dữ liệu admin.
 *
 * @param {number} rows     - Số dòng skeleton (mặc định 5)
 * @param {number} columns  - Số cột skeleton (mặc định 5)
 */
const AdminTableSkeleton = ({ rows = 5, columns = 5 }) => {
  const theme = useTheme();

  return (
    <TableContainer component={Paper} sx={adminCardSx(theme)}>
      <Table>
        <TableHead>
          <TableRow>
            {Array.from({ length: columns }).map((_, j) => (
              <TableCell key={j}>
                <Skeleton
                  variant="text"
                  sx={{ fontSize: "1rem", width: "60%" }}
                />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: columns }).map((__, j) => (
                <TableCell key={j}>
                  <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

AdminTableSkeleton.displayName = "AdminTableSkeleton";

export default React.memo(AdminTableSkeleton);
