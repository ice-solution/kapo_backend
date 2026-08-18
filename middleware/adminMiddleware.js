const adminMiddleware = (req, res, next) => {
    if (!req.session.adminId) {
        return res.status(401).json({ message: '未授權，請先登入後台' });
    }
    next();
};

module.exports = adminMiddleware;
