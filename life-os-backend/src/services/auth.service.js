const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-life-os-dev';

const register = async (email, password, fullName) => {
    // 1. Kiểm tra email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw new Error('Email đã được sử dụng.');
    }

    // 2. Hash mật khẩu an toàn
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Tạo user mới trong DB
    const newUser = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            fullName
        }
    });

    // 4. (Tùy chọn) Không trả về password trong response
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
};

const login = async (email, password) => {
    // 1. Tìm user theo email
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error('Email hoặc mật khẩu không chính xác.');
    }

    // 2. So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Email hoặc mật khẩu không chính xác.');
    }

    // 3. Tạo JWT Token
    const payload = {
        userId: user.id,
        email: user.email
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }); // Hết hạn sau 7 ngày

    // 4. Trả về token và thông tin user cơ bản
    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
};

module.exports = {
    register,
    login
};
