document.getElementById('pace-calc-btn').addEventListener('click', () => document.getElementById('pace-modal').classList.remove('hidden'));
document.getElementById('pace-modal-close').addEventListener('click', () => document.getElementById('pace-modal').classList.add('hidden'));
document.getElementById('pace-modal').addEventListener('click', (e) => { if (e.target === document.getElementById('pace-modal')) document.getElementById('pace-modal').classList.add('hidden'); });

document.querySelectorAll('.pace-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.pace-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('pace-calc-panel').classList.toggle('hidden', tab.dataset.tab !== 'calc');
    document.getElementById('pace-predict-panel').classList.toggle('hidden', tab.dataset.tab !== 'predict');
    document.getElementById('pace-vdot-panel').classList.toggle('hidden', tab.dataset.tab !== 'vdot');
  });
});

// ═══ Calculator ═══

document.getElementById('pc-calc-btn').addEventListener('click', calculatePace);

function setupPaceCalcLock() {
  const inputs = [
    'pc-distance',
    'pct-h', 'pct-m', 'pct-s',
    'pcp-m', 'pcp-s'
  ].map(id => document.getElementById(id)).filter(Boolean);

  function refreshLock() {
    const dist = parseInt(document.getElementById('pc-distance').value) || 0;
    const timeH = parseInt(document.getElementById('pct-h').value) || 0;
    const timeM = parseInt(document.getElementById('pct-m').value) || 0;
    const timeS = parseInt(document.getElementById('pct-s').value) || 0;
    const paceM = parseInt(document.getElementById('pcp-m').value) || 0;
    const paceS = parseInt(document.getElementById('pcp-s').value) || 0;

    const hasDist = dist > 0;
    const hasTime = timeH > 0 || timeM > 0 || timeS > 0;
    const hasPace = paceM > 0 || paceS > 0;
    const filled = [hasDist, hasTime, hasPace].filter(Boolean).length;

    const enableAll = () => {
      document.querySelectorAll('#pace-calc-panel .input-group-input').forEach(el => el.disabled = false);
    };

    if (filled < 2) { enableAll(); return; }

    if (filled === 2) {
      if (hasDist && hasTime && !hasPace) {
        document.querySelectorAll('#pcp-m, #pcp-s').forEach(el => el.disabled = true);
        document.querySelectorAll('#pc-distance, #pct-h, #pct-m, #pct-s').forEach(el => el.disabled = false);
      } else if (hasDist && hasPace && !hasTime) {
        document.querySelectorAll('#pct-h, #pct-m, #pct-s').forEach(el => el.disabled = true);
        document.querySelectorAll('#pc-distance, #pcp-m, #pcp-s').forEach(el => el.disabled = false);
      } else if (hasTime && hasPace && !hasDist) {
        document.querySelectorAll('#pc-distance').forEach(el => el.disabled = true);
        document.querySelectorAll('#pct-h, #pct-m, #pct-s, #pcp-m, #pcp-s').forEach(el => el.disabled = false);
      } else {
        enableAll();
      }
    } else {
      enableAll();
    }
  }

  inputs.forEach(el => {
    el.addEventListener('input', refreshLock);
    el.addEventListener('focus', () => refreshLock());
  });
}

function readGroup(id) {
  const el = document.getElementById(id);
  return el ? parseInt(el.value) || 0 : 0;
}

function calculatePace() {
  const pcResult = document.getElementById('pc-result');
  const dist = parseInt(document.getElementById('pc-distance').value) || 0;
  const timeH = readGroup('pct-h');
  const timeM = readGroup('pct-m');
  const timeS = readGroup('pct-s');
  const paceM = readGroup('pcp-m');
  const paceS = readGroup('pcp-s');

  const hasTime = timeH > 0 || timeM > 0 || timeS > 0;
  const hasPace = paceM > 0 || paceS > 0;
  const hasDist = dist > 0;
  const filled = [hasDist, hasTime, hasPace].filter(Boolean).length;

  if (filled < 2) {
    pcResult.textContent = `⚠️ ${t('calc_fill_two')}`;
    pcResult.classList.remove('hidden');
    return;
  }

  let result = '';

  if (hasDist && hasTime && !hasPace) {
    const totalSecs = timeH * 3600 + timeM * 60 + timeS;
    const paceSecs = totalSecs / dist;
    result += `📏 ${dist}km ${t('calc_in')} ${formatSeconds(totalSecs)}\n`;
    result += `🏃 ${t('profile_pace')}: ${formatPace(paceSecs)}/km\n`;
    result += `\n📊 Split:\n`;
    result += `  5K: ${formatSeconds(paceSecs * 5)}\n`;
    result += `  10K: ${formatSeconds(paceSecs * 10)}\n`;
    result += `  HM: ${formatSeconds(paceSecs * 21.1)}\n`;
    result += `  FM: ${formatSeconds(paceSecs * 42.2)}`;
  } else if (hasDist && hasPace && !hasTime) {
    const paceSecs = paceM * 60 + paceS;
    const totalSecs = paceSecs * dist;
    result += `📏 ${dist}km @ ${formatPace(paceSecs)}/km\n`;
    result += `⏱ ${t('calc_total_time')}: ${formatSeconds(totalSecs)}\n`;
    result += `\n📊 Split:\n`;
    result += `  5K: ${formatSeconds(paceSecs * 5)}\n`;
    result += `  10K: ${formatSeconds(paceSecs * 10)}\n`;
    result += `  HM: ${formatSeconds(paceSecs * 21.1)}\n`;
    result += `  FM: ${formatSeconds(paceSecs * 42.2)}`;
  } else if (hasTime && hasPace && !hasDist) {
    const totalSecs = timeH * 3600 + timeM * 60 + timeS;
    const paceSecs = paceM * 60 + paceS;
    const calcDist = totalSecs / paceSecs;
    result += `⏱ ${formatSeconds(totalSecs)} @ ${formatPace(paceSecs)}/km\n`;
    result += `📏 ${t('calc_distance')}: ${calcDist.toFixed(2)}km`;
  } else {
    result = `⚠️ ${t('calc_fill_exact')}`;
  }

  pcResult.textContent = result;
  pcResult.classList.remove('hidden');
}

// ═══ Race Predictor ═══

document.getElementById('pp-calc-btn').addEventListener('click', predictRace);

function predictRace() {
  const ppResult = document.getElementById('pp-result');
  const p5m = readGroup('pp5-m');
  const p5s = readGroup('pp5-s');
  const p10m = readGroup('pp10-m');
  const p10s = readGroup('pp10-s');

  const has5k = p5m > 0 || p5s > 0;
  const has10k = p10m > 0 || p10s > 0;

  let refTime, refDist;

  if (has5k) {
    refTime = p5m * 60 + p5s;
    refDist = 5;
  } else if (has10k) {
    refTime = p10m * 60 + p10s;
    refDist = 10;
  } else {
    ppResult.textContent = `⚠️ ${t('calc_enter_pr')}`;
    ppResult.classList.remove('hidden'); return;
  }

  if (refTime <= 0) {
    ppResult.textContent = `⚠️ ${t('calc_invalid_time')}`;
    ppResult.classList.remove('hidden'); return;
  }

  const riegel = (d2) => refTime * Math.pow(d2 / refDist, 1.06);
  const distances = [
    { label: '5K', d: 5 },
    { label: '10K', d: 10 },
    { label: 'Half Marathon (21.1K)', d: 21.1 },
    { label: 'Full Marathon (42.2K)', d: 42.2 }
  ];

  let result = `🔮 ${t('calc_pred_title')} (Riegel)\n`;
  result += `${t('calc_based_on')}: ${refDist}K ${formatSeconds(refTime)}\n\n`;

  distances.forEach(({ label, d }) => {
    if (d === refDist) result += `✅ ${label}: ${formatSeconds(refTime)} (ref)\n`;
    else {
      const predicted = riegel(d);
      result += `📌 ${label}: ${formatSeconds(predicted)} (@ ${formatPace(predicted / d)}/km)\n`;
    }
  });

  ppResult.textContent = result;
  ppResult.classList.remove('hidden');
}

// ═══ VDOT ═══

document.getElementById('vdot-calc-btn').addEventListener('click', calculateVDOT);

function calculateVDOT() {
  const vdotResult = document.getElementById('vdot-result');
  const dist = parseInt(document.getElementById('vdot-distance').value);
  const timeH = readGroup('vdot-h');
  const timeM = readGroup('vdot-m');
  const timeS = readGroup('vdot-s');
  const totalSecs = timeH * 3600 + timeM * 60 + timeS;

  if (totalSecs <= 0) {
    vdotResult.textContent = `⚠️ ${t('calc_enter_race')}`;
    vdotResult.classList.remove('hidden'); return;
  }

  const velocity = dist / totalSecs;
  const vMin = velocity * 60;
  const vo2 = -4.6 + 0.182258 * vMin + 0.000104 * (vMin * vMin);
  const vdot = vo2;

  const distances = [
    { label: '1500m', d: 1500 },
    { label: '3000m', d: 3000 },
    { label: '5K', d: 5000 },
    { label: '10K', d: 10000 },
    { label: 'Half Marathon', d: 21097 },
    { label: 'Full Marathon', d: 42195 }
  ];

  const distLabel = document.getElementById('vdot-distance').options[document.getElementById('vdot-distance').selectedIndex].text;

  let result = `🏃 VDOT: <strong>${vdot.toFixed(1)}</strong>\n`;
  result += `${t('calc_based_on')} ${distLabel} ${formatSeconds(totalSecs)}\n`;
  result += `${t('profile_pace')}: ${formatPace(totalSecs / (dist / 1000))}/km\n\n`;
  result += `📊 ${t('calc_equiv_times')}:\n`;

  distances.forEach(({ label, d }) => {
    if (d === dist) result += `✅ ${label}: ${formatSeconds(totalSecs)} (ref)\n`;
    else {
      const estimatedPace = getVDOTPace(vdot, d);
      result += `📌 ${label}: ${formatSeconds(estimatedPace * d)} (@ ${formatPace(estimatedPace)}/km)\n`;
    }
  });

  result += `\n📖 ${t('calc_training_zones')} (VDOT ${vdot.toFixed(1)}):\n`;
  const zones = getVDOTZones(vdot);
  result += `  ${t('zone_easy')}: ${formatPace(zones.easy[0])} – ${formatPace(zones.easy[1])}/km\n`;
  result += `  ${t('zone_marathon')}: ${formatPace(zones.marathon[0])} – ${formatPace(zones.marathon[1])}/km\n`;
  result += `  ${t('zone_tempo')}: ${formatPace(zones.tempo[0])} – ${formatPace(zones.tempo[1])}/km\n`;
  result += `  ${t('zone_interval')}: ${formatPace(zones.interval[0])} – ${formatPace(zones.interval[1])}/km\n`;
  result += `  ${t('zone_repetition')}: < ${formatPace(zones.repetition)}/km`;

  vdotResult.innerHTML = result.replace(/\n/g, '<br>');
  vdotResult.classList.remove('hidden');
}

function getVDOTPercent(vdot, dist) {
  if (dist <= 1500) return 0.98;
  if (dist <= 3000) return 0.95;
  if (dist <= 5000) return 0.93;
  if (dist <= 10000) return 0.90;
  if (dist <= 21097) return 0.85;
  return 0.80;
}

function getVDOTPace(vdot, dist) {
  if (vdot <= 20) vdot = 20 + Math.random() * 5;
  const a = 0.000104, b = 0.182258, c = -(vdot + 4.6);
  const vMax = (-b + Math.sqrt(b*b - 4*a*c)) / (2*a);
  const pct = getVDOTPercent(vdot, dist);
  return (1000 / (vMax * pct)) * 60;
}

function getVDOTZones(vdot) {
  const a = 0.000104, b = 0.182258, c = -(vdot + 4.6);
  const vMax = (-b + Math.sqrt(b*b - 4*a*c)) / (2*a);
  return {
    easy: [(1000 / (vMax * 0.70)) * 60, (1000 / (vMax * 0.79)) * 60],
    marathon: [(1000 / (vMax * 0.80)) * 60, (1000 / (vMax * 0.84)) * 60],
    tempo: [(1000 / (vMax * 0.85)) * 60, (1000 / (vMax * 0.88)) * 60],
    interval: [(1000 / (vMax * 0.90)) * 60, (1000 / (vMax * 0.95)) * 60],
    repetition: (1000 / (vMax * 0.98)) * 60
  };
}
