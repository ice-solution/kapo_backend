// models/clientProfile.js
const mongoose = require('mongoose');
const fingerPrintSchema = require('./fingerPrint'); // 引入 fingerPrint schema

const clientProfileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    gender: { type: String, required: true },
    birth: { type: Date, required: true },
    age: { type: Number, required: true },
    dropdownSelection: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 參考 User 模型
    fingerprints: [fingerPrintSchema] // 使用嵌套的 fingerPrint schema
});

module.exports = mongoose.model('ClientProfile', clientProfileSchema);