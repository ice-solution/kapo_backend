const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/login', AdminController.login);
router.post('/logout', AdminController.logout);

router.get('/me', adminMiddleware, AdminController.me);
router.get('/users', adminMiddleware, AdminController.listUsers);
router.post('/users', adminMiddleware, AdminController.createUser);
router.get('/users/:id', adminMiddleware, AdminController.getUser);
router.put('/users/:id', adminMiddleware, AdminController.updateUser);
router.delete('/users/:id', adminMiddleware, AdminController.deleteUser);
router.get('/users/:id/clientProfiles', adminMiddleware, AdminController.listUserClientProfiles);
router.get('/clientProfiles/:profileId', adminMiddleware, AdminController.getClientProfile);

module.exports = router;
