// ═════════════════════════════════════
//  GLOBAL STATE
// ═════════════════════════════════════

const AppState = {
  currentLang: localStorage.getItem('gemini_run_lang') || 'id',
  sessions: [],
  activeSessionId: null,
  sessionCounter: 0,
  selectedFile: null,
  captchaAnswer: 0,
  captchaSolved: false,
};

// ═════════════════════════════════════
//  DOM REFERENCES
// ═════════════════════════════════════

const chatBox = document.getElementById('chat-box');

// ═════════════════════════════════════
//  QUOTE
// ═════════════════════════════════════

document.getElementById('quote-btn').addEventListener('click', fetchQuote);

async function fetchQuote() {
  try {
    const response = await fetch('/api/quote');
    const data = await response.json();
    if (data.quote) {
      appendToDOM('bot', `💪 <em>"${data.quote}"</em><br>— <strong>${data.author}</strong>`);
    }
  } catch {
    appendToDOM('system', `⚠️ ${t('quote_failed')}`);
  }
}

// ═════════════════════════════════════
//  INIT
// ═════════════════════════════════════

applyLanguage(AppState.currentLang);
setupAutoAdvance();
setupPaceCalcLock();
createSession();
generateCaptcha();
document.getElementById('captcha-overlay').classList.remove('hidden');
document.getElementById('captcha-input').focus();

document.getElementById('lang-toggle').addEventListener('click', () => {
  const next = AppState.currentLang === 'id' ? 'en' : 'id';
  applyLanguage(next);
  renderSidebar();
});

document.getElementById('new-chat-btn').addEventListener('click', createSession);

document.getElementById('captcha-refresh').addEventListener('click', (e) => { e.stopPropagation(); generateCaptcha(); document.getElementById('captcha-input').focus(); });
document.getElementById('captcha-submit').addEventListener('click', verifyCaptcha);
document.getElementById('captcha-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') verifyCaptcha(); });
