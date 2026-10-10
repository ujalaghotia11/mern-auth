const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/chat', async (req, res) => {
  try {
    const { message, medicineContext } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const systemInstruction = `You are DawaiSaathi AI, a helpful health assistant in India. You help users understand medicine salts, generic alternatives, and general health info. Keep answers concise. Always remind users to consult a doctor. Current context about the medicine being viewed: ${JSON.stringify(medicineContext || {})}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `${systemInstruction}\n\nUser Question: ${message}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ reply: text });
  } catch (error) {
    console.error("Detailed AI Chat Error:", error);
    // Return exact error message for debugging
    res.status(500).json({ 
      message: "Failed to generate AI response", 
      error: error.message || "Unknown error" 
    });
  }
});

module.exports = router;