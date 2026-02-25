const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-life-os-dev';

const authMiddleware = (req, res, next) => {
    // 1. Kiểm tra Bearer Token
    const authHeader = req.headers['authorization'];
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    }

    // 2. Fallback cho x-user-id (Tương thích ngược với frontend cũ)
    const fallbackUserId = req.headers['x-user-id'];

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = { id: decoded.userId, email: decoded.email };
            return next();
        } catch (error) {
            console.warn("[AUTH] Invalid token:", error.message);
            return res.status(401).json({ error: "Unauthorized: Invalid token" });
        }
    } else if (fallbackUserId) {
        console.warn(`[AUTH] Using legacy x-user-id: ${fallbackUserId}`);
        req.user = { id: fallbackUserId };
        return next();
    }

    console.warn("[AUTH] Missing authorization");
    return res.status(401).json({ error: "Unauthorized: Missing token" });
};

module.exports = authMiddleware;
