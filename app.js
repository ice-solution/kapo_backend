// app.js
require('dotenv').config(); // 加載 .env 文件
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo'); // 如果使用 MongoDB 存儲 session
const usersRoutes = require('./routes/users');
const clientProfileRoutes = require('./routes/clientProfile');

const Auth = require('./models/Auth'); // 引入 Auth 模型

const app = express();

app.use(bodyParser.json({ limit: '10mb' })); // 設置 JSON 請求的大小限制為 10MB
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true })); // 設置 URL 編碼請求的大小限制

// 連接到 mongodb+srv://kapo:QVT7ynkt8aVCj3nF@cluster0.nky9l.mongodb.net/fingerprint

console.log(process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    createAdminUser(); // 創建 admin 用戶
    console.log('MongoDB 連接成功');
})
.catch(err => console.error('MongoDB 連接失敗:', err));
mongoose.set('debug', true);

// 使用 body-parser 中介軟體
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// 設定 session
app.use(session({
    secret: 'kapo_fingerprint', // 請替換為您的密鑰
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI, // 使用環境變數
        collectionName: 'sessions' // 可選，指定存儲會話的集合名稱
    }),
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 天
}));

// 設定路由
app.use('/api/users', usersRoutes);
app.use('/api/clientProfiles', clientProfileRoutes);

// 啟動伺服器
const PORT = process.env.PORT || 4488;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

async function createAdminUser() {
    const adminExists = await Auth.findOne({ username: 'admin' });
    if (!adminExists) {
        // const hashedPassword = await bcrypt.hash('admin_password', 10); // 將 'admin_password' 替換為你想要的密碼
        const adminUser = new Auth({
            username: 'admin',
            password: 'admin_password',
            role: 'admin'
        });
        await adminUser.save();
        console.log('Admin user created');
    } else {
        console.log('Admin user already exists');
    }
}