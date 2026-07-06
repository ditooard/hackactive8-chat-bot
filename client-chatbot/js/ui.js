function setupAutoAdvance() {
  document.querySelectorAll('[data-group]').forEach(input => {
    input.addEventListener('input', () => {
      if (input.value.length >= 2) {
        const group = input.dataset.group;
        const siblings = document.querySelectorAll(`[data-group="${group}"]`);
        const idx = Array.from(siblings).indexOf(input);
        if (idx < siblings.length - 1) siblings[idx + 1].focus();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value) {
        const group = input.dataset.group;
        const siblings = document.querySelectorAll(`[data-group="${group}"]`);
        const idx = Array.from(siblings).indexOf(input);
        if (idx > 0) siblings[idx - 1].focus();
      }
      if (e.key === 'Enter') {
        const btn = input.closest('.pace-panel, .modal-body')?.querySelector('[id$="-btn"], .modal-btn.primary');
        if (btn) btn.click();
      }
    });
  });
}

function appendToDOM(sender, html) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.innerHTML = html;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  const session = getActiveSession();
  if (session) session.messages.push({ sender, html });
}

function appendThinking() {
  const wrapper = document.createElement('div');
  wrapper.classList.add('message', 'bot', 'thinking-temp');
  wrapper.innerHTML = '<div class="thinking-indicator"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
  return wrapper;
}

function replaceThinking(el, text) {
  el.classList.remove('thinking-temp');
  el.textContent = text;
  chatBox.scrollTop = chatBox.scrollHeight;
  const session = getActiveSession();
  if (session) session.messages.push({ sender: 'bot', html: text });
}

function formatSeconds(totalSecs) {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = Math.round(totalSecs % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

function formatPace(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
