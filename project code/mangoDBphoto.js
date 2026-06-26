const mongoose = require('mongoose');

const RemedySchema = new mongoose.Schema({
  type: String,         // 證型 (如: 風熱感冒)
  assessment: String,   // AI 初步評估
  recipeName: String,   // 食譜名稱 (如: 菊花薄荷茶)
  ingredients: [String],// 食材清單
  instructions: String, // 製作做法
  imageUrl: String      // 💾 儲存圖片網址的地方！
});

module.exports = mongoose.model('Remedy', RemedySchema);
