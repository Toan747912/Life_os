const { PrismaClient } = require('@prisma/client');

// Singleton pattern: Đảm bảo chỉ có 1 kết nối DB chạy trong toàn bộ ứng dụng
const prisma = new PrismaClient();

module.exports = prisma;