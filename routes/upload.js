const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// 設置 multer 存儲配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // 指定上傳文件的目錄
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // 使用當前時間作為文件名
    }
});

// 創建 multer 實例
const upload = multer({ storage: storage });

// 上傳圖片的路由
router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: '請上傳圖片' });
    }
    // 返回上傳的文件信息
    return res.status(200).json({ message: '圖片上傳成功', file: req.file });
});

module.exports = router;
