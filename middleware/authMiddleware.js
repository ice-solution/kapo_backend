// middleware/authMiddleware.js
const authMiddleware = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: '未授權，請先登入' });
    }
    next(); // 如果 session 存在，則繼續處理請求
};

module.exports = authMiddleware;