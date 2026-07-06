function createSession() {
  AppState.sessionCounter++;
  const id = 'session-' + Date.now();
  const isId = AppState.currentLang === 'id';
  const welcome = isId
    ? 'Halo! Saya GEMINI RUN, asisten lari Anda. 🏃<br><br>Saya bisa membantu:<br>• Teknik & program latihan lari<br>• Sepatu lari & perlengkapan<br>• Nutrisi, hidrasi, & pola hidup<br>• Menganalisis file (gambar, dokumen, audio)<br><br>Apa yang ingin Anda tanyakan tentang lari?'
    : 'Hello! I\'m GEMINI RUN, your running coach. 🏃<br><br>I can help with:<br>• Running techniques & training programs<br>• Running shoes & gear<br>• Nutrition, hydration & lifestyle<br>• File analysis (images, documents, audio)<br><br>What would you like to ask about running?';
  const session = {
    id,
    title: 'Chat ' + AppState.sessionCounter,
    conversation: [],
    messages: [{ sender: 'bot', html: welcome }]
  };
  AppState.sessions.push(session);
  switchSession(id);
  renderSidebar();
}

function switchSession(id) {
  saveCurrentMessages();
  AppState.activeSessionId = id;
  renderMessages(getActiveSession().messages);
  renderSidebar();
}

function deleteSession(id) {
  if (AppState.sessions.length <= 1) return;
  const idx = AppState.sessions.findIndex(s => s.id === id);
  AppState.sessions = AppState.sessions.filter(s => s.id !== id);
  if (AppState.activeSessionId === id) {
    const next = AppState.sessions[Math.min(idx, AppState.sessions.length - 1)];
    AppState.activeSessionId = null;
    switchSession(next.id);
  }
  renderSidebar();
}

function getActiveSession() {
  return AppState.sessions.find(s => s.id === AppState.activeSessionId);
}

function saveCurrentMessages() {
  const session = getActiveSession();
  if (!session) return;
  const items = document.getElementById('chat-box').querySelectorAll('.message:not(.thinking-temp)');
  session.messages = [];
  items.forEach(el => {
    const sender = el.classList.contains('user') ? 'user'
                  : el.classList.contains('file-message') ? 'file-message'
                  : 'bot';
    session.messages.push({ sender, html: el.innerHTML });
  });
}

function renderMessages(messages) {
  const chatBox = document.getElementById('chat-box');
  chatBox.innerHTML = '';
  messages.forEach(({ sender, html }) => {
    const msg = document.createElement('div');
    msg.classList.add('message', sender);
    msg.innerHTML = html;
    chatBox.appendChild(msg);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

function renderSidebar() {
  const sessionList = document.getElementById('session-list');
  sessionList.innerHTML = '';
  AppState.sessions.forEach(s => {
    const item = document.createElement('div');
    item.className = 'session-item' + (s.id === AppState.activeSessionId ? ' active' : '');
    item.innerHTML = `
      <span class="session-title">${s.title}</span>
      <button class="session-del" data-id="${s.id}">&times;</button>
    `;
    item.addEventListener('click', (e) => { if (e.target.closest('.session-del')) return; switchSession(s.id); });
    item.querySelector('.session-del').addEventListener('click', (e) => { e.stopPropagation(); deleteSession(s.id); });
    sessionList.appendChild(item);
  });
}

function updateSessionTitle(firstMessage) {
  const session = getActiveSession();
  if (!session) return;
  if (session.messages.length <= 2) {
    session.title = firstMessage.length > 30 ? firstMessage.slice(0, 30) + '...' : firstMessage;
    renderSidebar();
  }
}
