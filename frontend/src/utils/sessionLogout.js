// utils/sessionLogout.js
// Utility gọi API logout để ghi nhận phiên đăng xuất trên server.
// Dùng được từ mọi nơi (không cần React hook).

const API_URL = process.env.REACT_APP_API_URL;

/**
 * Gọi API ghi nhận logout lên server.
 * @param {"manual" | "timeout" | "token_expired" | "force_logout"} logoutType
 * @returns {Promise<void>}
 */
export async function notifyLogout(logoutType = "manual") {
  try {
    const token = localStorage.getItem("token");
    if (!token) return; // không có token thì không cần gọi

    await fetch(`${API_URL}/api/sessions/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ logoutType }),
    });
  } catch {
    // Không block flow logout nếu API fail
  }
}

/**
 * Kiểm tra phiên đăng nhập hiện tại còn hợp lệ không.
 * Dùng cho polling phát hiện bị đá phiên (force_logout).
 * @returns {Promise<{ valid: boolean, reason?: string }>}
 */
export async function checkSessionValid() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return { valid: false, reason: "no_token" };

    const res = await fetch(`${API_URL}/api/sessions/check`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return { valid: false, reason: "request_failed" };

    return await res.json();
  } catch {
    // Lỗi mạng → không chắc chắn, coi như vẫn hợp lệ để tránh logout nhầm
    return { valid: true };
  }
}
