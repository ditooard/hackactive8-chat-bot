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

Dapatkan API Key di https://aistudio.google.com/apikey

```bash
npm run dev
# Buka http://localhost:3000
```

> Backend Express serve frontend dari `client-chatbot/` — tidak perlu jalan terpisah.

---

## 🔐 CAPTCHA

Popup verifikasi matematika sekali saat pertama buka halaman. Setelah lolos, tidak perlu captcha lagi.

---

## 🛡️ Keamanan

- Rate limit: 100 req/15m global, 30 chat/15m, 10 upload/15m
- Helmet security headers
- File size limit: 20MB
- Request size limit: 10MB

---

## 🧠 Fitur

| Fitur | Endpoint |
|-------|----------|
| 💬 Chat dengan riwayat | `POST /api/chat` |
| 🖼 Analisis gambar | `POST /generate-from-image` |
| 📄 Analisis dokumen | `POST /generate-from-document` |
| 🎵 Transkrip audio | `POST /generate-from-audio` |
| 📋 Multi-session chat | Sidebar |

---

## 🛠 Teknologi

**Backend:** Node.js, Express, Helmet, express-rate-limit, @google/genai, Multer  
**Frontend:** Vanilla JS, HTML5, CSS3 (Neo-Brutalism)  
**AI:** Google Gemini

---

## 👤 Kredit

**Dito Ardi Pratama** &copy; 2026
