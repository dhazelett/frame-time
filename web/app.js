// Gen 3 RNG Tool - Main Application

import init, {
  init_index,
  find_shinies,
  find_shinies_with_natures,
  lookup_advance,
  find_pid_advance,
  generate_at,
  state_after,
} from './pkg/frame_time_wasm.js';

// ============================================================================
// Constants
// ============================================================================

const GBA_FPS_NATIVE = 59.7275;
const GBA_FPS_60 = 60;

function getCurrentFps() {
  const selected = document.querySelector('input[name="fps"]:checked');
  return selected ? parseFloat(selected.value) : GBA_FPS_60;
}

function getMsPerFrame() {
  return 1000 / getCurrentFps();
}

// ============================================================================
// State
// ============================================================================

let wasmReady = false;
let currentMode = 'hardware'; // 'hardware' or 'emulator'

// Current attempt state
let currentTarget = null;  // { advance, pokemon, pokemonName, pid }
let currentPressAdvance = null;

// Offsets stored per pokemon (persisted to localStorage)
let offsets = {};

// Timer state
let audioCtx = null;
let timerRunning = false;
let timerStartTime = null;
let timerAnimationFrame = null;
let scheduledBeeps = [];

// Practice state
let practiceMode = false;
let practiceTargetTime = null; // Audio time when final beep plays
let practiceTapped = false;
let practiceAttempts = []; // Array of timing deltas in ms

// Real attempt tracking (per pokemon)
let attemptHistory = {}; // { pokemon: [{ delta, timestamp }, ...] }

// ============================================================================
// DOM elements
// ============================================================================

const tidInput = document.getElementById('tid');
const sidInput = document.getElementById('sid');
const pokemonSelect = document.getElementById('pokemon');
const maxAdvanceInput = document.getElementById('maxAdvance');
const naturesInput = document.getElementById('natures');
const searchBtn = document.getElementById('searchBtn');
const searchStatus = document.getElementById('searchStatus');
const resultsBody = document.querySelector('#results tbody');

// Attempt section
const noTargetDiv = document.getElementById('noTarget');
const attemptInfoDiv = document.getElementById('attemptInfo');
const attemptPokemonSpan = document.getElementById('attemptPokemon');
const attemptTargetSpan = document.getElementById('attemptTarget');
const attemptTimeSpan = document.getElementById('attemptTime');
const attemptTargetPidSpan = document.getElementById('attemptTargetPid');
const attemptOffsetSpan = document.getElementById('attemptOffset');
const pressAdvanceSpan = document.getElementById('pressAdvance');
const pressRngSpan = document.getElementById('pressRng');
const resetOffsetBtn = document.getElementById('resetOffsetBtn');
const emulatorModeBtn = document.getElementById('emulatorModeBtn');
const hardwareModeBtn = document.getElementById('hardwareModeBtn');

// Emulator mode sections
const counterSection = document.getElementById('counterSection') || document.querySelectorAll('.card')[3];
const calibrationSection = document.getElementById('calibrationSection');

// Counter section
const currentRngInput = document.getElementById('currentRng');
const currentAdvanceSpan = document.getElementById('currentAdvance');
const targetAdvanceDisplay = document.getElementById('targetAdvanceDisplay');
const framesRemainingSpan = document.getElementById('framesRemaining');

// Calibration section
const pidInput = document.getElementById('pidInput');
const calibrateBtn = document.getElementById('calibrateBtn');
const calibrationResult = document.getElementById('calibrationResult');

// Timer section
const timerSection = document.getElementById('timerSection');
const preTimerInput = document.getElementById('preTimer');
const beepIntervalInput = document.getElementById('beepInterval');
const audioOffsetInput = document.getElementById('audioOffset');
const startTimerBtn = document.getElementById('startTimerBtn');
const stopTimerBtn = document.getElementById('stopTimerBtn');
const practiceBtn = document.getElementById('practiceBtn');
const timerPhaseSpan = document.getElementById('timerPhase');
const timerCountdownSpan = document.getElementById('timerCountdown');
const timerBeepDots = document.querySelectorAll('.beep-dot');
const timerInstructionSpan = document.getElementById('timerInstruction');
const practiceTapBtn = document.getElementById('practiceTapBtn');
const practiceResultDiv = document.getElementById('practiceResult');
const practiceStatsDiv = document.getElementById('practiceStats');

// Hardware calibration section
const hwCalibrationSection = document.getElementById('hwCalibrationSection');
const hwNatureSelect = document.getElementById('hwNature');
const hwLevelInput = document.getElementById('hwLevel');
const statHpInput = document.getElementById('statHp');
const statAtkInput = document.getElementById('statAtk');
const statDefInput = document.getElementById('statDef');
const statSpaInput = document.getElementById('statSpa');
const statSpdInput = document.getElementById('statSpd');
const statSpeInput = document.getElementById('statSpe');
const calcIvsBtn = document.getElementById('calcIvsBtn');
const ivCalcStatus = document.getElementById('ivCalcStatus');
const hwIvsInput = document.getElementById('hwIvs');
const hwCalibrateBtn = document.getElementById('hwCalibrateBtn');
const hwCalibrationResult = document.getElementById('hwCalibrationResult');
const attemptHistorySection = document.getElementById('attemptHistorySection');
const attemptHistoryStats = document.getElementById('attemptHistoryStats');
const attemptHistoryList = document.getElementById('attemptHistoryList');

// Pokemon data: display names and base stats [HP, Atk, Def, SpA, SpD, Spe]
const POKEMON_DATA = {
  // Weather Trio
  rayquaza:   { name: 'Rayquaza',   base: [105, 150, 90, 150, 90, 95] },
  kyogre:     { name: 'Kyogre',     base: [100, 100, 90, 150, 140, 90] },
  groudon:    { name: 'Groudon',    base: [100, 150, 140, 100, 90, 90] },
  // Regis
  regirock:   { name: 'Regirock',   base: [80, 100, 200, 50, 100, 50] },
  regice:     { name: 'Regice',     base: [80, 50, 100, 100, 200, 50] },
  registeel:  { name: 'Registeel',  base: [80, 75, 150, 75, 150, 50] },
  // Event Pokemon
  latios:     { name: 'Latios',     base: [80, 90, 80, 130, 110, 110] },
  latias:     { name: 'Latias',     base: [80, 80, 90, 110, 130, 110] },
  mew:        { name: 'Mew',        base: [100, 100, 100, 100, 100, 100] },
  lugia:      { name: 'Lugia',      base: [106, 90, 130, 90, 154, 110] },
  hooh:       { name: 'Ho-Oh',      base: [106, 130, 90, 110, 154, 90] },
  deoxys:     { name: 'Deoxys',     base: [50, 150, 50, 150, 50, 150] }, // Normal forme
};

// For backwards compatibility
const POKEMON_NAMES = Object.fromEntries(
  Object.entries(POKEMON_DATA).map(([k, v]) => [k, v.name])
);

// Nature stat modifiers: [Atk, Def, SpA, SpD, Spe] - HP is never modified
const NATURE_MODIFIERS = {
  Hardy:   [1.0, 1.0, 1.0, 1.0, 1.0],
  Lonely:  [1.1, 0.9, 1.0, 1.0, 1.0],
  Brave:   [1.1, 1.0, 1.0, 1.0, 0.9],
  Adamant: [1.1, 1.0, 0.9, 1.0, 1.0],
  Naughty: [1.1, 1.0, 1.0, 0.9, 1.0],
  Bold:    [0.9, 1.1, 1.0, 1.0, 1.0],
  Docile:  [1.0, 1.0, 1.0, 1.0, 1.0],
  Relaxed: [1.0, 1.1, 1.0, 1.0, 0.9],
  Impish:  [1.0, 1.1, 0.9, 1.0, 1.0],
  Lax:     [1.0, 1.1, 1.0, 0.9, 1.0],
  Timid:   [0.9, 1.0, 1.0, 1.0, 1.1],
  Hasty:   [1.0, 0.9, 1.0, 1.0, 1.1],
  Serious: [1.0, 1.0, 1.0, 1.0, 1.0],
  Jolly:   [1.0, 1.0, 0.9, 1.0, 1.1],
  Naive:   [1.0, 1.0, 1.0, 0.9, 1.1],
  Modest:  [0.9, 1.0, 1.1, 1.0, 1.0],
  Mild:    [1.0, 0.9, 1.1, 1.0, 1.0],
  Quiet:   [1.0, 1.0, 1.1, 1.0, 0.9],
  Bashful: [1.0, 1.0, 1.0, 1.0, 1.0],
  Rash:    [1.0, 1.0, 1.1, 0.9, 1.0],
  Calm:    [0.9, 1.0, 1.0, 1.1, 1.0],
  Gentle:  [1.0, 0.9, 1.0, 1.1, 1.0],
  Sassy:   [1.0, 1.0, 1.0, 1.1, 0.9],
  Careful: [1.0, 1.0, 0.9, 1.1, 1.0],
  Quirky:  [1.0, 1.0, 1.0, 1.0, 1.0],
};

// ============================================================================
// Helpers
// ============================================================================

function formatTime(advance) {
  const seconds = advance / getCurrentFps();
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTimeMs(ms) {
  const totalSecs = ms / 1000;
  const mins = Math.floor(totalSecs / 60);
  const secs = (totalSecs % 60).toFixed(2);
  return `${mins}:${secs.padStart(5, '0')}`;
}

function formatPid(pid) {
  return pid.toString(16).toUpperCase().padStart(8, '0');
}

function formatIvs(hit) {
  return `${hit.hp}/${hit.atk}/${hit.def}/${hit.spa}/${hit.spd}/${hit.spe}`;
}

function parseHex(str) {
  const cleaned = str.trim().replace(/^0x/i, '');
  const val = parseInt(cleaned, 16);
  return isNaN(val) ? null : val >>> 0;
}

function getOffset(pokemon) {
  return offsets[pokemon] || 0;
}

function setOffset(pokemon, offset) {
  offsets[pokemon] = offset;
  saveOffsets();
}

function loadOffsets() {
  try {
    const saved = localStorage.getItem('rng-offsets');
    if (saved) {
      offsets = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load offsets:', e);
  }
}

function saveOffsets() {
  try {
    localStorage.setItem('rng-offsets', JSON.stringify(offsets));
  } catch (e) {
    console.warn('Failed to save offsets:', e);
  }
}

function loadAttemptHistory() {
  try {
    const saved = localStorage.getItem('rng-attempt-history');
    if (saved) {
      attemptHistory = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load attempt history:', e);
  }
}

function saveAttemptHistory() {
  try {
    localStorage.setItem('rng-attempt-history', JSON.stringify(attemptHistory));
  } catch (e) {
    console.warn('Failed to save attempt history:', e);
  }
}

function recordAttempt(pokemon, delta) {
  if (!attemptHistory[pokemon]) {
    attemptHistory[pokemon] = [];
  }
  attemptHistory[pokemon].push({
    delta,
    timestamp: Date.now(),
  });
  // Keep last 50 attempts per pokemon
  if (attemptHistory[pokemon].length > 50) {
    attemptHistory[pokemon].shift();
  }
  saveAttemptHistory();
  updateAttemptHistoryDisplay(pokemon);
}

function updateAttemptHistoryDisplay(pokemon) {
  const history = pokemon ? (attemptHistory[pokemon] || []) : [];

  if (history.length === 0) {
    attemptHistoryStats.innerHTML = `
      <div class="stat-row">
        <span>Attempts:</span>
        <span class="stat-value">0</span>
      </div>
      <div class="stat-row">
        <span>Average delta:</span>
        <span class="stat-value">-</span>
      </div>
      <div class="stat-row">
        <span>Suggested audio offset:</span>
        <span class="stat-value">-</span>
      </div>
    `;
    attemptHistoryList.innerHTML = '<div class="history-list" style="color: #666;">No attempts yet. Calibrate to start tracking.</div>';
    return;
  }

  const deltas = history.map(h => h.delta);
  const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const last5 = deltas.slice(-5);

  // Suggested audio offset
  const suggestedOffset = -Math.round(avg * getMsPerFrame());

  attemptHistoryStats.innerHTML = `
    <div class="stat-row">
      <span>Attempts:</span>
      <span class="stat-value">${history.length}</span>
    </div>
    <div class="stat-row">
      <span>Average delta:</span>
      <span class="stat-value">${avg >= 0 ? '+' : ''}${avg.toFixed(1)} frames</span>
    </div>
    <div class="stat-row">
      <span>Suggested audio offset:</span>
      <span class="stat-value">${suggestedOffset >= 0 ? '+' : ''}${suggestedOffset}ms</span>
    </div>
  `;

  // Show last 10 attempts
  const historyLen = history.length;
  const recent = history.slice(-10).map((attempt, i) => ({
    ...attempt,
    index: historyLen - 10 + i < 0 ? i : historyLen - 10 + i
  })).reverse();

  let listHtml = '<div class="history-list"><strong>Recent attempts:</strong>';
  for (const attempt of recent) {
    const sign = attempt.delta >= 0 ? '+' : '';
    const deltaClass = attempt.delta === 0 ? 'perfect' : (attempt.delta < 0 ? 'early' : 'late');
    const time = new Date(attempt.timestamp).toLocaleTimeString();
    listHtml += `
      <div class="history-item">
        <span>${time}</span>
        <span class="delta ${deltaClass}">${sign}${attempt.delta} frames</span>
        <button class="delete-attempt-btn" data-pokemon="${pokemon}" data-index="${attempt.index}">&times;</button>
      </div>
    `;
  }
  listHtml += '</div>';
  attemptHistoryList.innerHTML = listHtml;
}

function deleteAttempt(pokemon, index) {
  if (!attemptHistory[pokemon]) return;
  attemptHistory[pokemon].splice(index, 1);
  saveAttemptHistory();
  updateAttemptHistoryDisplay(pokemon);
}

function advanceToMs(advance) {
  return advance * getMsPerFrame();
}

// ============================================================================
// IV Calculator
// ============================================================================

function calcHpStat(base, iv, level) {
  // HP = floor((2*Base + IV) * Level / 100 + Level + 10)
  return Math.floor((2 * base + iv) * level / 100 + level + 10);
}

function calcOtherStat(base, iv, level, natureMod) {
  // Stat = floor(floor((2*Base + IV) * Level / 100 + 5) * Nature)
  return Math.floor(Math.floor((2 * base + iv) * level / 100 + 5) * natureMod);
}

function findPossibleIvs(observedStat, base, level, natureMod, isHp) {
  const possible = [];
  for (let iv = 0; iv <= 31; iv++) {
    const calc = isHp
      ? calcHpStat(base, iv, level)
      : calcOtherStat(base, iv, level, natureMod);
    if (calc === observedStat) {
      possible.push(iv);
    }
  }
  return possible;
}

function calculateIvs() {
  const pokemon = pokemonSelect.value;
  const pokemonData = POKEMON_DATA[pokemon];

  if (!pokemonData) {
    ivCalcStatus.textContent = 'Select a Pokemon first';
    ivCalcStatus.classList.add('error');
    return;
  }

  const nature = hwNatureSelect.value;
  if (!nature || !NATURE_MODIFIERS[nature]) {
    ivCalcStatus.textContent = 'Select a nature first';
    ivCalcStatus.classList.add('error');
    return;
  }

  const level = parseInt(hwLevelInput.value) || 70;
  const stats = [
    parseInt(statHpInput.value),
    parseInt(statAtkInput.value),
    parseInt(statDefInput.value),
    parseInt(statSpaInput.value),
    parseInt(statSpdInput.value),
    parseInt(statSpeInput.value),
  ];

  if (stats.some(s => isNaN(s) || s < 1)) {
    ivCalcStatus.textContent = 'Enter all 6 stats from the summary screen';
    ivCalcStatus.classList.add('error');
    return;
  }

  const natureMods = NATURE_MODIFIERS[nature];
  const baseStats = pokemonData.base;

  // Calculate possible IVs for each stat
  // HP uses different formula, others use nature modifier
  const possibleIvs = [
    findPossibleIvs(stats[0], baseStats[0], level, 1.0, true),   // HP
    findPossibleIvs(stats[1], baseStats[1], level, natureMods[0], false), // Atk
    findPossibleIvs(stats[2], baseStats[2], level, natureMods[1], false), // Def
    findPossibleIvs(stats[3], baseStats[3], level, natureMods[2], false), // SpA
    findPossibleIvs(stats[4], baseStats[4], level, natureMods[3], false), // SpD
    findPossibleIvs(stats[5], baseStats[5], level, natureMods[4], false), // Spe
  ];

  // Check if any stat has no possible IVs (invalid input)
  const statNames = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'];
  for (let i = 0; i < 6; i++) {
    if (possibleIvs[i].length === 0) {
      ivCalcStatus.textContent = `No valid IV found for ${statNames[i]}. Check your inputs.`;
      ivCalcStatus.classList.add('error');
      hwIvsInput.value = '';
      return;
    }
  }

  // Format the IVs - show range if multiple possibilities
  const formatIv = (arr) => {
    if (arr.length === 1) return arr[0].toString();
    if (arr.length === arr[arr.length - 1] - arr[0] + 1) {
      // Contiguous range
      return `${arr[0]}-${arr[arr.length - 1]}`;
    }
    return arr.join('|');
  };

  // Check if we have exact IVs (single value for each)
  const hasRanges = possibleIvs.some(arr => arr.length > 1);

  if (hasRanges) {
    // Show ranges but warn the user
    const ivStr = possibleIvs.map(formatIv).join('/');
    hwIvsInput.value = '';
    ivCalcStatus.innerHTML = `Possible IVs: <code>${ivStr}</code><br>Multiple possibilities - try a higher level or different Pokemon for exact IVs.`;
    ivCalcStatus.classList.remove('error');

    // If ranges are small, we can still try to find matches
    // For calibration, we'll expand all combinations
  } else {
    // Exact IVs found
    const ivStr = possibleIvs.map(arr => arr[0]).join('/');
    hwIvsInput.value = ivStr;
    ivCalcStatus.textContent = 'IVs calculated successfully!';
    ivCalcStatus.classList.remove('error');
  }

  return possibleIvs;
}

// ============================================================================
// Audio
// ============================================================================

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playBeep(frequency = 880, duration = 0.1, time = null) {
  const ctx = initAudio();
  const startTime = time !== null ? time : ctx.currentTime;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'square';

  gainNode.gain.setValueAtTime(0.3, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);

  return oscillator;
}

function playBeepNow(frequency = 880) {
  playBeep(frequency, 0.1);
}

// ============================================================================
// Initialize WASM
// ============================================================================

async function initWasm() {
  searchStatus.textContent = 'Loading WASM...';
  try {
    await init();
    searchStatus.textContent = 'Building advance index (first load only)...';
    await new Promise(r => setTimeout(r, 10));
    init_index();
    wasmReady = true;
    searchStatus.textContent = 'Ready';
    searchBtn.disabled = false;
    calibrateBtn.disabled = false;
  } catch (err) {
    searchStatus.textContent = `Error loading WASM: ${err.message}`;
    searchStatus.classList.add('error');
    console.error(err);
  }
}

// ============================================================================
// Mode Switching
// ============================================================================

function setMode(mode) {
  currentMode = mode;

  // Update button states
  emulatorModeBtn.classList.toggle('active', mode === 'emulator');
  hardwareModeBtn.classList.toggle('active', mode === 'hardware');

  // Get the sections by their h2 text content
  const cards = document.querySelectorAll('.card');
  let navigateSection = null;

  cards.forEach(card => {
    const h2 = card.querySelector('h2');
    if (h2 && h2.textContent.includes('Navigate to Target')) {
      navigateSection = card;
    }
  });

  // Show/hide appropriate sections
  if (mode === 'emulator') {
    if (navigateSection) navigateSection.style.display = 'block';
    calibrationSection.style.display = 'block';
    timerSection.style.display = 'none';
    hwCalibrationSection.style.display = 'none';
    stopTimer(); // Stop any running timer
  } else {
    if (navigateSection) navigateSection.style.display = 'none';
    calibrationSection.style.display = 'none';
    timerSection.style.display = 'block';
    hwCalibrationSection.style.display = 'block';
  }
}

// ============================================================================
// Search
// ============================================================================

function doSearch() {
  if (!wasmReady) return;

  const tid = parseInt(tidInput.value) || 0;
  const sid = parseInt(sidInput.value) || 0;
  const pokemon = pokemonSelect.value;
  const pokemonName = POKEMON_NAMES[pokemon] || pokemon;
  const maxAdv = parseInt(maxAdvanceInput.value) || 100000;
  const natures = naturesInput.value.trim();

  searchBtn.disabled = true;
  searchStatus.textContent = 'Searching...';
  resultsBody.innerHTML = '';

  setTimeout(() => {
    try {
      const hits = natures
        ? find_shinies_with_natures(tid, sid, natures, 0, maxAdv)
        : find_shinies(tid, sid, 0, maxAdv);

      searchStatus.textContent = `Found ${hits.length} shiny ${pokemonName} target${hits.length === 1 ? '' : 's'}`;

      for (const hit of hits) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${hit.advance}</td>
          <td>${formatTime(hit.advance)}</td>
          <td>${formatPid(hit.pid)}</td>
          <td>${hit.nature}${hit.square_shiny ? ' <span class="square-badge">SQUARE</span>' : ''}</td>
          <td>${formatIvs(hit)}</td>
          <td><button class="select-btn" data-advance="${hit.advance}" data-pid="${hit.pid}">Select</button></td>
        `;
        resultsBody.appendChild(row);
      }
    } catch (err) {
      searchStatus.textContent = `Error: ${err.message}`;
      searchStatus.classList.add('error');
      console.error(err);
    }
    searchBtn.disabled = false;
  }, 10);
}

// ============================================================================
// Target Selection
// ============================================================================

function selectTarget(advance, pid) {
  const pokemon = pokemonSelect.value;
  const pokemonName = POKEMON_NAMES[pokemon] || pokemon;

  currentTarget = {
    advance,
    pokemon,
    pokemonName,
    pid,
  };

  updateAttemptDisplay();
  updateAttemptHistoryDisplay(pokemon);
}

function updateAttemptDisplay() {
  if (!currentTarget) {
    noTargetDiv.style.display = 'block';
    attemptInfoDiv.style.display = 'none';
    currentPressAdvance = null;
    return;
  }

  noTargetDiv.style.display = 'none';
  attemptInfoDiv.style.display = 'block';

  const offset = getOffset(currentTarget.pokemon);
  const pressAdvance = currentTarget.advance - offset;
  currentPressAdvance = pressAdvance;

  const targetTimeMs = advanceToMs(currentTarget.advance);

  attemptPokemonSpan.textContent = currentTarget.pokemonName;
  attemptTargetSpan.textContent = currentTarget.advance;
  attemptTimeSpan.textContent = formatTimeMs(targetTimeMs);
  attemptTargetPidSpan.textContent = formatPid(currentTarget.pid);
  attemptOffsetSpan.textContent = offset;
  pressAdvanceSpan.textContent = pressAdvance;
  pressRngSpan.textContent = formatPid(state_after(pressAdvance));

  // Update counter display
  targetAdvanceDisplay.textContent = pressAdvance;

  // Recalculate frames if we have a current RNG value
  if (currentRngInput.value.trim()) {
    doLookup();
  }
}

function resetOffset() {
  if (currentTarget) {
    setOffset(currentTarget.pokemon, 0);
    updateAttemptDisplay();
  }
}

// ============================================================================
// Advance Counter (Emulator Mode)
// ============================================================================

function doLookup() {
  if (!wasmReady) return;

  const rngVal = parseHex(currentRngInput.value);

  if (rngVal === null) {
    currentAdvanceSpan.textContent = 'Invalid hex';
    framesRemainingSpan.textContent = '-';
    return;
  }

  const currentAdv = lookup_advance(rngVal);

  if (currentAdv < 0) {
    currentAdvanceSpan.textContent = 'Not found (wrong seed or > 1M)';
    framesRemainingSpan.textContent = '-';
  } else {
    currentAdvanceSpan.textContent = currentAdv;

    if (currentPressAdvance !== null) {
      const remaining = currentPressAdvance - currentAdv;
      framesRemainingSpan.textContent = remaining;

      if (remaining === 0) {
        framesRemainingSpan.style.color = '#00ff00';
      } else if (remaining < 0) {
        framesRemainingSpan.style.color = '#ff6b6b';
      } else {
        framesRemainingSpan.style.color = '#ffd700';
      }
    } else {
      framesRemainingSpan.textContent = '-';
      framesRemainingSpan.style.color = '#ffd700';
    }
  }
}

// ============================================================================
// Calibration (Emulator Mode)
// ============================================================================

function doCalibrate() {
  if (!wasmReady || !currentTarget) {
    calibrationResult.innerHTML = '<span style="color: #888">Select a target first</span>';
    return;
  }

  const pid = parseHex(pidInput.value);
  const tid = parseInt(tidInput.value) || 0;
  const sid = parseInt(sidInput.value) || 0;

  if (pid === null) {
    calibrationResult.innerHTML = '<span style="color: #ff6b6b">Invalid PID</span>';
    calibrationResult.className = 'calibration-display';
    return;
  }

  const hitAdvance = find_pid_advance(pid, 1000000);

  if (hitAdvance < 0) {
    calibrationResult.innerHTML = '<span style="color: #888">PID not found in first 1M advances (wrong seed or method?)</span>';
    calibrationResult.className = 'calibration-display';
    return;
  }

  const pokemon = generate_at(hitAdvance, tid, sid);

  const oldOffset = getOffset(currentTarget.pokemon);
  const pressAdvanceUsed = currentTarget.advance - oldOffset;
  const newOffset = hitAdvance - pressAdvanceUsed;

  const hitTarget = (hitAdvance === currentTarget.advance);
  const nextPressAdvance = currentTarget.advance - newOffset;

  let html = `
    <div class="hit-info">
      <div class="hit-advance">Hit Advance: ${hitAdvance}</div>
      <div class="hit-details">
        Nature: ${pokemon.nature} | IVs: ${formatIvs(pokemon)}<br>
        Shiny: ${pokemon.shiny ? 'Yes' + (pokemon.square_shiny ? ' (Square)' : '') : 'No'}
      </div>
    </div>
  `;

  if (hitTarget && pokemon.shiny) {
    html += `
      <div class="offset-info">
        <div class="next-instruction" style="font-size: 1.2rem;">
          TARGET HIT! You got the shiny!
        </div>
      </div>
    `;
    calibrationResult.className = 'calibration-display shiny';
  } else {
    const delta = hitAdvance - currentTarget.advance;
    const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`;

    html += `
      <div class="offset-info">
        <div class="offset-calculated">
          Offset: ${newOffset} (was ${oldOffset}, delta ${deltaStr} from target)
        </div>
        <div class="next-instruction">
          Next attempt: Press A at advance ${nextPressAdvance} (RNG: ${formatPid(state_after(nextPressAdvance))})
        </div>
      </div>
    `;

    setOffset(currentTarget.pokemon, newOffset);
    updateAttemptDisplay();

    calibrationResult.className = 'calibration-display' + (pokemon.shiny ? ' shiny' : '');
  }

  calibrationResult.innerHTML = html;
}

// ============================================================================
// Hardware Calibration (Stat-based)
// ============================================================================

function parseIvs(str) {
  // Parse IVs from format like "31/31/31/31/31/31"
  const parts = str.trim().split('/').map(s => parseInt(s.trim()));
  if (parts.length !== 6 || parts.some(n => isNaN(n) || n < 0 || n > 31)) {
    return null;
  }
  return {
    hp: parts[0],
    atk: parts[1],
    def: parts[2],
    spa: parts[3],
    spd: parts[4],
    spe: parts[5],
  };
}

function ivsMatch(pokemon, targetIvs) {
  return pokemon.hp === targetIvs.hp &&
         pokemon.atk === targetIvs.atk &&
         pokemon.def === targetIvs.def &&
         pokemon.spa === targetIvs.spa &&
         pokemon.spd === targetIvs.spd &&
         pokemon.spe === targetIvs.spe;
}

function generateIvCombinations(possibleIvs) {
  // possibleIvs is array of 6 arrays, each containing possible IVs for that stat
  // Generate all combinations as {hp, atk, def, spa, spd, spe} objects
  const combinations = [];

  function recurse(index, current) {
    if (index === 6) {
      combinations.push({
        hp: current[0],
        atk: current[1],
        def: current[2],
        spa: current[3],
        spd: current[4],
        spe: current[5],
      });
      return;
    }

    for (const iv of possibleIvs[index]) {
      current[index] = iv;
      recurse(index + 1, current);
    }
  }

  recurse(0, [0, 0, 0, 0, 0, 0]);
  return combinations;
}

function doHwCalibrate() {
  if (!wasmReady || !currentTarget) {
    hwCalibrationResult.innerHTML = '<span style="color: #888">Select a target first</span>';
    return;
  }

  const nature = hwNatureSelect.value;
  if (!nature) {
    hwCalibrationResult.innerHTML = '<span style="color: #ff6b6b">Please select a nature</span>';
    return;
  }

  // Get IVs - either from the input field or calculate from stats
  let ivCombinations = [];
  const ivsStr = hwIvsInput.value.trim();

  if (ivsStr) {
    // Use manually entered or calculated exact IVs
    const targetIvs = parseIvs(ivsStr);
    if (!targetIvs) {
      hwCalibrationResult.innerHTML = '<span style="color: #ff6b6b">Invalid IVs format. Use: HP/Atk/Def/SpA/SpD/Spe (e.g. 31/15/20/31/25/10)</span>';
      return;
    }
    ivCombinations = [targetIvs];
  } else {
    // Try to calculate from stats - this handles IV ranges
    const possibleIvs = calculateIvs();
    if (!possibleIvs) {
      hwCalibrationResult.innerHTML = '<span style="color: #ff6b6b">Enter stats to calculate IVs, or enter IVs directly</span>';
      return;
    }

    // Generate all combinations of possible IVs
    // Limit total combinations to prevent browser freeze
    const totalCombos = possibleIvs.reduce((acc, arr) => acc * arr.length, 1);
    if (totalCombos > 1000) {
      hwCalibrationResult.innerHTML = `<span style="color: #ff6b6b">Too many IV combinations (${totalCombos}). Try getting more precise stats.</span>`;
      return;
    }

    // Generate all combinations
    ivCombinations = generateIvCombinations(possibleIvs);
  }

  const tid = parseInt(tidInput.value) || 0;
  const sid = parseInt(sidInput.value) || 0;

  // Search range: ±2000 advances from the target
  const searchRadius = 2000;
  const minAdv = Math.max(0, currentTarget.advance - searchRadius);
  const maxAdv = currentTarget.advance + searchRadius;

  const matches = [];

  for (let adv = minAdv; adv <= maxAdv; adv++) {
    const pokemon = generate_at(adv, tid, sid);
    if (pokemon.nature !== nature) continue;

    // Check if this Pokemon's IVs match any of our possible combinations
    for (const targetIvs of ivCombinations) {
      if (ivsMatch(pokemon, targetIvs)) {
        matches.push({
          advance: adv,
          pokemon,
          delta: adv - currentTarget.advance,
        });
        break; // Don't add same advance multiple times
      }
    }
  }

  if (matches.length === 0) {
    hwCalibrationResult.innerHTML = `
      <span style="color: #ff6b6b">No matching advance found within ±${searchRadius} of target.</span>
      <div style="margin-top: 0.5rem; color: #888; font-size: 0.85rem;">
        Double-check the nature and IVs. Make sure you're using an IV calculator<br>
        to get exact values from the Pokemon's stats, level, and nature.
      </div>
    `;
    hwCalibrationResult.className = 'calibration-display';
    return;
  }

  // If multiple matches (rare but possible), show all
  const oldOffset = getOffset(currentTarget.pokemon);
  const pressAdvanceUsed = currentTarget.advance - oldOffset;

  let html = '';

  if (matches.length === 1) {
    const match = matches[0];
    const newOffset = match.advance - pressAdvanceUsed;
    const hitTarget = match.advance === currentTarget.advance;

    // Record this attempt
    recordAttempt(currentTarget.pokemon, match.delta);

    html = `
      <div class="hit-info">
        <div class="hit-advance">Hit Advance: ${match.advance}</div>
        <div class="hit-details">
          PID: ${formatPid(match.pokemon.pid)}<br>
          Nature: ${match.pokemon.nature} | IVs: ${formatIvs(match.pokemon)}<br>
          Shiny: ${match.pokemon.shiny ? 'Yes' + (match.pokemon.square_shiny ? ' (Square!)' : '') : 'No'}
        </div>
      </div>
    `;

    if (hitTarget && match.pokemon.shiny) {
      html += `
        <div class="offset-info">
          <div class="next-instruction" style="font-size: 1.2rem;">
            TARGET HIT! You got the shiny!
          </div>
        </div>
      `;
      hwCalibrationResult.className = 'calibration-display shiny';
    } else {
      const deltaStr = match.delta >= 0 ? `+${match.delta}` : `${match.delta}`;
      const nextPressAdvance = currentTarget.advance - newOffset;

      html += `
        <div class="offset-info">
          <div class="offset-calculated">
            Offset: ${newOffset} (was ${oldOffset}, hit ${deltaStr} from target)
          </div>
          <div class="next-instruction">
            Next attempt: Timer will target advance ${nextPressAdvance}
          </div>
        </div>
      `;

      setOffset(currentTarget.pokemon, newOffset);
      updateAttemptDisplay();

      hwCalibrationResult.className = 'calibration-display' + (match.pokemon.shiny ? ' shiny' : '');
    }
  } else {
    // Multiple matches - show all and let user pick
    html = `
      <div style="color: #ffd700; margin-bottom: 0.75rem;">
        Found ${matches.length} possible matches. This can happen with similar IV spreads.
      </div>
    `;

    for (const match of matches) {
      const deltaStr = match.delta >= 0 ? `+${match.delta}` : `${match.delta}`;
      html += `
        <div style="padding: 0.5rem; background: #0f3460; border-radius: 4px; margin-bottom: 0.5rem;">
          <div>Advance ${match.advance} (${deltaStr} from target)</div>
          <div style="color: #888; font-size: 0.85rem;">
            PID: ${formatPid(match.pokemon.pid)} |
            Shiny: ${match.pokemon.shiny ? 'Yes' : 'No'}
          </div>
          <button class="small-btn hw-apply-offset" data-advance="${match.advance}" style="margin-top: 0.5rem;">
            Use this offset
          </button>
        </div>
      `;
    }

    hwCalibrationResult.className = 'calibration-display';
  }

  hwCalibrationResult.innerHTML = html;
}

function applyHwOffset(hitAdvance) {
  if (!currentTarget) return;

  const oldOffset = getOffset(currentTarget.pokemon);
  const pressAdvanceUsed = currentTarget.advance - oldOffset;
  const newOffset = hitAdvance - pressAdvanceUsed;
  const delta = hitAdvance - currentTarget.advance;

  // Record this attempt
  recordAttempt(currentTarget.pokemon, delta);

  setOffset(currentTarget.pokemon, newOffset);
  updateAttemptDisplay();

  const nextPressAdvance = currentTarget.advance - newOffset;
  hwCalibrationResult.innerHTML = `
    <div class="offset-info">
      <div class="offset-calculated">
        Offset set to: ${newOffset}
      </div>
      <div class="next-instruction">
        Next attempt: Timer will target advance ${nextPressAdvance}
      </div>
    </div>
  `;
  hwCalibrationResult.className = 'calibration-display success';
}

// ============================================================================
// Hardware Timer
// ============================================================================

function startTimer() {
  if (!currentTarget) {
    timerPhaseSpan.textContent = 'Select a target first';
    return;
  }

  initAudio();
  stopTimer(); // Clear any existing timer

  const preTimerMs = parseInt(preTimerInput.value) || 5000;
  const beepInterval = parseInt(beepIntervalInput.value) || 500;
  const audioOffset = parseInt(audioOffsetInput.value) || 0;

  // Calculate total time to target (in ms)
  const offset = getOffset(currentTarget.pokemon);
  const pressAdvance = currentTarget.advance - offset;
  const targetTimeMs = advanceToMs(pressAdvance);

  // Total timer duration: target time + audio offset adjustment
  const totalDuration = targetTimeMs + audioOffset;

  // Beep times: 3 beeps ending at totalDuration
  // beep 3 at totalDuration, beep 2 at totalDuration - interval, etc.
  const beepTimes = [];
  for (let i = 2; i >= 0; i--) {
    beepTimes.push(totalDuration - (i * beepInterval));
  }

  timerRunning = true;
  timerStartTime = audioCtx.currentTime;

  // Schedule beeps using Web Audio (precise timing)
  scheduledBeeps = [];

  // Pre-timer end beeps: 3 beeps to signal "reset now!" (lower octave than main beeps)
  const preBeepEnd = timerStartTime + preTimerMs / 1000;
  for (let i = 2; i >= 0; i--) {
    const preBeepTime = preBeepEnd - (i * beepInterval / 1000);
    const freq = (i === 0) ? 660 : 440; // Final pre-beep slightly higher
    const osc = playBeep(freq, 0.15, preBeepTime);
    scheduledBeeps.push({ time: preBeepTime, beepNum: -1, osc });
  }

  // Main countdown beeps
  beepTimes.forEach((timeMs, index) => {
    const beepNum = index + 1;
    const audioTime = timerStartTime + (preTimerMs + timeMs) / 1000;

    // Final beep is higher pitch for "press A"
    const freq = (beepNum === 3) ? 1320 : 880;

    const osc = playBeep(freq, 0.15, audioTime);
    scheduledBeeps.push({ time: audioTime, beepNum, osc });
  });

  // Update UI
  startTimerBtn.textContent = 'Reset';
  stopTimerBtn.disabled = false;
  resetBeepDots();

  // Start animation loop
  updateTimerDisplay(preTimerMs, totalDuration, beepTimes);
}

function stopTimer() {
  timerRunning = false;
  timerStartTime = null;
  practiceMode = false;
  practiceTargetTime = null;

  if (timerAnimationFrame) {
    cancelAnimationFrame(timerAnimationFrame);
    timerAnimationFrame = null;
  }

  // Cancel scheduled beeps
  scheduledBeeps.forEach(b => {
    try { b.osc.stop(); } catch (e) { /* already stopped */ }
  });
  scheduledBeeps = [];

  // Reset UI
  startTimerBtn.textContent = 'Start Timer';
  startTimerBtn.disabled = false;
  stopTimerBtn.disabled = true;
  practiceBtn.textContent = 'Practice (3s)';
  practiceBtn.disabled = false;
  practiceTapBtn.style.display = 'none';
  timerPhaseSpan.textContent = 'Ready';
  timerCountdownSpan.textContent = '-';
  timerCountdownSpan.className = 'timer-countdown';
  timerInstructionSpan.textContent = '';
  timerInstructionSpan.className = 'timer-instruction';
  resetBeepDots();
}

function resetBeepDots() {
  timerBeepDots.forEach(dot => {
    dot.className = 'beep-dot';
  });
}

function startPractice() {
  initAudio();
  stopTimer(); // Clear any existing timer

  const beepInterval = parseInt(beepIntervalInput.value) || 500;
  const practiceDuration = 3000; // 3 seconds

  timerRunning = true;
  practiceMode = true;
  practiceTapped = false;
  timerStartTime = audioCtx.currentTime;

  // Beep times: 3 beeps ending at practiceDuration
  const beepTimes = [];
  for (let i = 2; i >= 0; i--) {
    beepTimes.push(practiceDuration - (i * beepInterval));
  }

  // Store target time for tap comparison
  practiceTargetTime = timerStartTime + practiceDuration / 1000;

  // Schedule beeps
  scheduledBeeps = [];
  beepTimes.forEach((timeMs, index) => {
    const beepNum = index + 1;
    const audioTime = timerStartTime + timeMs / 1000;

    // Final beep is higher pitch for "press A"
    const freq = (beepNum === 3) ? 1320 : 880;

    const osc = playBeep(freq, 0.15, audioTime);
    scheduledBeeps.push({ time: audioTime, beepNum, osc });
  });

  // Update UI
  startTimerBtn.textContent = 'Reset';
  startTimerBtn.disabled = false;
  stopTimerBtn.disabled = false;
  practiceBtn.textContent = 'Reset';
  practiceTapBtn.style.display = 'block';
  practiceResultDiv.textContent = '';
  practiceResultDiv.className = 'practice-result';
  resetBeepDots();

  // Start animation loop (no pre-timer for practice)
  updateTimerDisplay(0, practiceDuration, beepTimes);
}

function handlePracticeTap() {
  if (!practiceMode || !practiceTargetTime || practiceTapped) return;

  practiceTapped = true;
  const tapTime = audioCtx.currentTime;
  const deltaMs = (tapTime - practiceTargetTime) * 1000;
  const deltaFrames = deltaMs / getMsPerFrame();

  // Store attempt
  practiceAttempts.push(deltaMs);
  if (practiceAttempts.length > 20) {
    practiceAttempts.shift(); // Keep last 20
  }

  // Display result
  const sign = deltaMs >= 0 ? '+' : '';
  const framesStr = deltaFrames.toFixed(1);
  const msStr = deltaMs.toFixed(0);

  if (Math.abs(deltaMs) < 17) {
    // Within 1 frame - perfect!
    practiceResultDiv.textContent = `PERFECT! ${sign}${msStr}ms (${sign}${framesStr} frames)`;
    practiceResultDiv.className = 'practice-result perfect';
  } else if (deltaMs < 0) {
    practiceResultDiv.textContent = `Early: ${msStr}ms (${framesStr} frames)`;
    practiceResultDiv.className = 'practice-result early';
  } else {
    practiceResultDiv.textContent = `Late: +${msStr}ms (+${framesStr} frames)`;
    practiceResultDiv.className = 'practice-result late';
  }

  // Show stats
  updatePracticeStats();
}

function updatePracticeStats() {
  if (practiceAttempts.length === 0) return;

  const avg = practiceAttempts.reduce((a, b) => a + b, 0) / practiceAttempts.length;
  const avgFrames = avg / getMsPerFrame();
  const last5 = practiceAttempts.slice(-5);

  // Suggested audio offset based on average
  const suggestedOffset = -Math.round(avg);

  practiceStatsDiv.style.display = 'block';
  practiceStatsDiv.innerHTML = `
    <div class="stat-row">
      <span>Attempts:</span>
      <span class="stat-value">${practiceAttempts.length}</span>
    </div>
    <div class="stat-row">
      <span>Average:</span>
      <span class="stat-value">${avg >= 0 ? '+' : ''}${avg.toFixed(0)}ms (${avgFrames >= 0 ? '+' : ''}${avgFrames.toFixed(1)} frames)</span>
    </div>
    <div class="stat-row">
      <span>Last 5:</span>
      <span class="stat-value">${last5.map(d => (d >= 0 ? '+' : '') + d.toFixed(0)).join(', ')}ms</span>
    </div>
    <div class="stat-row">
      <span>Suggested offset:</span>
      <span class="stat-value">${suggestedOffset >= 0 ? '+' : ''}${suggestedOffset}ms</span>
    </div>
  `;

  // Auto-restart practice after 1.5s
  setTimeout(() => {
    if (!timerRunning) {
      startPractice();
    }
  }, 1500);
}

function updateTimerDisplay(preTimerMs, totalDuration, beepTimes) {
  if (!timerRunning || !audioCtx) return;

  const elapsed = (audioCtx.currentTime - timerStartTime) * 1000;

  if (elapsed < preTimerMs) {
    // Pre-timer phase
    const remaining = preTimerMs - elapsed;
    timerPhaseSpan.textContent = 'Pre-timer (Reset now!)';
    timerCountdownSpan.textContent = formatTimeMs(remaining);
    timerCountdownSpan.className = 'timer-countdown';
    timerInstructionSpan.textContent = 'Soft reset your GBA now!';
    timerInstructionSpan.className = 'timer-instruction action';
  } else {
    // Main countdown phase
    const mainElapsed = elapsed - preTimerMs;
    const remaining = totalDuration - mainElapsed;

    if (remaining <= 0) {
      // Timer complete
      timerPhaseSpan.textContent = 'Complete';
      timerCountdownSpan.textContent = '0.00';
      timerCountdownSpan.className = 'timer-countdown final';
      timerInstructionSpan.textContent = 'Press A NOW!';
      timerInstructionSpan.className = 'timer-instruction action';

      // Light up all beeps (final one special)
      timerBeepDots.forEach((dot, i) => {
        dot.classList.add('active');
        if (i === 2) dot.classList.add('beep6'); // Final beep uses beep6 style (red)
      });

      // Stop after a short delay
      setTimeout(() => {
        if (timerRunning) {
          // If practice mode and didn't tap, show miss
          if (practiceMode && !practiceTapped) {
            practiceResultDiv.textContent = 'Missed! Try again...';
            practiceResultDiv.className = 'practice-result late';
            // Auto-restart after 1s
            setTimeout(() => {
              if (!timerRunning) startPractice();
            }, 1000);
          }
          stopTimer();
        }
      }, 1000);
      return;
    }

    timerPhaseSpan.textContent = 'Countdown';
    timerCountdownSpan.textContent = formatTimeMs(remaining);

    // Check which beeps have fired
    const finalBeepIndex = beepTimes.length - 1;
    beepTimes.forEach((beepTime, index) => {
      if (mainElapsed >= beepTime) {
        const dot = timerBeepDots[index];
        dot.classList.add('active');
        if (index === finalBeepIndex) dot.classList.add('beep6'); // Final beep red
      }
    });

    // Update instruction based on final beep
    const finalBeepTime = beepTimes[finalBeepIndex];

    if (mainElapsed >= finalBeepTime - 100) {
      timerCountdownSpan.className = 'timer-countdown final';
      timerInstructionSpan.textContent = 'Press A NOW!';
      timerInstructionSpan.className = 'timer-instruction action';
    } else if (mainElapsed >= finalBeepTime - 1000) {
      timerCountdownSpan.className = 'timer-countdown running';
      timerInstructionSpan.textContent = 'Get ready...';
      timerInstructionSpan.className = 'timer-instruction';
    } else {
      timerCountdownSpan.className = 'timer-countdown';
      timerInstructionSpan.textContent = '';
      timerInstructionSpan.className = 'timer-instruction';
    }
  }

  timerAnimationFrame = requestAnimationFrame(() => {
    updateTimerDisplay(preTimerMs, totalDuration, beepTimes);
  });
}

// ============================================================================
// Event Listeners
// ============================================================================

searchBtn.addEventListener('click', doSearch);
calibrateBtn.addEventListener('click', doCalibrate);
resetOffsetBtn.addEventListener('click', resetOffset);

// Mode switching
emulatorModeBtn.addEventListener('click', () => setMode('emulator'));
hardwareModeBtn.addEventListener('click', () => setMode('hardware'));

// Timer controls
startTimerBtn.addEventListener('click', startTimer);
stopTimerBtn.addEventListener('click', stopTimer);
practiceBtn.addEventListener('click', startPractice);
practiceTapBtn.addEventListener('click', handlePracticeTap);

// Hardware calibration
calcIvsBtn.addEventListener('click', calculateIvs);
hwCalibrateBtn.addEventListener('click', doHwCalibrate);
hwCalibrationResult.addEventListener('click', (e) => {
  if (e.target.classList.contains('hw-apply-offset')) {
    const advance = parseInt(e.target.dataset.advance);
    applyHwOffset(advance);
  }
});

// Delete attempt buttons
attemptHistoryList.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-attempt-btn')) {
    const pokemon = e.target.dataset.pokemon;
    const index = parseInt(e.target.dataset.index);
    deleteAttempt(pokemon, index);
  }
});

// Auto-update counter on RNG input change (debounced)
let lookupTimeout;
currentRngInput.addEventListener('input', () => {
  clearTimeout(lookupTimeout);
  lookupTimeout = setTimeout(() => {
    if (currentRngInput.value.trim().length >= 8) {
      doLookup();
    }
  }, 300);
});

currentRngInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doLookup();
});

pidInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doCalibrate();
});

// Delegate click for select buttons in results table
document.getElementById('results').addEventListener('click', (e) => {
  if (e.target.classList.contains('select-btn')) {
    const advance = parseInt(e.target.dataset.advance);
    const pid = parseInt(e.target.dataset.pid);
    selectTarget(advance, pid);
  }
});

// ============================================================================
// Initialization
// ============================================================================

// Disable buttons until WASM loads
searchBtn.disabled = true;
calibrateBtn.disabled = true;

// Load saved data
loadOffsets();
loadAttemptHistory();

// Set initial mode
setMode('hardware');

// Initialize attempt history display
updateAttemptHistoryDisplay(null);

// Start
initWasm();
