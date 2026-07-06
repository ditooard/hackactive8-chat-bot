function t(key) {
  const lang = i18n[AppState.currentLang];
  return lang && lang[key] !== undefined ? lang[key] : (i18n.en[key] || key);
}

function applyLanguage(lang) {
  AppState.currentLang = lang;
  localStorage.setItem('gemini_run_lang', lang);
  document.getElementById('lang-toggle').textContent = lang === 'id' ? 'EN' : 'ID';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key);
    if (el.placeholder !== undefined) el.placeholder = val;
    else if (el.hasAttribute('title')) el.title = val;
    else el.innerHTML = val;
  });
  const sub = document.querySelector('[data-i18n="subtitle"]');
  if (sub) sub.innerHTML = t('subtitle');
}
