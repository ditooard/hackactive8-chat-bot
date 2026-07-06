document.getElementById('attach-btn').addEventListener('click', () => document.getElementById('file-input').click());

document.getElementById('file-input').addEventListener('change', () => {
  const file = document.getElementById('file-input').files[0];
  if (!file) return clearSelectedFile();
  AppState.selectedFile = file;
  showFileChip(file);
});

document.getElementById('clear-file').addEventListener('click', clearSelectedFile);

document.getElementById('chat-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  if (!AppState.captchaSolved) return;
  const userMessage = document.getElementById('user-input').value.trim();
  if (AppState.selectedFile) {
    await handleFileUpload(userMessage);
  } else {
    await handleTextChat(userMessage);
  }
});

function clearSelectedFile() {
  AppState.selectedFile = null;
  document.getElementById('file-input').value = '';
  document.getElementById('file-label').textContent = '';
  document.getElementById('file-label').classList.add('hidden');
  document.getElementById('clear-file').classList.add('hidden');
  document.getElementById('file-preview').classList.add('hidden');
  document.getElementById('file-preview').innerHTML = '';
}

function showFileChip(file) {
  document.getElementById('file-label').textContent = file.name;
  document.getElementById('file-label').classList.remove('hidden');
  document.getElementById('clear-file').classList.remove('hidden');
  const icon = getFileIcon(file.type, file.name);
  const size = formatFileSize(file.size);
  document.getElementById('file-preview').innerHTML = `
    <span class="file-icon">${icon}</span>
    <div class="file-info">
      <div class="name">${file.name}</div>
      <div class="size">${size}</div>
    </div>
  `;
  document.getElementById('file-preview').classList.remove('hidden');
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

async function handleTextChat(message) {
  if (!message) return;
  const session = getActiveSession();
  if (!session) return;

  appendToDOM('user', message);
  session.conversation.push({ role: 'user', text: message });
  document.getElementById('user-input').value = '';
  updateSessionTitle(message);

  const thinkingEl = appendThinking();
  session.conversation.push({ role: 'model', text: '' });

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation: session.conversation,
        tone: document.getElementById('tone-selector').value,
        sessionId: AppState.activeSessionId
      })
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const data = await response.json();

    if (data && data.result) {
      replaceThinking(thinkingEl, data.result);
      session.conversation[session.conversation.length - 1].text = data.result;
    } else {
      replaceThinking(thinkingEl, t('no_response'));
      session.conversation.pop();
    }
  } catch (err) {
    replaceThinking(thinkingEl, t('server_error'));
    session.conversation.pop();
  }
}

async function handleFileUpload(message) {
  const file = AppState.selectedFile;
  const session = getActiveSession();
  if (!session || !file) return;

  const endpoint = getFileEndpoint(file.type, file.name);
  const fileHtml = getFileIcon(file.type, file.name) + ' <span class="file-name">' + file.name + '</span>';

  if (message) {
    appendToDOM('user', getFileIcon(file.type, file.name) + ' ' + file.name + '<br>' + message);
  } else {
    appendToDOM('file-message', fileHtml);
  }

  document.getElementById('user-input').value = '';
  updateSessionTitle(message || file.name);
  const thinkingEl = appendThinking();

  try {
    const formData = new FormData();
    formData.append('prompt', message || 'Tolong analisis file ini.');
    formData.append('tone', document.getElementById('tone-selector').value);
    formData.append('sessionId', AppState.activeSessionId);
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
      replaceThinking(thinkingEl, t('no_response'));
    }
  } catch (err) {
    replaceThinking(thinkingEl, t('server_error'));
  }

  clearSelectedFile();
}

function getFileEndpoint(mime, name) {
  if (mime.startsWith('image/')) return { url: '/generate-from-image', fieldName: 'image' };
  if (mime.startsWith('audio/')) return { url: '/generate-from-audio', fieldName: 'audio' };
  return { url: '/generate-from-document', fieldName: 'document' };
}
