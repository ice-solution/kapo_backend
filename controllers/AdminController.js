const bcrypt = require('bcrypt');
const Auth = require('../models/Auth');
const User = require('../models/User');
const ClientProfile = require('../models/clientProfile');

const USER_PUBLIC_FIELDS = 'name gender birth phone email created_at modified_at';

function sanitizeUser(user) {
    if (!user) return null;
    const obj = user.toObject ? user.toObject() : user;
    delete obj.password;
    return obj;
}

function isDuplicateKey(error) {
    return error && error.code === 11000;
}

exports.login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: '請輸入帳號與密碼' });
    }

    try {
        const admin = await Auth.findOne({ username });
        if (!admin) {
            return res.status(401).json({ message: '帳號或密碼不正確' });
        }
        if (!['admin', 'staff'].includes(admin.role)) {
            return res.status(403).json({ message: '此帳號沒有後台權限' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: '帳號或密碼不正確' });
        }

        req.session.adminId = admin._id;
        req.session.adminRole = admin.role;
        return res.status(200).json({
            message: '登入成功',
            admin: { id: admin._id, username: admin.username, role: admin.role }
        });
    } catch (error) {
        console.error('後台登入時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error('後台登出時出錯:', error);
            return res.status(500).json({ message: '伺服器錯誤' });
        }
        return res.status(200).json({ message: '已登出' });
    });
};

exports.me = async (req, res) => {
    try {
        const admin = await Auth.findById(req.session.adminId).select('username role created_at');
        if (!admin) {
            return res.status(401).json({ message: '未授權，請先登入後台' });
        }
        return res.status(200).json({ admin });
    } catch (error) {
        console.error('取得後台帳號時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

exports.listUsers = async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const q = (req.query.q || '').trim();

    const filter = {};
    if (q) {
        filter.$or = [
            { name: new RegExp(q, 'i') },
            { email: new RegExp(q, 'i') },
            { phone: new RegExp(q, 'i') }
        ];
    }

    try {
        const [users, total] = await Promise.all([
            User.find(filter).select(USER_PUBLIC_FIELDS).sort({ created_at: -1 }).skip(skip).limit(limit),
            User.countDocuments(filter)
        ]);

        const counts = await ClientProfile.aggregate([
            { $match: { owner: { $in: users.map((user) => user._id) } } },
            { $group: { _id: '$owner', count: { $sum: 1 } } }
        ]);
        const countMap = Object.fromEntries(counts.map((item) => [String(item._id), item.count]));

        return res.status(200).json({
            users: users.map((user) => ({
                ...sanitizeUser(user),
                clientProfileCount: countMap[String(user._id)] || 0
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1
        });
    } catch (error) {
        console.error('列出用戶時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select(USER_PUBLIC_FIELDS);
        if (!user) {
            return res.status(404).json({ message: '用戶未找到' });
        }
        const clientProfileCount = await ClientProfile.countDocuments({ owner: user._id });
        return res.status(200).json({
            user: { ...sanitizeUser(user), clientProfileCount }
        });
    } catch (error) {
        console.error('取得用戶時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

exports.createUser = async (req, res) => {
    const { name, gender, birth, phone, email, password } = req.body;
    if (!name || !gender || !birth || !phone || !email || !password) {
        return res.status(400).json({ message: '所有欄位都是必填的' });
    }

    try {
        const user = new User({ name, gender, birth, phone, email, password });
        await user.save();
        return res.status(201).json({ message: '用戶創建成功', user: sanitizeUser(user) });
    } catch (error) {
        if (isDuplicateKey(error)) {
            return res.status(409).json({ message: '此電子郵件已被使用' });
        }
        console.error('創建用戶時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

exports.updateUser = async (req, res) => {
    const { name, gender, birth, phone, email, password } = req.body;

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: '用戶未找到' });
        }

        if (name !== undefined) user.name = name;
        if (gender !== undefined) user.gender = gender;
        if (birth !== undefined) user.birth = birth;
        if (phone !== undefined) user.phone = phone;
        if (email !== undefined) user.email = email;
        if (password) user.password = password;
        user.modified_at = new Date();

        await user.save();
        return res.status(200).json({ message: '用戶更新成功', user: sanitizeUser(user) });
    } catch (error) {
        if (isDuplicateKey(error)) {
            return res.status(409).json({ message: '此電子郵件已被使用' });
        }
        console.error('更新用戶時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: '用戶未找到' });
        }

        const deletedProfiles = await ClientProfile.deleteMany({ owner: user._id });
        await User.findByIdAndDelete(user._id);
        return res.status(200).json({
            message: '用戶刪除成功',
            deletedClientProfiles: deletedProfiles.deletedCount || 0
        });
    } catch (error) {
        console.error('刪除用戶時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

exports.listUserClientProfiles = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('_id');
        if (!user) {
            return res.status(404).json({ message: '用戶未找到' });
        }

        const profiles = await ClientProfile.find({ owner: user._id })
            .select('name gender birth age dropdownSelection TRC leftTotal rightTotal fingerprints.hand fingerprints.ring fingerprints.fingerType createdAt updatedAt')
            .sort({ createdAt: -1 });

        return res.status(200).json({ profiles });
    } catch (error) {
        console.error('取得客戶檔案時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

exports.getClientProfile = async (req, res) => {
    try {
        const profile = await ClientProfile.findById(req.params.profileId)
            .select('name gender birth age dropdownSelection owner TRC leftTotal rightTotal ringPercent fingerprints.hand fingerprints.ring fingerprints.fingerType createdAt updatedAt')
            .populate('owner', 'name email');
        if (!profile) {
            return res.status(404).json({ message: '客戶檔案未找到' });
        }
        return res.status(200).json({ clientProfile: profile });
    } catch (error) {
        console.error('取得客戶檔案時出錯:', error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};
