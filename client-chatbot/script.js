const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const attachBtn = document.getElementById('attach-btn');
const fileInput = document.getElementById('file-input');
const fileLabel = document.getElementById('file-label');
const clearFileBtn = document.getElementById('clear-file');
const filePreview = document.getElementById('file-preview');
const sessionList = document.getElementById('session-list');
const newChatBtn = document.getElementById('new-chat-btn');
const captchaOverlay = document.getElementById('captcha-overlay');
const captchaQuestion = document.getElementById('captcha-question');
const captchaInput = document.getElementById('captcha-input');
const captchaRefresh = document.getElementById('captcha-refresh');
const captchaSubmit = document.getElementById('captcha-submit');
const captchaError = document.getElementById('captcha-error');

let selectedFile = null;
let sessions = [];
let activeSessionId = null;
let sessionCounter = 0;
let captchaAnswer = 0;
let captchaSolved = false;

newChatBtn.addEventListener('click', createSession);
attachBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return clearSelectedFile();
  selectedFile = file;
  showFileChip(file);
});

clearFileBtn.addEventListener('click', clearSelectedFile);

captchaRefresh.addEventListener('click', (e) => {
  e.stopPropagation();
  generateCaptcha();
  captchaInput.focus();
});

captchaSubmit.addEventListener('click', verifyCaptcha);
captchaInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') verifyCaptcha();
});

form.addEventListener('submit', async function (e) {
  e.preventDefault();
  if (!captchaSolved) return;

  const userMessage = input.value.trim();
  if (selectedFile) {
    await handleFileUpload(userMessage);
  } else {
    await handleTextChat(userMessage);
  }
});

// ═════════════════════════════════════
//  CAPTCHA - One Time Popup
// ═════════════════════════════════════

function generateCaptcha() {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  captchaAnswer = a + b;
  captchaQuestion.textContent = `${a} + ${b} = ?`;
  captchaInput.value = '';
  captchaError.classList.add('hidden');
}

function verifyCaptcha() {
  if (String(captchaInput.value.trim()) === String(captchaAnswer)) {
    captchaSolved = true;
    captchaOverlay.classList.add('hidden');
    input.focus();
  } else {
    captchaError.classList.remove('hidden');
    captchaInput.value = '';
    captchaInput.focus();
  }
}

// ═════════════════════════════════════
//  Session Management
// ═════════════════════════════════════

function createSession() {
  sessionCounter++;
  const id = 'session-' + Date.now();
  const welcome = 'Halo! Saya GEMINI RUN, asisten lari Anda. 🏃<br><br>Saya bisa membantu:<br>• Teknik & program latihan lari<br>• Sepatu lari & perlengkapan<br>• Nutrisi, hidrasi, & pola hidup<br>• Menganalisis file (gambar, dokumen, audio)<br><br>Apa yang ingin Anda tanyakan tentang lari?';
  const session = {
    id,
    title: 'Chat ' + sessionCounter,
    conversation: [],
    messages: [{ sender: 'bot', html: welcome }]
  };
  sessions.push(session);
  switchSession(id);
  renderSidebar();
}

function switchSession(id) {
  saveCurrentMessages();
  activeSessionId = id;
  renderMessages(getActiveSession().messages);
  renderSidebar();
}

function deleteSession(id) {
  if (sessions.length <= 1) {
    return;
  }

  const idx = sessions.findIndex(s => s.id === id);
  sessions = sessions.filter(s => s.id !== id);

  if (activeSessionId === id) {
    const next = sessions[Math.min(idx, sessions.length - 1)];
    activeSessionId = null;
    switchSession(next.id);
  }

  renderSidebar();
}

function getActiveSession() {
  return sessions.find(s => s.id === activeSessionId);
}

function saveCurrentMessages() {
  const session = getActiveSession();
  if (!session) return;

  const items = chatBox.querySelectorAll('.message:not(.thinking-temp)');
  session.messages = [];
  items.forEach(el => {
    const sender = el.classList.contains('user') ? 'user'
                  : el.classList.contains('file-message') ? 'file-message'
                  : 'bot';
    session.messages.push({ sender, html: el.innerHTML });
  });
}

function renderMessages(messages) {
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
  sessionList.innerHTML = '';

  sessions.forEach(s => {
    const item = document.createElement('div');
    item.className = 'session-item' + (s.id === activeSessionId ? ' active' : '');
    item.innerHTML = `
      <span class="session-title">${s.title}</span>
      <button class="session-del" data-id="${s.id}">&times;</button>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.session-del')) return;
      switchSession(s.id);
    });

    item.querySelector('.session-del').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteSession(s.id);
    });

    sessionList.appendChild(item);
  });
}

// ═════════════════════════════════════
//  File Handling
// ═════════════════════════════════════

function clearSelectedFile() {
  selectedFile = null;
  fileInput.value = '';
  fileLabel.textContent = '';
  fileLabel.classList.add('hidden');
  clearFileBtn.classList.add('hidden');
  filePreview.classList.add('hidden');
  filePreview.innerHTML = '';
}

function showFileChip(file) {
  fileLabel.textContent = file.name;
  fileLabel.classList.remove('hidden');
  clearFileBtn.classList.remove('hidden');

  const icon = getFileIcon(file.type, file.name);
  const size = formatFileSize(file.size);

  filePreview.innerHTML = `
    <span class="file-icon">${icon}</span>
    <div class="file-info">
      <div class="name">${file.name}</div>
      <div class="size">${size}</div>
    </div>
  `;
  filePreview.classList.remove('hidden');
}

function getFileIcon(mime, name) {
  if (mime.startsWith('image/')) return '🖼';
  if (mime.startsWith('audio/')) return '🎵';
  const ext = name.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext)) return '📄';
  if (['doc', 'docx'].includes(ext)) return '📝';
  if (['txt'].includes(ext)) return '📃';
  return '📎';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// ═════════════════════════════════════
//  Chat Logic
// ═════════════════════════════════════

async function handleTextChat(message) {
  if (!message) return;
  const session = getActiveSession();
  if (!session) return;

  appendToDOM('user', message);
  session.conversation.push({ role: 'user', text: message });
  input.value = '';
  updateSessionTitle(message);

  const thinkingEl = appendThinking();
  session.conversation.push({ role: 'model', text: '' });

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation: session.conversation })
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const data = await response.json();

    if (data && data.result) {
      replaceThinking(thinkingEl, data.result);
      session.conversation[session.conversation.length - 1].text = data.result;
    } else {
      replaceThinking(thinkingEl, 'Sorry, no response received.');
      session.conversation.pop();
    }
  } catch (err) {
    replaceThinking(thinkingEl, 'Failed to get response from server.');
    session.conversation.pop();
  }
}

async function handleFileUpload(message) {
  const file = selectedFile;
  const session = getActiveSession();
  if (!session || !file) return;

  const endpoint = getFileEndpoint(file.type, file.name);
  const fileHtml = getFileIcon(file.type, file.name) + ' <span class="file-name">' + file.name + '</span>';

  if (message) {
    appendToDOM('user', getFileIcon(file.type, file.name) + ' ' + file.name + '<br>' + message);
  } else {
    appendToDOM('file-message', fileHtml);
  }

  input.value = '';
  updateSessionTitle(message || file.name);

  const thinkingEl = appendThinking();

  try {
    const formData = new FormData();
    formData.append('prompt', message || 'Tolong analisis file ini.');
    formData.append(endpoint.fieldName, file);

    const response = await fetch(endpoint.url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const data = await response.json();

    if (data && data.result) {
      replaceThinking(thinkingEl, data.result);
    } else {
      replaceThinking(thinkingEl, 'Sorry, no response received.');
    }
  } catch (err) {
    replaceThinking(thinkingEl, 'Failed to get response from server.');
  }

  clearSelectedFile();
}

function getFileEndpoint(mime, name) {
  if (mime.startsWith('image/')) return { url: '/generate-from-image', fieldName: 'image' };
  if (mime.startsWith('audio/')) return { url: '/generate-from-audio', fieldName: 'audio' };
  return { url: '/generate-from-document', fieldName: 'document' };
}

// ═════════════════════════════════════
//  DOM Helpers
// ═════════════════════════════════════

function appendToDOM(sender, html) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.innerHTML = html;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  const session = getActiveSession();
  if (session) {
    session.messages.push({ sender, html });
  }
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
  if (session) {
    session.messages.push({ sender: 'bot', html: text });
  }
}

function updateSessionTitle(firstMessage) {
  const session = getActiveSession();
  if (!session) return;
  if (session.messages.length <= 2) {
    session.title = firstMessage.length > 30 ? firstMessage.slice(0, 30) + '...' : firstMessage;
    renderSidebar();
  }
}

// ═════════════════════════════════════
//  Init
// ═════════════════════════════════════

createSession();
generateCaptcha();
captchaOverlay.classList.remove('hidden');
captchaInput.focus();
