// models/clientProfile.js
const mongoose = require('mongoose');
const fingerPrintSchema = require('./fingerPrint'); // 引入 fingerPrint schema

const ringPercentSchema = new mongoose.Schema({
    finger: { type: Number, required: true },
    percent: { type: Number, required: true }
}, { _id: false }); // 不自動產生 _id

const clientProfileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    gender: { type: String, required: true },
    birth: { type: Date, required: true },
    age: { type: Number, required: true },
    dropdownSelection: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 參考 User 模型
    fingerprints: [fingerPrintSchema], // 使用嵌套的 fingerPrint schema
    TRC: { type: Number },
    leftTotal: { type: Number },
    rightTotal: { type: Number },
    ringPercent: ringPercentSchema,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
    
});

module.exports = mongoose.model('ClientProfile', clientProfileSchema);