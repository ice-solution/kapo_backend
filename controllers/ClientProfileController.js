// controllers/ClientProfileController.js
const ClientProfile = require('../models/clientProfile');

exports.createClientProfile = async (req, res) => {
    const { name, gender, birth, age, dropdownSelection, fingerprints, TRC, leftTotal, rightTotal, ringPercent } = req.body;

    // 檢查必填欄位
    if (!name || !gender || !birth || !age || !dropdownSelection || !fingerprints) {
        return res.status(400).json({ message: '所有欄位都是必填的' });
    }

    // 獲取登入用戶的 owner ID
    const owner = req.session.userId; // 從 session 中獲取 owner ID

    if (!owner) {
        return res.status(401).json({ message: '未授權，請先登入' });
    }
    try {
        const newClientProfile = new ClientProfile({
            name,
            gender,
            birth,
            age,
            dropdownSelection,
            owner, // 使用從 session 獲取的 owner ID
            fingerprints, // 包含手指圖像
            TRC,
            leftTotal,
            rightTotal,
            ringPercent
        });

        await newClientProfile.save();
        return res.status(201).json({ message: '客戶檔案創建成功', clientProfile: newClientProfile });
    } catch (error) {
        console.error('創建客戶檔案時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

exports.getProfileByUserId = async (req, res) => {
    // 獲取登入用戶的 owner ID
    const owner = req.session.userId; // 從 session 中獲取 owner ID

    if (!owner) {
        return res.status(401).json({ message: '未授權，請先登入' });
    }

    // 獲取分頁參數
    const page = parseInt(req.query.page) || 1; // 默認為第 1 頁
    const limit = parseInt(req.query.limit) || 10; // 默認每頁 10 個
    const skip = (page - 1) * limit; // 計算跳過的數量

    try {
        // 根據 owner 查找所有 clientProfiles，並進行分頁
        const profiles = await ClientProfile.find({ owner })
            .skip(skip)
            .limit(limit);

        // 獲取總數量以計算總頁數
        const totalProfiles = await ClientProfile.countDocuments({ owner });
        const totalPages = Math.ceil(totalProfiles / limit);

        if (!profiles || profiles.length === 0) {
            return res.status(404).json({ message: '未找到任何客戶檔案' });
        }

        return res.status(200).json({
            profiles,
            totalProfiles,
            totalPages,
            currentPage: page,
        });
    } catch (error) {
        console.error('獲取客戶檔案時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

exports.updateClientProfile = async (req, res) => {
    const owner = req.session.userId; // 從 session 中獲取 owner ID
    const { id } = req.params; // 從路由參數中獲取 clientProfile ID

    if (!owner) {
        return res.status(401).json({ message: '未授權，請先登入' });
    }

    try {
        // 查找該 clientProfile
        const clientProfile = await ClientProfile.findById(id);

        // 檢查該 clientProfile 是否存在
        if (!clientProfile) {
            return res.status(404).json({ message: '客戶檔案未找到' });
        }

        // 檢查 owner 是否匹配
        if (clientProfile.owner.toString() !== owner) {
            return res.status(403).json({ message: '您無權修改此客戶檔案' });
        }

        // 更新 clientProfile 的字段
        const updatedData = req.body; // 獲取更新的數據
        Object.assign(clientProfile, updatedData); // 更新 clientProfile

        await clientProfile.save(); // 保存更新
        return res.status(200).json({ message: '客戶檔案更新成功', clientProfile });
    } catch (error) {
        console.error('更新客戶檔案時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

exports.deleteClientProfile = async (req, res) => {
    const owner = req.session.userId; // 從 session 中獲取 owner ID
    const { id } = req.params; // 從路由參數中獲取 clientProfile ID

    if (!owner) {
        return res.status(401).json({ message: '未授權，請先登入' });
    }

    try {
        // 查找該 clientProfile
        const clientProfile = await ClientProfile.findById(id);

        // 檢查該 clientProfile 是否存在
        if (!clientProfile) {
            return res.status(404).json({ message: '客戶檔案未找到' });
        }

        // 檢查 owner 是否匹配
        if (clientProfile.owner.toString() !== owner) {
            return res.status(403).json({ message: '您無權刪除此客戶檔案' });
        }

        // 刪除 clientProfile
        await ClientProfile.findByIdAndDelete(id);
        return res.status(200).json({ message: '客戶檔案刪除成功' });
    } catch (error) {
        console.error('刪除客戶檔案時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

// 取得單一 clientProfile 並檢查 owner 權限
exports.getClientProfileById = async (req, res) => {
    const owner = req.session.userId; // 從 session 取得 owner ID
    const { clientId } = req.params; // 從路由參數取得 clientId

    if (!owner) {
        return res.status(401).json({ message: '未授權，請先登入' });
    }

    try {
        const clientProfile = await ClientProfile.findById(clientId);
        if (!clientProfile) {
            return res.status(404).json({ message: '客戶檔案未找到' });
        }
        if (clientProfile.owner.toString() !== owner) {
            return res.status(403).json({ message: '您無權存取此客戶檔案' });
        }
        return res.status(200).json({ clientProfile });
    } catch (error) {
        console.error('取得客戶檔案時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

// 其他 CRUD 操作的函數可以在這裡添加