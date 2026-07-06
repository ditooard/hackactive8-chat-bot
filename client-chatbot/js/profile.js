document.getElementById('profile-btn').addEventListener('click', () => {
  loadProfile();
  document.getElementById('profile-modal').classList.remove('hidden');
});

document.getElementById('profile-modal-close').addEventListener('click', () => document.getElementById('profile-modal').classList.add('hidden'));
document.getElementById('profile-modal').addEventListener('click', (e) => { if (e.target === document.getElementById('profile-modal')) document.getElementById('profile-modal').classList.add('hidden'); });

document.getElementById('profile-pace-calc-btn').addEventListener('click', () => {
  document.getElementById('pace-popup').classList.remove('hidden');
  document.getElementById('popup-dist').value = '';
  document.getElementById('popup-time').value = '';
  document.getElementById('popup-result').classList.add('hidden');
  document.getElementById('popup-dist').focus();
});

document.getElementById('pace-popup-close').addEventListener('click', () => document.getElementById('pace-popup').classList.add('hidden'));
document.getElementById('pace-popup').addEventListener('click', (e) => { if (e.target === document.getElementById('pace-popup')) document.getElementById('pace-popup').classList.add('hidden'); });

document.getElementById('popup-calc-btn').addEventListener('click', () => {
  const d = parseInt(document.getElementById('popup-dist').value);
  const timeVal = parseInt(document.getElementById('popup-time').value);
  const r = document.getElementById('popup-result');
  if (d > 0 && timeVal > 0) {
    const pace = timeVal / d;
    const min = Math.floor(pace);
    const sec = Math.round((pace - min) * 60);
    r.textContent = `${t('popup_result')} ${min}:${sec.toString().padStart(2, '0')}/km`;
    r.classList.remove('hidden');
  } else {
    r.textContent = '⚠️ ' + t('popup_invalid');
    r.classList.remove('hidden');
  }
});

document.getElementById('profile-save-btn').addEventListener('click', async () => {
  const h = parseInt(document.getElementById('profile-th').value) || 0;
  const m = parseInt(document.getElementById('profile-tm').value) || 0;
  const s = parseInt(document.getElementById('profile-ts').value) || 0;
  let timeStr = '';
  if (h || m || s) {
    timeStr = h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  }

  const pm = parseInt(document.getElementById('profile-pm').value) || 0;
  const ps = parseInt(document.getElementById('profile-ps').value) || 0;
  let paceStr = '';
  if (pm || ps) {
    paceStr = `${pm}:${String(ps).padStart(2,'0')}`;
  }

  const profile = {
    name: document.getElementById('profile-name').value.trim(),
    targetRace: document.getElementById('profile-target-race').value,
    targetTime: timeStr,
    currentPace: paceStr,
    experience: document.getElementById('profile-experience').value,
    weeklyMileage: parseInt(document.getElementById('profile-mileage').value) || 0
  };

  try {
    const response = await fetch(`/api/preferences/${AppState.activeSessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile })
    });
    if (response.ok) {
      document.getElementById('profile-modal').classList.add('hidden');
      appendToDOM('system', `✅ ${t('profile_saved')}`);
    }
  } catch {
    appendToDOM('system', `❌ ${t('profile_failed')}`);
  }
});

async function loadProfile() {
  try {
    const response = await fetch(`/api/preferences/${AppState.activeSessionId}`);
    const data = await response.json();
    const p = data.profile || {};
    document.getElementById('profile-name').value = p.name || '';
    document.getElementById('profile-target-race').value = p.targetRace || '';
    document.getElementById('profile-experience').value = p.experience || 'Beginner';
    document.getElementById('profile-mileage').value = p.weeklyMileage || '';

    document.getElementById('profile-th').value = '';
    document.getElementById('profile-tm').value = '';
    document.getElementById('profile-ts').value = '';
    if (p.targetTime) {
      const parts = p.targetTime.split(':').map(Number);
      if (parts.length === 3) { document.getElementById('profile-th').value = parts[0]; document.getElementById('profile-tm').value = parts[1]; document.getElementById('profile-ts').value = parts[2]; }
      else if (parts.length === 2) { document.getElementById('profile-tm').value = parts[0]; document.getElementById('profile-ts').value = parts[1]; }
    }

    document.getElementById('profile-pm').value = '';
    document.getElementById('profile-ps').value = '';
    if (p.currentPace) {
      const paceParts = p.currentPace.split(':').map(Number);
      if (paceParts.length === 2) { document.getElementById('profile-pm').value = paceParts[0]; document.getElementById('profile-ps').value = paceParts[1]; }
    }
  } catch {}
}
