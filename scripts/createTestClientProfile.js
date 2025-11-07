// scripts/createTestClientProfile.js
// 建立測試用的 clientProfile 數據

require('dotenv').config();
const mongoose = require('mongoose');
const ClientProfile = require('../models/clientProfile');
const User = require('../models/User');

// 連接 MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(async () => {
    console.log('MongoDB 連接成功');
    await createTestProfile();
    mongoose.connection.close();
})
.catch(err => {
    console.error('MongoDB 連接失敗:', err);
    process.exit(1);
});

async function createTestProfile() {
    try {
        // 先查找或創建一個測試用戶
        let testUser = await User.findOne({ email: 'test@example.com' });
        if (!testUser) {
            // 如果沒有測試用戶，使用第一個用戶或創建一個
            testUser = await User.findOne();
            if (!testUser) {
                console.log('找不到用戶，請先創建一個用戶');
                return;
            }
        }
        
        // 定義10隻手指的指紋數據
        // 使用一個簡單的 base64 占位符（1x1 透明 PNG）
        const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        
        const fingerprints = [
            // 左手
            { hand: 'Left thumb', ring: 23, img: placeholderImage, fingerType: 'whorl' },
            { hand: 'Left index finger', ring: 19, img: placeholderImage, fingerType: 'reverse peacock' },
            { hand: 'Left middle finger', ring: 40, img: placeholderImage, fingerType: 'reverse peacock' },
            { hand: 'Left ring finger', ring: 36, img: placeholderImage, fingerType: 'loop' },
            { hand: 'Left little finger', ring: 15, img: placeholderImage, fingerType: 'loop' },
            // 右手
            { hand: 'Right thumb', ring: 24, img: placeholderImage, fingerType: 'loop' },
            { hand: 'Right index finger', ring: 22, img: placeholderImage, fingerType: 'reverse peacock' },
            { hand: 'Right middle finger', ring: 10, img: placeholderImage, fingerType: 'arch' },
            { hand: 'Right ring finger', ring: 21, img: placeholderImage, fingerType: 'loop' },
            { hand: 'Right little finger', ring: 17, img: placeholderImage, fingerType: 'arch' }
        ];
        
        // 計算總 ring 值
        const totalRing = fingerprints.reduce((sum, fp) => sum + fp.ring, 0);
        console.log('總 ring 值:', totalRing);
        
        // 計算每個手指的總百分比
        const ringPercent = [
            { finger: 0, percent: ((fingerprints[0].ring + fingerprints[5].ring) / totalRing * 100).toFixed(2) }, // 拇指
            { finger: 1, percent: ((fingerprints[1].ring + fingerprints[6].ring) / totalRing * 100).toFixed(2) }, // 食指
            { finger: 2, percent: ((fingerprints[2].ring + fingerprints[7].ring) / totalRing * 100).toFixed(2) }, // 中指
            { finger: 3, percent: ((fingerprints[3].ring + fingerprints[8].ring) / totalRing * 100).toFixed(2) }, // 無名指
            { finger: 4, percent: ((fingerprints[4].ring + fingerprints[9].ring) / totalRing * 100).toFixed(2) }  // 小指
        ];
        
        console.log('ringPercent 數據:', ringPercent);
        
        // 創建測試 clientProfile
        const testProfile = new ClientProfile({
            name: '測試客戶',
            gender: 'male',
            birth: new Date('1990-01-01'),
            age: 34,
            dropdownSelection: 'option1',
            owner: testUser._id,
            fingerprints: fingerprints,
            TRC: totalRing,
            leftTotal: fingerprints.slice(0, 5).reduce((sum, fp) => sum + fp.ring, 0),
            rightTotal: fingerprints.slice(5, 10).reduce((sum, fp) => sum + fp.ring, 0),
            ringPercent: ringPercent.map(rp => ({ finger: rp.finger, percent: parseFloat(rp.percent) }))
        });
        
        await testProfile.save();
        console.log('✅ 測試 clientProfile 創建成功！');
        console.log('ID:', testProfile._id);
        console.log('名稱:', testProfile.name);
        console.log('總 ring 值 (TRC):', testProfile.TRC);
        console.log('左手總數:', testProfile.leftTotal);
        console.log('右手總數:', testProfile.rightTotal);
        console.log('\n可以使用以下 ID 測試報告生成:');
        console.log(`GET /api/reports/${testProfile._id}`);
        console.log(`GET /api/reports/debug/${testProfile._id}`);
        
    } catch (error) {
        console.error('創建測試數據時出錯:', error);
    }
}
