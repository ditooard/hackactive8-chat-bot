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
const GEMINI_MODEL = process.env.MODEL || 'gemini-2.0-flash';

const clientPath = path.join(__dirname, '../client-chatbot');
const runningContextPath = path.join(__dirname, 'running-context.md');
const prefsPath = path.join(__dirname, 'user-preferences.json');
const runningContext = fs.readFileSync(runningContextPath, 'utf-8');

// ─── Tone Instructions ───
const toneInstructions = {
  santai: "Gunakan bahasa Indonesia yang santai, gaul, dan akrab. Gunakan kata-kata seperti 'nih', 'bro', 'santuy', 'gue/lo'. Buat suasana seperti ngobrol dengan teman.",
  formal: "Gunakan bahasa Indonesia yang formal, baku, dan sopan. Gunakan struktur kalimat yang lengkap dan rapi. Hindari singkatan tidak baku.",
  motivator: "Gunakan bahasa yang penuh semangat, high energy, dan memotivasi. Gunakan kata seru, tanda seru, dan emoji. Dorong user untuk terus maju! 🔥",
  tegas: "Gunakan bahasa yang tegas, langsung ke point, disiplin, dan no nonsense. Gunakan kalimat perintah yang jelas. Dorong user untuk disiplin dan kerja keras."
};

// ─── User Preferences ───
function readPreferences() {
  try {
    if (!fs.existsSync(prefsPath)) return {};
    return JSON.parse(fs.readFileSync(prefsPath, 'utf-8'));
  } catch { return {}; }
}

function writePreferences(prefs) {
  fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 2), 'utf-8');
}

function getSessionPrefs(sessionId) {
  const all = readPreferences();
  return all[sessionId] || {};
}

function updateSessionPrefs(sessionId, updates) {
  const all = readPreferences();
  if (!all[sessionId]) all[sessionId] = {};
  Object.assign(all[sessionId], updates);
  writePreferences(all);
}

// ─── System Instruction Builder ───
function buildSystemInstruction(tone = 'santai', preferences = {}) {
  const toneInstruction = toneInstructions[tone] || toneInstructions.santai;

  let prefsContext = '';
  const profile = preferences.profile || {};
  if (profile.name || profile.targetRace) {
    prefsContext = '\n\n=== USER PROFILE ===\n';
    if (profile.name) prefsContext += `Nama: ${profile.name}\n`;
    if (profile.targetRace) prefsContext += `Target Race: ${profile.targetRace}\n`;
    if (profile.targetTime) prefsContext += `Target Time: ${profile.targetTime}\n`;
    if (profile.currentPace) prefsContext += `Current Pace: ${profile.currentPace}\n`;
    if (profile.experience) prefsContext += `Experience Level: ${profile.experience}\n`;
    if (profile.weeklyMileage) prefsContext += `Weekly Mileage: ${profile.weeklyMileage} km\n`;
  }

  return [
    "Kamu adalah asisten AI spesialis olahraga lari bernama GEMINI RUN.",
    toneInstruction,
    "Gunakan pengetahuan di bawah ini sebagai dasar untuk menjawab pertanyaan.",
    "Jawab SINGKAT, PADAT, dan langsung ke inti. Maksimal 3-4 paragraf pendek.",
    "Jika ada pertanyaan di luar topik lari, jawab: 'Maaf, saya hanya dapat menjawab pertanyaan seputar olahraga lari.'",
    "",
    "=== RUNNING KNOWLEDGE BASE ===",
    runningContext,
    prefsContext,
    "",
    "=== PETUNJUK BERPERILAKU ===",
    "- Jawab dengan bahasa Indonesia yang ramah dan informatif.",
    "- Berikan saran yang aman, ilmiah, dan sesuai untuk pemula.",
    "- Jika ditanya tentang cedera, selalu sarankan konsultasi ke dokter.",
    "- Jangan merekomendasikan doping atau zat terlarang.",
    "- Dorong gaya hidup sehat dan latihan bertahap."
  ].join('\n');
}

// ─── Express Setup ───
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || `http://localhost:${process.env.PORT || 3000}`,
  credentials: true,
}));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(clientPath));

const globalLimiter = rateLimit({
  windowMs: 1000 * 60 * 15,
  max: 100,
  message: { error: 'Too many requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const chatLimiter = rateLimit({
  windowMs: 1000 * 60 * 15,
  max: 30,
  message: { error: 'Too many chat requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 1000 * 60 * 15,
  max: 10,
  message: { error: 'Too many file uploads.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// ═════════════════════════════════════
//  CHAT ENDPOINT
// ═════════════════════════════════════

app.post('/api/chat', chatLimiter, async (req, res) => {
  const { conversation, tone, sessionId } = req.body;
  try {
    if (!Array.isArray(conversation)) throw new Error('Messages must be an array!');

    const prefs = getSessionPrefs(sessionId || 'default');
    const systemInstruction = buildSystemInstruction(tone || 'santai', prefs);

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }]
    }));

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        temperature: tone === 'formal' ? 0.5 : tone === 'tegas' ? 0.4 : 0.7,
        systemInstruction,
      },
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═════════════════════════════════════
//  FILE ANALYSIS ENDPOINTS
// ═════════════════════════════════════

app.post("/generate-from-image", uploadLimiter, upload.single("image"), async (req, res) => {
  const { prompt, tone, sessionId } = req.body;
  const base64Image = req.file.buffer.toString("base64");
  const prefs = getSessionPrefs(sessionId || 'default');
  const systemInstruction = buildSystemInstruction(tone || 'santai', prefs);

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt || "Tolong analisis gambar ini terkait lari." },
        { inlineData: { data: base64Image, mimeType: req.file.mimetype } }
      ],
      config: { systemInstruction },
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/generate-from-document", uploadLimiter, upload.single("document"), async (req, res) => {
  const { prompt, tone, sessionId } = req.body;
  const base64Document = req.file.buffer.toString("base64");
  const prefs = getSessionPrefs(sessionId || 'default');
  const systemInstruction = buildSystemInstruction(tone || 'santai', prefs);

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt || "Tolong buat ringkasan dari dokumen ini terkait lari." },
        { inlineData: { data: base64Document, mimeType: req.file.mimetype } }
      ],
      config: { systemInstruction },
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/generate-from-audio", uploadLimiter, upload.single("audio"), async (req, res) => {
  const { prompt, tone, sessionId } = req.body;
  const base64Audio = req.file.buffer.toString("base64");
  const prefs = getSessionPrefs(sessionId || 'default');
  const systemInstruction = buildSystemInstruction(tone || 'santai', prefs);

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt || "Tolong buatkan transkrip dari rekaman ini." },
        { inlineData: { data: base64Audio, mimeType: req.file.mimetype } }
      ],
      config: { systemInstruction },
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═════════════════════════════════════
//  WEATHER — Open-Meteo (gratis, tanpa API key)
// ═════════════════════════════════════

const weatherCodes = {
  0: 'Cerah', 1: 'Cerah', 2: 'Berawan', 3: 'Mendung',
  45: 'Berkabut', 48: 'Berkabut', 51: 'Gerimis', 53: 'Gerimis',
  55: 'Gerimis', 56: 'Gerimis Beku', 57: 'Gerimis Beku',
  61: 'Hujan', 63: 'Hujan', 65: 'Hujan Lebat',
  66: 'Hujan Beku', 67: 'Hujan Beku',
  71: 'Salju Ringan', 73: 'Salju', 75: 'Salju Lebat',
  77: 'Butiran Salju', 80: 'Hujan', 81: 'Hujan', 82: 'Hujan Lebat',
  85: 'Salju', 86: 'Salju Lebat', 95: 'Badai Petir',
  96: 'Badai Petir', 99: 'Badai Petir'
};

app.get('/api/weather', async (req, res) => {
  let { city = 'Jakarta' } = req.query;

  try {
    // Step 1: Geocode city → lat/lon
    async function geocode(c) {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(c)}&count=1&format=json`;
      const r = await fetch(url);
      if (!r.ok) return null;
      const d = await r.json();
      return d.results?.length ? d.results[0] : null;
    }

    let result = await geocode(city);

    // Fallback: coba tanpa embel-embel daerah (e.g. "Jakarta Pusat" → "Jakarta")
    if (!result && /jakarta/i.test(city)) {
      result = await geocode('Jakarta');
    }

    if (!result) {
      return res.status(200).json({ note: `Kota "${city}" tidak ditemukan. Coba kota lain.` });
    }

    const { latitude, longitude, name, country } = result;

    // Step 2: Fetch weather from coordinates
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`;
    const wxRes = await fetch(weatherUrl);
    if (!wxRes.ok) throw new Error('Weather fetch failed');
    const wxData = await wxRes.json();

    const current = wxData.current;
    const desc = weatherCodes[current.weather_code] || 'Unknown';

    const weather = {
      city: name,
      country: country || '',
      temp: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      description: desc,
      windSpeed: current.wind_speed_10m,
    };

    let tip = '';
    if (weather.temp > 30) {
      tip = 'Panas! ⚠️ Kurangi intensitas, perbanyak minum, lari pagi/sore saja.';
    } else if (weather.temp > 25 && weather.humidity > 80) {
      tip = 'Lembab & panas! 💦 Pace terasa lebih berat, jaga hidrasi, kurangi jarak.';
    } else if (weather.temp < 20) {
      tip = 'Sejuk! ❄️ Kondisi nyaman untuk long run, jangan lupa warm-up 5-10 menit.';
    } else if (weather.humidity > 80) {
      tip = 'Lembab! 💦 Perhatikan hidrasi ekstra, pace akan terasa sedikit lebih berat.';
    } else if ([51,53,55,61,63,80,81].includes(current.weather_code)) {
      tip = 'Hujan! 🌧️ Pilih rute aman, pakaian reflektif, hindari genangan.';
    } else if ([95,96,99].includes(current.weather_code)) {
      tip = 'Badai petir! ⛈️ Sebaiknya lari di treadmill atau tunggu reda.';
    } else {
      tip = 'Kondisi oke! ✅ Cocok untuk latihan. Jangan lupa pemanasan 5-10 menit.';
    }

    weather.tip = tip;
    res.status(200).json(weather);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═════════════════════════════════════
//  IP GEOLOCATION — ip-api.com (gratis)
// ═════════════════════════════════════

app.get('/api/geolocate', async (req, res) => {
  try {
    const response = await fetch('http://ip-api.com/json/');
    const data = await response.json();
    if (data.status === 'success') {
      res.json({ city: data.city, country: data.country });
    } else {
      res.json({ city: 'Jakarta', country: 'Indonesia' });
    }
  } catch {
    res.json({ city: 'Jakarta', country: 'Indonesia' });
  }
});

// ═════════════════════════════════════
//  MOTIVATIONAL QUOTES — ZenQuotes.io (gratis)
// ═════════════════════════════════════

const runningQuotes = [
  { q: 'The miracle isn\'t that I finished. The miracle is that I had the courage to start.', a: 'John Bingham' },
  { q: 'Run when you can, walk if you have to, crawl if you must; just never give up.', a: 'Dean Karnazes' },
  { q: 'The pain you feel today will be the strength you feel tomorrow.', a: 'Unknown' },
  { q: 'Don\'t limit your challenges. Challenge your limits.', a: 'Unknown' },
  { q: 'The only bad run is the one that didn\'t happen.', a: 'Unknown' },
  { q: 'It\'s not about being the best. It\'s about being better than you were yesterday.', a: 'Unknown' },
  { q: 'Running is the greatest metaphor for life, because you get out of it what you put into it.', a: 'Oprah Winfrey' },
  { q: 'If you want to become the best runner you can be, start now. Don\'t waste time with excuses.', a: 'Jeff Galloway' },
  { q: 'Champions keep playing until they get it right.', a: 'Billie Jean King' },
  { q: 'The body achieves what the mind believes.', a: 'Napoleon Hill' },
  { q: 'Setelah 30 menit berlari, sisanya adalah mental. Kamu pasti bisa! 🔥', a: 'GEMINI RUN' },
  { q: 'Setiap kilometer adalah kemenangan. Nikmati prosesnya! 🏃', a: 'GEMINI RUN' },
  { q: 'Konsistensi > Intensitas. Lebih baik lari rutin 3x seminggu daripada 1x tapi maksimal.', a: 'GEMINI RUN' },
  { q: 'Ingat: istirahat adalah bagian dari latihan. Jangan lupa recovery! 💪', a: 'GEMINI RUN' },
  { q: 'Target besar dimulai dari langkah kecil. Mulai hari ini! 🎯', a: 'GEMINI RUN' },
];

app.get('/api/quote', async (req, res) => {
  try {
    const response = await fetch('https://zenquotes.io/api/random');
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data[0]?.q) {
        return res.json({ quote: data[0].q, author: data[0].a });
      }
    }
  } catch {}

  // Fallback: local quotes
  const q = runningQuotes[Math.floor(Math.random() * runningQuotes.length)];
  res.json({ quote: q.q, author: q.a });
});

// ═════════════════════════════════════
//  USER PREFERENCES ENDPOINTS
// ═════════════════════════════════════

app.get('/api/preferences/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const prefs = getSessionPrefs(sessionId);
  res.json({ profile: prefs.profile || {} });
});

app.post('/api/preferences/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const { profile } = req.body;
  if (profile) updateSessionPrefs(sessionId, { profile });
  res.json({ success: true });
});
