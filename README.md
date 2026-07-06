# GEMINI RUN — AI Running Coach

Sebuah **AI Running Coach** berbasis **Google Gemini AI** dengan pengetahuan olahraga lari.  
Menjawab pertanyaan tentang teknik lari, sepatu, nutrisi, cedera, dan analisis file (gambar, dokumen, audio).

---

## 📁 Struktur Project

```
hackactive8/
├── client-chatbot/              # Frontend (HTML, CSS, JS)
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── package.json
├── server-chatbot/              # Backend (Express + Gemini API)
│   ├── index.js
│   ├── .env
│   ├── running-context.md       # Knowledge base lari
│   ├── user-preferences.json    # Persistent profile & Strava tokens
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🔧 Persiapan

```bash
cd server-chatbot
npm install
```

Buat `.env` di `server-chatbot/`:
```env
GEMINI_API_KEY=isi_dengan_api_key_kamu
MODEL=gemini-2.0-flash
PORT=3000
CLIENT_ORIGIN=http://localhost:3000
```

Dapatkan API Key Gemini di https://aistudio.google.com/apikey

```bash
npm run dev
# Buka http://localhost:3000
```

> Backend Express serve frontend dari `client-chatbot/` — tidak perlu jalan terpisah.

---

## 🧠 Fitur Lengkap

### 🎭 Gaya Bahasa Dinamis
Pilih tone percakapan dari dropdown di header:
| Mode | Deskripsi |
|------|-----------|
| 😎 **Santai** | Bahasa gaul, akrab, seperti ngobrol dengan teman |
| 🎩 **Formal** | Bahasa baku, sopan, struktur kalimat rapi |
| 🔥 **Motivator** | High energy, penuh semangat, banyak dorongan |
| 💪 **Tegas** | Langsung, disiplin, no-nonsense |

### 🌤 Cuaca Real-time (gratis, tanpa API key)
Cek kondisi cuaca terkini + tips lari berdasarkan suhu, kelembaban, dan angin.
_API: Open-Meteo (gratis unlimited) + Geocoding API (gratis)_
📍 Auto-detect kota via IP (ip-api.com gratis)

### 💪 Motivational Quotes
Dapatkan inspirasi lari secara random, diambil dari ZenQuotes.io (gratis) dengan fallback lokal.

### 👤 Profil & Memory Jangka Panjang
Simpan preferensi user: nama, target race, pace, experience, weekly mileage.
Data tetap tersimpan antar sesi via `user-preferences.json`.

### ⏱ Pace Calculator + Race Predictor + VDOT
- Kalkulator pace: hitung pace/waktu/jarak dari 2 nilai diketahui
- Prediksi waktu race dengan **Riegel Formula**: $$T_2 = T_1 \times (D_2 / D_1)^{1.06}$$
- **VDOT Calculator** (Jack Daniels formula): hitung VO2max estimasi dari waktu race + zone latihan

### 🗂 File Analysis
| Fitur | Endpoint |
|-------|----------|
| 💬 Chat dengan riwayat + tone + konteks profil | `POST /api/chat` |
| 🖼 Analisis gambar | `POST /generate-from-image` |
| 📄 Analisis dokumen | `POST /generate-from-document` |
| 🎵 Transkrip audio | `POST /generate-from-audio` |
| 📋 Multi-session chat | Sidebar |

---

## 📡 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/chat` | Chat dengan tone & sessionId |
| POST | `/generate-from-image` | Analisis gambar |
| POST | `/generate-from-document` | Analisis dokumen |
| POST | `/generate-from-audio` | Transkrip audio |
| GET | `/api/weather?city=...` | Cuaca real-time (Open-Meteo) |
| GET | `/api/quote` | Motivational quote random |
| GET | `/api/geolocate` | Auto-detect kota via IP |
| GET | `/api/preferences/:sessionId` | Get profil user |
| POST | `/api/preferences/:sessionId` | Save profil user |

---

## 🔐 CAPTCHA

Popup verifikasi matematika sekali saat pertama buka halaman.

---

## 🛡️ Keamanan

- Rate limit: 100 req/15m global, 30 chat/15m, 10 upload/15m
- Helmet security headers
- File size limit: 20MB
- Request size limit: 10MB

---

## 🛠 Teknologi

**Backend:** Node.js, Express, Helmet, express-rate-limit, @google/genai, Multer  
**Frontend:** Vanilla JS, HTML5, CSS3 (Neo-Brutalism)  
**AI:** Google Gemini  
**External APIs:** Open-Meteo (gratis), ZenQuotes.io (gratis), ip-api.com (gratis)

---

## 👤 Kredit

**Dito Ardi Pratama** &copy; 2026
