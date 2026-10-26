const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

// Initialize with the new SDK format
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper function to retry if 503 high demand occurs
async function generateWithRetry(modelName, contents, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
      });
      return response.text;
    } catch (error) {
      const isHighDemand = error.status === 503 || (error.message && error.message.includes('high demand'));
      
      if (isHighDemand && i < retries - 1) {
        console.warn(`Gemini high demand (503). Retrying attempt ${i + 2} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
}

router.post('/chat', async (req, res) => {
  try {
    const { message, medicineContext } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const systemInstruction = `You are DawaiSaathi AI, a helpful health assistant in India. You help users understand medicine salts, generic alternatives, and general health info. Keep answers concise. Always remind users to consult a doctor. Current context about the medicine being viewed: ${JSON.stringify(medicineContext || {})}`;

    const prompt = `${systemInstruction}\n\nUser Question: ${message}`;

    // Call the model with retry logic using gemini-2.5-flash (or gemini-1.5-flash)
    const replyText = await generateWithRetry('gemini-2.5-flash', [
      { role: 'user', parts: [{ text: prompt }] }
    ]);

    res.status(200).json({ reply: replyText });
  } catch (error) {
    console.error("Detailed AI Chat Error:", error);
    
    const statusCode = error.status === 503 ? 503 : 500;
    res.status(statusCode).json({ 
      message: error.status === 503 ? "AI assistant is experiencing high traffic. Please try again in a moment." : "Failed to generate AI response", 
      error: error.message || "Unknown error" 
    });
  }
});

module.exports = router;