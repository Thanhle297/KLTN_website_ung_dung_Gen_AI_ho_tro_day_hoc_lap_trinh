// utils/response.js
// Helper functions cho API response thống nhất
// Giữ nguyên response shape hiện tại nhưng chuẩn hóa cách gọi

/**
 * Trả về response thành công với dữ liệu
 * @param {Object} res - Express response object
 * @param {Object|Array} data - Dữ liệu trả về
 * @param {number} [statusCode=200] - HTTP status code
 */
function success(res, data, statusCode = 200) {
  return res.status(statusCode).json(data);
}

/**
 * Trả về response thành công với message
 * @param {Object} res - Express response
 * @param {string} message - Thông báo thành công
 * @param {Object} [extra={}] - Dữ liệu bổ sung
 */
function successMsg(res, message, extra = {}) {
  return res.json({ message, ...extra });
}

/**
 * Trả về response lỗi
 * Giữ nguyên format { message, error } hoặc { success: false, message }
 * tùy theo endpoint pattern hiện tại
 * @param {Object} res - Express response
 * @param {string} message - Thông báo lỗi (tiếng Việt)
 * @param {number} [statusCode=500] - HTTP status code
 * @param {string} [errorDetail=null] - Chi tiết lỗi kỹ thuật
 */
function error(res, message, statusCode = 500, errorDetail = null) {
  const body = { message };
  if (errorDetail) body.error = errorDetail;
  return res.status(statusCode).json(body);
}

/**
 * Trả về response lỗi cho endpoints dùng format { success: false }
 * (execute, submit, progress)
 * @param {Object} res - Express response
 * @param {string} errorMsg - Thông báo lỗi
 * @param {number} [statusCode=500] - HTTP status code
 */
function errorWithSuccess(res, errorMsg, statusCode = 500) {
  return res.status(statusCode).json({ success: false, error: errorMsg });
}

/**
 * Log lỗi server kèm context
 * @param {string} context - Mô tả ngắn (VD: "Create user")
 * @param {Error} err - Error object
 */
function logError(context, err) {
  console.error(`❌ ${context}:`, err);
}

module.exports = {
  success,
  successMsg,
  error,
  errorWithSuccess,
  logError,
};
