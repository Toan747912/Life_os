/**
 * Global error handler middleware — phải được mount SAU TẤT CẢ routes
 * Express nhận diện error handler qua 4 tham số (err, req, res, next)
 */
const errorHandler = (err, req, res, next) => {
    // Log đầy đủ ở server
    console.error(`[ERROR] ${req.method} ${req.path}`, {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });

    // Xác định status code
    const statusCode = err.statusCode || err.status || 500;

    // Prisma errors
    if (err.code && err.code.startsWith('P')) {
        if (err.code === 'P2002') {
            return res.status(409).json({ error: 'Dữ liệu đã tồn tại (unique constraint).' });
        }
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Không tìm thấy bản ghi.' });
        }
        return res.status(400).json({ error: `Database error: ${err.message}` });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Token không hợp lệ.' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token đã hết hạn.' });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
    }

    // Default
    res.status(statusCode).json({
        error: err.message || 'Đã có lỗi xảy ra phía server.',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = errorHandler;
