const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini client with API key from .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/chat', async (req, res) => {
  try {
    const { message, medicineContext } = req.body;

    const systemInstruction = `You are DawaiSaathi AI, a helpful health assistant in India. You help users understand medicine salts, generic alternatives, and general health info. Keep answers concise. Always remind users to consult a doctor. Current context about the medicine being viewed: ${JSON.stringify(medicineContext || {})}`;

    // Generate response using Gemini 2.5 Flash model
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        { role: 'user', parts: [{ text: systemInstruction + "\n\nUser Question: " + message }] }
      ]
    });

    res.status(200).json({ reply: response.text });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ message: "Failed to generate AI response", error: error.message });
  }
});

module.exports = router;