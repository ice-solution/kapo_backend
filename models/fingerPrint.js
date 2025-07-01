// models/fingerPrint.js
const mongoose = require('mongoose');

const fingerPrintSchema = new mongoose.Schema({
    hand: { type: String, required: true }, // 例如 'left' 或 'right'
    img: { type: String, required: true }, // base64 圖像
    hand_number: { type: Number, required: true } // 手號
});

module.exports = fingerPrintSchema;