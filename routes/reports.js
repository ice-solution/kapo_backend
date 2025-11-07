// routes/reports.js
const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');

// 生成客戶報告 PDF
router.get('/:id', ReportController.generateClientReport);

// 調試端點：查看客戶檔案數據結構
router.get('/debug/:id', ReportController.getClientProfileData);

module.exports = router;
