const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const cors = require('cors');
// app.use(cors({
//   origin: 'https://your-frontend-domain.vercel.app',
//   methods: ['GET','POST'],
//   credentials: true
// }));
app.use(cors({ origin: '*' }));
app.use(express.json());
const {GoogleGenerativeAI} = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
async function generateResponse(prompt) {

  const model =  await genAI.getGenerativeModel({
     model: "gemini-2.5-flash",
  })
  const data = await model.generateContent(prompt)
  return data;
  }

app.post('', (req,res)=>{
  
  let message = req.body.message;
  generateResponse(message).then((data) => {
    res.send({user: 'Bot', message: data.response.candidates[0].content.parts[0].text
});
  })
  // res.send({data: 'Hello from the backend!'});
});
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});