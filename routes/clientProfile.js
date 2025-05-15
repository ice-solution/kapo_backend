// routes/clientProfile.js
const express = require('express');
const router = express.Router();
const ClientProfileController = require('../controllers/ClientProfileController');

// 創建客戶檔案
router.post('/', ClientProfileController.createClientProfile);

// 獲取用戶的所有客戶檔案
router.get('/user', ClientProfileController.getProfileByUserId);

// 更新客戶檔案
router.put('/:id', ClientProfileController.updateClientProfile);

// 刪除客戶檔案
router.delete('/:id', ClientProfileController.deleteClientProfile);

// 其他 CRUD 操作的路由可以在這裡添加

module.exports = router;