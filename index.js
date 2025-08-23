    const express = require('express');
    const cors = require('cors');
    const path = require('path');
    require('dotenv').config();

    const app = express();
    const port = process.env.PORT || 3000;

    // ----- CORS Configuration -----
    const allowedOrigins = [
      'https://ai-chat-frontend-beryl.vercel.app',
      'http://localhost:3000' // Local dev
    ];

    // const corsOptions = {
    //   origin: function (origin, callback) {
    //     if (!origin) return callback(null, true); // allow curl / mobile apps

    //     if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
    //       return callback(null, true);
    //     }

    //     console.log('❌ Blocked by CORS:', origin);
    //     return callback(new Error('Not allowed by CORS'));
    //   },
    //   methods: ['GET', 'POST', 'OPTIONS'],
    //   allowedHeaders: [
    //     'Content-Type',
    //     'Authorization',
    //     'Accept',
    //     'Origin',
    //     'X-Requested-With'
    //   ],
    //   credentials: true,
    //   optionsSuccessStatus: 204
    // };

    // Apply middleware in correct order
    app.use(express.json());
app.use(cors({
  origin: ["https://my-frontend.vercel.app"],
  methods: ["GET", "POST"],
  credentials: true
}));

    // Static files (for frontend hosting if needed)
    // app.use(express.static(path.join(__dirname, 'public')));
  app.get('/', (req, res) => {
    // res.sendFile(path.join(__dirname, 'public', 'index.html'));
    res.send('Hello World!');
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
      try {
        const genAI = await getGenAI();
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log(response);
        
        return response.text();
      } catch (err) {
        console.error('Error in generateResponse:', err);
        throw err;
      }
    }

    app.post('/chat', async (req, res) => {
      try {
        const { message } = req.body;
        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }

        const responseText = await generateResponse(message);
        res.json({
          user: 'Bot',
          message: responseText,
          timestamp: new Date()
        });
      } catch (err) {
        console.error('Error in /chat endpoint:', err);
        res.status(500).json({
          error: 'Failed to generate response',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    });

    // Error handling middleware (with CORS headers)
    app.use((err, req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.status(500).json({ error: err.message || 'Internal server error' });
    });

    // Start server locally (Vercel runs it as serverless)
    if (process.env.VERCEL !== '1') {
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    }

    module.exports = app;
