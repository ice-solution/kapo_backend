// controllers/UsersController.js
const User = require('../models/User');
const bcrypt = require('bcrypt');

exports.createUser = async (req, res) => {
    const { name, gender, birth, phone, email, password } = req.body;

    // 檢查必填欄位
    if (!name || !gender || !birth || !phone || !email || !password) {
        return res.status(400).json({ message: '所有欄位都是必填的' });
    }

    try {
        // 創建新用戶
        const newUser = new User({
            name,
            gender,
            birth,
            phone,
            email,
            password
        });

        // 保存用戶到資料庫
        await newUser.save();
        return res.status(201).json({ message: '用戶創建成功', user: newUser });
    } catch (error) {
        console.error('創建用戶時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

exports.getAllUsers = async (req, res) => {
    // ... 獲取所有用戶的邏輯 ...
};

exports.getUserById = async (req, res) => {
    const userId = req.params.id; // 從路由參數中獲取用戶 ID

    try {
        // 根據 ID 查找用戶
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: '用戶未找到' });
        }

        return res.status(200).json({ user });
    } catch (error) {
        console.error('獲取用戶時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

exports.updateUser = async (req, res) => {
    // ... 更新用戶的邏輯 ...
};

exports.deleteUser = async (req, res) => {
    // ... 刪除用戶的邏輯 ...
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    // 檢查必填欄位
    if (!email || !password) {
        return res.status(400).json({ message: '所有欄位都是必填的' });
    }

    try {
        // 根據 email 查找用戶
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: '用戶未找到' });
        }

        // 檢查密碼
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: '密碼不正確' });
        }

        // 登入成功，設置 session
        req.session.userId = user._id; // 儲存用戶 ID 到 session
        return res.status(200).json({ message: '登入成功', user });
    } catch (error) {
        console.error('登入時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};