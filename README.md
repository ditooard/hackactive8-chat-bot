# Gemini AI Chatbot

Sebuah chatbot berbasis **Google Gemini AI** dengan kemampuan membaca teks, gambar, dokumen, dan audio.  
Terdiri dari **backend Express.js** (server) dan **frontend Vanilla JS** (client) dalam satu repository.

---

## 📁 Struktur Project

```
hackactive8/
├── client-chatbot/          # Frontend (HTML, CSS, JS)
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── package.json
├── server-chatbot/          # Backend (Express + Gemini API)
│   ├── index.js
│   ├── .env
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🔧 Persiapan untuk Tester

### 1. Instalasi dependensi

Jalankan perintah berikut di **kedua folder**:

```bash
# Terminal 1: Backend
cd server-chatbot
npm install

# Terminal 2: Frontend (hanya jika但没有 folder node_modules)
cd client-chatbot
npm install
```

### 2. Buat file `.env`

Buat file `.env` di folder **`server-chatbot/`** dengan isi berikut:

```env
GEMINI_API_KEY=isi_dengan_api_key_kamu
MODEL=gemini-2.0-flash
PORT=3000
CLIENT_ORIGIN=http://localhost:3000
```

| Variable | Keterangan |
|---|---|
| `GEMINI_API_KEY` | **Wajib.** API Key dari Google AI Studio. Dapatkan di https://aistudio.google.com/apikey |
| `MODEL` | Model Gemini yang digunakan. Contoh: `gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-2.5-flash-lite` |
| `PORT` | Port server (default: `3000`) |
| `CLIENT_ORIGIN` | Origin frontend untuk CORS. Jika frontend di-serve oleh backend (default), isi `http://localhost:3000` |

**Catatan:** File `.env` sudah di-**ignore** oleh `.gitignore`, jadi aman dari commit.

### 3. Jalankan project

```bash
cd server-chatbot
npm run dev
```

Buka browser → `http://localhost:3000`

> Backend Express secara otomatis menyajikan file frontend dari folder `client-chatbot/`.  
> Tidak perlu menjalankan frontend secara terpisah.

---

## ✨ Fitur

| Fitur | Endpoint Backend | Keterangan |
|-------|-----------------|------------|
| 💬 Chat teks (dengan riwayat) | `POST /api/chat` | Percakapan dengan konteks |
| 🖼 Analisis gambar | `POST /generate-from-image` | Upload image + prompt |
| 📄 Analisis dokumen | `POST /generate-from-document` | Upload PDF/DOC/TXT + prompt |
| 🎵 Transkrip audio | `POST /generate-from-audio` | Upload audio + prompt |
| 📋 Multi-session chat | Frontend | Sidebar dengan banyak sesi chat |

---

## 🛠 Teknologi

- **Backend:** Node.js, Express, @google/genai, Multer
- **Frontend:** Vanilla JavaScript, HTML5, CSS3 (Neo-Brutalism)
- **AI:** Google Gemini 2.0 Flash / 2.5 Flash

---

## 👤 Kredit

**Dito Ardi Pratama**  
&copy; 2026 — All rights reserved.
