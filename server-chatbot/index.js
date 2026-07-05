import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const upload = multer();
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
const GEMINI_MODEL = process.env.MODEL

const clientPath = path.join(__dirname, '../client-chatbot');

app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  credentials: true,
}));

app.use(express.json());
app.use(express.static(clientPath));

const port = process.env.PORT

app.listen(port, () => {
  console.log(`Server is running on port  http://localhost:${port}`);
});

app.post('/generate-text', async (req, res) => {
  const { prompt } = req.body;

  try{
    const response = await ai.models.generateContent(
      {
        model: GEMINI_MODEL,
        contents : prompt
      });

      res.status(200).json({
        result : response.text
      });
  }catch (error) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});

app.post("/generate-from-image", upload.single("image"), async (req, res) => { 
  const { prompt } = req.body;
  const base64Image = req.file.buffer.toString("base64");

  try{
    const response = await ai.models.generateContent(
      {
        model: GEMINI_MODEL,
        contents: [
          {text: prompt, type: "text"},
          {inlineData:{data: base64Image, mimeType: req.file.mimetype}}
        ]
      });

      res.status(200).json({
        result : response.text
      });
  }catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});

app.post("/generate-from-document", upload.single("document"), async (req, res) => {
  const { prompt } = req.body;
  const base64Document = req.file.buffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt ?? "Tolong buat ringkasan dari dokumen berikut.", type: "text" },
        { inlineData: { data: base64Document, mimeType: req.file.mimetype } }
      ],
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});

app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
  const { prompt } = req.body;
  const base64Audio = req.file.buffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt ?? "Tolong buatkan transkrip dari rekaman berikut.", type: "text" },
        { inlineData: { data: base64Audio, mimeType: req.file.mimetype } }
      ],
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});

app.post('/api/chat', async (req, res) => {
  const { conversation } = req.body;
  try {
    if (!Array.isArray(conversation)) throw new Error('Messages must be an array!');

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }]
    }));

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        temperature: 0.9,
        systemInstruction: "Jawab hanya menggunakan bahasa Indonesia.",
      },
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
})





