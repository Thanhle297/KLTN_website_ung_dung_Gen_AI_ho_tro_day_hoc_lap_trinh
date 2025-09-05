//gemini.js
const express = require("express");
const { callGemini } = require("../services/geminiService");

const router = express.Router();

router.post("/", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ success: false, error: "Missing prompt" });
  }

  try {
    const result = await callGemini(prompt);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
