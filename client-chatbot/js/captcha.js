function generateCaptcha() {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  AppState.captchaAnswer = a + b;
  document.getElementById('captcha-question').textContent = `${a} + ${b} = ?`;
  document.getElementById('captcha-input').value = '';
  document.getElementById('captcha-error').classList.add('hidden');
}

function verifyCaptcha() {
  const input = document.getElementById('captcha-input');
  const val = String(input.value.trim());
  if (val === String(AppState.captchaAnswer)) {
    AppState.captchaSolved = true;
    document.getElementById('captcha-overlay').classList.add('hidden');
    document.getElementById('user-input').focus();
  } else {
    document.getElementById('captcha-error').classList.remove('hidden');
    input.value = '';
    input.focus();
  }
}
