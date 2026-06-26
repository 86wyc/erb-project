const mongoose = require('mongoose');

const RemedySchema = new mongoose.Schema({
  type: String,         // 證型名稱 (例如: 風寒感冒, 風熱感冒, 氣虛感冒)
  assessment: String,   // 初步評估說明
  foodAdvise: String,   // 食物/藥物建議
  recipeName: String,   // 食療茶飲名稱
  ingredients: [String],// 食材/藥材清單
  instructions: String, // 製作做法
  imageUrl: String      // 藥材或食物的圖片網址
});

module.exports = mongoose.model('Remedy', RemedySchema);
