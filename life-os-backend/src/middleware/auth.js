// src/middleware/auth.js

const authMiddleware = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    console.log(`[AUTH] Header x-user-id: ${userId}`);

    if (!userId) {
        console.warn("[AUTH] Missing x-user-id header");
        return res.status(401).json({ error: "Unauthorized: Missing x-user-id header" });
    }

    // Gán vào req.user để các controller sử dụng
    req.user = { id: userId };
    next();
};

module.exports = authMiddleware;
