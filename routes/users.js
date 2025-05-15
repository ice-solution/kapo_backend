// routes/users.js
const express = require('express');
const router = express.Router();
const UsersController = require('../controllers/UsersController');
const authMiddleware = require('../middleware/authMiddleware'); // 引入中介軟體

// 創建用戶
router.post('/', UsersController.createUser);

// 獲取所有用戶
router.get('/', UsersController.getAllUsers);

// 獲取單個用戶
router.get('/:id', authMiddleware, UsersController.getUserById); // 使用中介軟體

// 更新用戶
router.put('/:id', authMiddleware, UsersController.updateUser); // 使用中介軟體

// 刪除用戶
router.delete('/:id', authMiddleware, UsersController.deleteUser); // 使用中介軟體

// 登入
router.post('/login', UsersController.login); // 登入路由不需要中介軟體

module.exports = router;