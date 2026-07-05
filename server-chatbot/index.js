import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = process.env.MODEL;

const clientPath = path.join(__dirname, '../client-chatbot');
const runningContextPath = path.join(__dirname, 'running-context.md');
const runningContext = fs.readFileSync(runningContextPath, 'utf-8');

const systemInstruction = [
  "Kamu adalah asisten AI spesialis olahraga lari bernama GEMINI RUN.",
  "Gunakan pengetahuan di bawah ini sebagai dasar untuk menjawab pertanyaan.",
  "Jawab SINGKAT, PADAT, dan langsung ke inti. Maksimal 3-4 paragraf pendek.",
  "Jika ada pertanyaan di luar topik lari, jawab: 'Maaf, saya hanya dapat menjawab pertanyaan seputar olahraga lari.'",
  "",
  "=== RUNNING KNOWLEDGE BASE ===",
  runningContext,
  "",
  "=== PETUNJUK BERPERILAKU ===",
  "- Jawab dengan bahasa Indonesia yang ramah dan informatif.",
  "- Berikan saran yang aman, ilmiah, dan sesuai untuk pemula.",
  "- Jika ditanya tentang cedera, selalu sarankan konsultasi ke dokter.",
  "- Jangan merekomendasikan doping atau zat terlarang.",
  "- Dorong gaya hidup sehat dan latihan bertahap."
].join('\n');

app.use(cors({
  origin: process.env.CLIENT_ORIGIN,
  credentials: true,
}));

app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(clientPath));

const globalLimiter = rateLimit({
  windowMs: 1000 * 60 * 15,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 1000 * 60 * 15,
  max: 30,
  message: { error: 'Too many chat requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 1000 * 60 * 15,
  max: 10,
  message: { error: 'Too many file uploads. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.post('/api/chat', chatLimiter, async (req, res) => {
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
        temperature: 0.7,
        systemInstruction,
      },
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/generate-from-image", uploadLimiter, upload.single("image"), async (req, res) => {
  const { prompt } = req.body;
  const base64Image = req.file.buffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt || "Tolong analisis gambar ini terkait lari.", type: "text" },
        { inlineData: { data: base64Image, mimeType: req.file.mimetype } }
      ],
      config: { systemInstruction },
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/generate-from-document", uploadLimiter, upload.single("document"), async (req, res) => {
  const { prompt } = req.body;
  const base64Document = req.file.buffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt || "Tolong buat ringkasan dari dokumen ini terkait lari.", type: "text" },
        { inlineData: { data: base64Document, mimeType: req.file.mimetype } }
      ],
      config: { systemInstruction },
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/generate-from-audio", uploadLimiter, upload.single("audio"), async (req, res) => {
  const { prompt } = req.body;
  const base64Audio = req.file.buffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt || "Tolong buatkan transkrip dari rekaman ini.", type: "text" },
        { inlineData: { data: base64Audio, mimeType: req.file.mimetype } }
      ],
      config: { systemInstruction },
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: e.message });
  }
});
