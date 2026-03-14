// utils/sessionLogout.js
// Utility gọi API logout để ghi nhận phiên đăng xuất trên server.
// Dùng được từ mọi nơi (không cần React hook).

const API_URL = process.env.REACT_APP_API_URL;

/**
 * Gọi API ghi nhận logout lên server.
 * @param {"manual" | "timeout" | "token_expired"} logoutType
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
