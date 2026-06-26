var express = require('express');
var router = express.Router();
const Remedy = require('../models/remedy');

// 處理症狀評估的 POST 請求
router.post('/diagnose', async function(req, res, next) {
  try {
    // 1. 接收前端輸入的症狀 (假設前端傳來一個症狀陣列，例如 ['咳', '流涕', '累', '口乾'])
    const userSymptoms = req.body.symptoms || [];
    
    // 將陣列轉為字串方便關鍵字比對
    const symptomStr = userSymptoms.join(','); 

    // 2. 🤖 中醫邏輯核心：根據關鍵字初步評估分類 (Rule-based NLP)
    let targetType = "風寒感冒"; // 預設防錯

    if (symptomStr.includes('口乾') || symptomStr.includes('喉嚨痛') || symptomStr.includes('黃涕')) {
      // 出現口乾、喉嚨痛、黃涕，判定為熱症
      targetType = "風熱感冒";
    } else if (symptomStr.includes('累') || symptomStr.includes('無力') || symptomStr.includes('出虛汗')) {
      // 出現累、極度疲倦，中醫通常判定為氣虛
      targetType = "氣虛感冒";
    } else if (symptomStr.includes('怕冷') || symptomStr.includes('骨痛') || symptomStr.includes('清涕')) {
      // 出現怕冷、骨痛、流清鼻涕，判定為寒症
      targetType = "風寒感冒";
    }

    // 3. 💾 從 MongoDB 撈取對應證型的食療、做法與圖片
    const remedyData = await Remedy.findOne({ type: targetType });

    // 4. 如果資料庫是空的，提供一份預設的功課展示資料（防錯機制）
    const fallbackData = {
      type: targetType,
      assessment: `您出現了 ${userSymptoms.join('、')} 等症狀，初步評估較偏向【${targetType}】。`,
      foodAdvise: targetType === "風熱感冒" ? "建議選用微涼具有清熱宣肺功效的藥材，如菊花、薄荷。" : "建議選用溫熱具有散寒化痰功效的食材，如生薑、紫蘇。",
      recipeName: targetType === "風熱感冒" ? "菊花薄荷桑葉茶" : "紫蘇生薑紅糖茶",
      ingredients: targetType === "風熱感冒" ? ["杭菊花 6克", "桑葉 6克", "薄荷 3克"] : ["帶皮生薑 3片", "紫蘇葉 5克", "紅糖 適量"],
      instructions: "將所有藥材洗淨後放入杯中，用 500ml 沸水沖泡，蓋上杯蓋悶泡 10 分鐘後即可趁熱飲用。",
      imageUrl: targetType === "風熱感冒" 
        ? "https://unsplash.com" // 菊花示意圖
        : "https://unsplash.com" // 生薑示意圖
    };

    const finalResult = remedyData || fallbackData;

    // 5. 將所有評估、藥物、做法、圖片網址 Render 到前端頁面
    res.render('diagnose-result', {
      title: '中醫健康評估結果',
      symptoms: userSymptoms,
      data: finalResult
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('系統評估出錯：' + error.message);
  }
});

module.exports = router;
