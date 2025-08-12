// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ----- CORS Configuration -----
const allowedOrigins = [
  'https://ai-chat-frontend-beryl.vercel.app',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'X-Requested-With'
  ],
  optionsSuccessStatus: 204
};

// Apply CORS middleware globally
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle all OPTIONS preflight requests
app.use(bodyParser.urlencoded({extended: false}));
// Parse JSON bodies
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Force CORS headers for ALL requests (extra safety)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://ai-chat-frontend-beryl.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// ----- Google Generative AI -----
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

// ----- Routes -----
app.get('/', (req, res) => {
  res.status(200).send({ status: 'ok' });
});

app.post('/chat', async (req, res) => {
  try {
    const message = req.body.message;
    const data = await generateResponse(message);
    res.send({
      user: 'Bot',
      message: data.response.candidates[0].content.parts[0].text
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Something went wrong, try again' });
  }
});

// ✅ Export Express app for Vercel serverless
module.exports = app;
