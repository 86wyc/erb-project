var express = require('express');
var router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const Remedy = require('../models/remedy'); // 你的 MongoDB Remedy Model

// 初始化 Gemini（請替換為你的免費 API Key）
const ai = new GoogleGenAI({ apiKey: "YOUR_GEMINI_API_KEY" });

router.post('/diagnose', async function(req, res, next) {
  try {
    // 1. 接收前端輸入的症狀
    const userSymptoms = req.body.symptoms || [];
    if (userSymptoms.length === 0) {
      return res.status(400).send('請至少選擇或輸入一個症狀');
    }

    const symptomStr = userSymptoms.join('、');

    // 2. 🤖 設計 Prompt，讓 Gemini 扮演中醫師並強制輸出 JSON 格式
    const prompt = `
      你是一位專業的中醫師。請針對患者主訴的症狀進行初步的中醫辨證評估。
      患者目前的症狀為：【${symptomStr}】。
      
      請根據這些症狀，給出：
      1. 初步評估的證型名稱（例如：風寒感冒、風熱感冒、氣虛感冒、陰虛內熱等）。
      2. 針對該證型的初步評估說明與飲食調理建議。
      3. 一道適合的對症食療茶飲或湯品名稱。
      4. 所需的食材或藥材清單（陣列格式）。
      5. 詳細的 Step-by-Step 製作做法說明。
      6. 一個適合在 Unsplash 圖片網站搜尋該食療主要食材的「英文單字關鍵字」（例如：ginger, chrysanthemum, mint, honey）。
      
      請嚴格以 JSON 格式回傳，格式必須完全符合以下結構：
      {
        "type": "證型名稱",
        "assessment": "評估說明文字",
        "foodAdvise": "飲食建議文字",
        "recipeName": "食療名稱",
        "ingredients": ["藥材1", "藥材2", "藥材3"],
        "instructions": "製作做法詳細文字...",
        "imageKeyword": "英文關鍵字"
      }
    `;

    console.log('🤖 正在請求 Gemini 進行中醫辨證...');
    
    // 3. 呼叫 Gemini 1.5 Flash（免費、速度快）
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" } // 強制要求 JSON
    });

    // 4. 解析 Gemini 回傳的結構化資料
    const aiResult = JSON.parse(response.text);

    // 5. 動態組裝 Unsplash 免費圖片網址 (使用 Gemini 提供的英文關鍵字)
    const dynamicImageUrl = `https://unsplash.com`;
    // 💡 註：交功課時，你可以動態帶入關鍵字：
    // const dynamicImageUrl = `https://unsplash.com{aiResult.imageKeyword}`;

    // 6. 💾 核心步驟：將 Gemini 診斷的成果自動存入 MongoDB
    const newRemedyLog = new Remedy({
      type: aiResult.type,
      assessment: aiResult.assessment,
      foodAdvise: aiResult.foodAdvise,
      recipeName: aiResult.recipeName,
      ingredients: aiResult.ingredients,
      instructions: aiResult.instructions,
      imageUrl: dynamicImageUrl
    });
    await newRemedyLog.save(); // 存入 MongoDB 留下歷史紀錄
    console.log('💾 Gemini 中醫診斷紀錄已成功存入 MongoDB！');

    // 7. 將資料 Render 到前端畫面 (與上一版 EJS 完美相容)
    res.render('diagnose-result', {
      title: 'Gemini AI 中醫健康評估',
      symptoms: userSymptoms,
      data: newRemedyLog // 直接把帶有 MongoDB ID 的物件傳給前端
    });

  } catch (error) {
    console.error('Gemini 或 MongoDB 發生錯誤:', error);
    res.status(500).send('系統評估出錯：' + error.message);
  }
});

module.exports = router;
