// services/userService.js
// Business logic cho quản lý users
const { getDB } = require("../config/mongodb");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

/**
 * Lấy user đang đăng nhập (không trả password)
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getCurrentUser(userId) {
  const db = getDB();
  return db
    .collection("users")
    .findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );
}

/**
 * Lấy danh sách teachers
 * @returns {Promise<Array>}
 */
async function getTeachers() {
  const db = getDB();
  return db
    .collection("users")
    .find(
      { role: "teacher" },
      { projection: { _id: 1, username: 1, fullname: 1, email: 1 } }
    )
    .sort({ fullname: 1, username: 1 })
    .toArray();
}

/**
 * Lấy tất cả users (không trả password)
 * @returns {Promise<Array>}
 */
async function getAllUsers() {
  const db = getDB();
  return db
    .collection("users")
    .find({}, { projection: { password: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
}

/**
 * Lấy 1 user theo ID (không trả password)
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function getUserById(id) {
  const db = getDB();
  return db
    .collection("users")
    .findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    );
}

/**
 * Tạo user mới
 * @param {{ username: string, email: string, password: string, fullname?: string, role?: string, isActive?: boolean }} userData
 * @returns {Promise<{ success: boolean, message: string }>}
 */
async function createUser({ username, email, password, fullname, role, isActive }) {
  const db = getDB();

  // Kiểm tra email trùng
  const existed = await db.collection("users").findOne({ email });
  if (existed) {
    return { success: false, message: "Email đã tồn tại" };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  await db.collection("users").insertOne({
    username,
    email,
    password: hashedPassword,
    fullname: fullname || "",
    role: role || "user",
    isActive: isActive ?? true,
    enrolledCourses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { success: true, message: "Tạo user thành công" };
}

/**
 * Admin cập nhật user (không cho sửa _id và password)
 * @param {string} id
 * @param {Object} updateData
 */
async function updateUser(id, updateData) {
  const db = getDB();
  const data = { ...updateData, updatedAt: new Date() };
  delete data._id;
  delete data.password;

  await db
    .collection("users")
    .updateOne({ _id: new ObjectId(id) }, { $set: data });
}

/**
 * Xóa user
 * @param {string} id
 */
async function deleteUser(id) {
  const db = getDB();
  await db.collection("users").deleteOne({ _id: new ObjectId(id) });
}

/**
 * User tự cập nhật thông tin cá nhân
 * @param {string} userId
 * @param {{ fullname?: string, email?: string }} data
 */
async function updateSelf(userId, { fullname, email }) {
  const db = getDB();
  const updateData = {
    fullname,
    email,
    updatedAt: new Date(),
  };

  await db
    .collection("users")
    .updateOne({ _id: new ObjectId(userId) }, { $set: updateData });
}

module.exports = {
  getCurrentUser,
  getTeachers,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateSelf,
};
