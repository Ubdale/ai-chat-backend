const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Enable CORS for frontend domain
app.use(cors({
  origin: 'https://ai-chat-frontend-beryl.vercel.app',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

async function generateResponse(prompt) {
  const model = await genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const data = await model.generateContent(prompt);
  return data;
}

// API route
app.post('/chat', async (req, res) => {
  try {
    let message = req.body.message;
    const data = await generateResponse(message);
    res.send({
      user: 'Bot',
      message: data.response.candidates[0].content.parts[0].text
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Something went wrong' });
  }
});

module.exports = app;
