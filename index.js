const express = require('express');
const cors = require('cors');
require('dotenv').config();
// Use dynamic import for ESM-only Google Generative AI SDK inside request scope

const app = express();

const allowedOrigins = [
  'https://ai-chat-frontend-beryl.vercel.app',
  'https://ai-chat-frontend-oqrqpbdhg-ubdales-projects-04a6989b.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

async function getGenAI() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error('Missing API_KEY environment variable');
  }
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  return new GoogleGenerativeAI(apiKey);
}

async function generateResponse(prompt) {
  const genAI = await getGenAI();
  const model = await genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const data = await model.generateContent(prompt);
  return data;
}

// Health check (useful to verify CORS headers on a simple GET)
app.get('/', (req, res) => {
  res.status(200).send({ status: 'ok' });
});

app.post('/', async (req, res) => {
  try {
    const message = req.body.message;
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

// Export a request handler so Vercel invokes Express correctly
module.exports = (req, res) => app(req, res);
