// routes/reports.js
const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');

// 生成客戶報告 PDF
router.get('/:id', ReportController.generateClientReport);

module.exports = router;
