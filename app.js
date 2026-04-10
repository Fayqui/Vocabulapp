// ===============
// Vocabulapp MVP 0.1+
// - Matching + puntuación + turnos
// - Bonus (normal/refuerzo) + Write (acento ignore/strict)
// - Fases automáticas
// - Refuerzo por fase
// - Fase final
// - Pantallas overlay por fase
// - Barra de progreso
// - Guardado / continuar partida
// ===============
 
const STORAGE_KEY_BASE = "vocabulapp.themes.v1";
const SAVE_KEY_BASE = "vocabulapp.save.v1";
const LANGUAGE_KEY = "vocabulapp.language.v1";
const FINAL_MAX_PAIRS = 12;
 
const PHASE_IMAGE_MAP = {
  1: "phase1",
  2: "phase2",
  3: "phase3",
  final: "phasefinal",
  victory: "victory",
};

function getPhaseImageFile(baseName) {
  const lang = state.currentLanguage === "en" ? "en" : "fr";
  return `${baseName}-${lang}.png`;
}
 
const state = {
 selectedThemeId: null,
currentLanguage: localStorage.getItem(LANGUAGE_KEY) || null,
};
 
const gameState = {
  locked: false,
  selectedES: null,
  selectedFR: null,
  matchedCount: 0,
  totalPairs: 0,
 
  mode: "solo",
  currentPlayer: 0,
  scores: [0],
 
  mastered: new Set(),
  toReinforce: new Set(),
 
  difficulty: "normal",
  accentMode: "ignore",
  playFinal: false,
 
  themePairs: [],
 
  phaseLabels: [],
  phaseBlocks: [],
  currentPhaseIndex: 0,
  currentPhasePairIds: new Set(),
 
  round: "normal",
 
  writeAttempt: null,
  isFinished: false,
};
 
const els = {
  btnAddTheme: document.getElementById("btnAddTheme"),
  btnResumeGame: document.getElementById("btnResumeGame"),
  btnDeleteSave: document.getElementById("btnDeleteSave"),
  themeList: document.getElementById("themeList"),
  emptyState: document.getElementById("emptyState"),
 
  dialog: document.getElementById("themeDialog"),
  form: document.getElementById("themeForm"),
  btnCancel: document.getElementById("btnCancel"),
  themeName: document.getElementById("themeName"),
  themePairs: document.getElementById("themePairs"),
 
  screenThemes: document.getElementById("screenThemes"),
  screenConfig: document.getElementById("screenConfig"),
  screenGame: document.getElementById("screenGame"),
  screenStart: document.getElementById("screenStart"),
  btnLangFR: document.getElementById("btnLangFR"),
  btnLangEN: document.getElementById("btnLangEN"),
  btnChangeLanguage: document.getElementById("btnChangeLanguage"),
 
  btnBack: document.getElementById("btnBack"),
  configThemeTitle: document.getElementById("configThemeTitle"),
  configThemeMeta: document.getElementById("configThemeMeta"),
  gameMode: document.getElementById("gameMode"),
  difficulty: document.getElementById("difficulty"),
  accentField: document.getElementById("accentField"),
  accentMode: document.getElementById("accentMode"),
  p1: document.getElementById("p1"),
  p2: document.getElementById("p2"),
  btnStart: document.getElementById("btnStart"),
 
  btnExitGame: document.getElementById("btnExitGame"),
  gameTitle: document.getElementById("gameTitle"),
  gameMeta: document.getElementById("gameMeta"),
  boardES: document.getElementById("boardES"),
  boardFR: document.getElementById("boardFR"),
 
  bonusDialog: document.getElementById("bonusDialog"),
  bonusTitle: document.getElementById("bonusTitle"),
  bonusText: document.getElementById("bonusText"),
  btnBonusYes: document.getElementById("btnBonusYes"),
  btnBonusNo: document.getElementById("btnBonusNo"),
 
  writeDialog: document.getElementById("writeDialog"),
  writeInput: document.getElementById("writeInput"),
  btnWriteOk: document.getElementById("btnWriteOk"),
  writeFeedback: document.getElementById("writeFeedback"),
 
  phaseOverlay: document.getElementById("phaseOverlay"),
  phaseImage: document.getElementById("phaseImage"),
  phaseContent: document.querySelector(".phase-content"),
  btnContinuePhase: document.getElementById("btnContinuePhase"),

  btnAudioToggle: document.getElementById("btnAudioToggle"),

  appDialog: document.getElementById("appDialog"),
  appDialogTitle: document.getElementById("appDialogTitle"),
  appDialogText: document.getElementById("appDialogText"),
  appDialogOk: document.getElementById("appDialogOk"),
  appDialogCancel: document.getElementById("appDialogCancel"),
  appDialogActions: document.getElementById("appDialogActions"),
};

function preloadImages() {
  const images = [
    "assets/gameplay-screen.png",
    "assets/gameplay-book.png",
    "assets/panel-temas-fr.png",
    "assets/panel-temas-en.png",
    "assets/monsieur-bete.png",
    "assets/card-face.png",
    "assets/banderola+logo.png"
  ];

  images.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

// =========================
// AUDIO
// =========================
const AUDIO_PREF_KEY = "vocabulapp.audio.enabled.v1";

const menuMusic = new Audio("assets/menu.mp3");
menuMusic.loop = true;
menuMusic.volume = 0.22;
menuMusic.preload = "auto";

const gameplayMusic = new Audio("assets/gameplay.mp3");
gameplayMusic.loop = true;
gameplayMusic.volume = 0.18;
gameplayMusic.preload = "auto";

let audioEnabled = localStorage.getItem(AUDIO_PREF_KEY) !== "false";
let audioUnlocked = false;

menuMusic.muted = !audioEnabled;
gameplayMusic.muted = !audioEnabled;

function updateAudioButtonUI() {
  if (!els.btnAudioToggle) return;
  els.btnAudioToggle.textContent = audioEnabled ? "🔊" : "🔇";

  els.btnAudioToggle.classList.toggle("is-muted", !audioEnabled);

// opcional: cambia el title para comprobar si responde
  els.btnAudioToggle.title = audioEnabled ? "Apagar audio" : "Encender audio";
}

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;

  // desbloqueo inicial para navegadores
  const p = menuMusic.play();
  if (p && typeof p.then === "function") {
    p.then(() => {
      menuMusic.pause();
      menuMusic.currentTime = 0;
      syncMusicToScreen(getCurrentScreenName());
    }).catch(() => {});
  }
}

function stopAllMusic() {
  menuMusic.pause();
  gameplayMusic.pause();
}

function playMenuMusic() {
  if (!audioEnabled || !audioUnlocked) return;

  gameplayMusic.pause();
  gameplayMusic.currentTime = 0;

  if (menuMusic.paused) {
    menuMusic.play().catch(() => {});
  }
}

function playGameplayMusic() {
  if (!audioEnabled || !audioUnlocked) return;

  menuMusic.pause();
  menuMusic.currentTime = 0;

  if (gameplayMusic.paused) {
    gameplayMusic.play().catch(() => {});
  }
}

function getCurrentScreenName() {
  if (els.screenGame && els.screenGame.style.display !== "none") return "game";
  if (els.screenConfig && els.screenConfig.style.display !== "none") return "config";
  if (els.screenThemes && els.screenThemes.style.display !== "none") return "themes";
  return "start";
}

function syncMusicToScreen(screenName) {
  if (!audioEnabled || !audioUnlocked) {
    stopAllMusic();
    return;
  }

  if (screenName === "game") {
    playGameplayMusic();
  } else {
    playMenuMusic();
  }
}

function toggleAudio() {
  audioEnabled = !audioEnabled;
  localStorage.setItem(AUDIO_PREF_KEY, String(audioEnabled));
  updateAudioButtonUI();

// Mutear / desmutear TODO
  menuMusic.muted = !audioEnabled;
  gameplayMusic.muted = !audioEnabled;

  if (!audioEnabled) {
    stopAllMusic();
  } else {
    unlockAudio();

    syncMusicToScreen(getCurrentScreenName());
  }
}

// Efectos: usar instancia nueva cada vez para que siempre suenen
function playUISound() {
  if (!audioEnabled || !audioUnlocked) return;
  const s = new Audio("assets/blip.wav");
  s.volume = 0.35;
  s.play().catch(() => {});
}

function playFlipSound() {
  if (!audioEnabled || !audioUnlocked) return;
  const s = new Audio("assets/flip-card.wav");
  s.volume = 0.35;
  s.play().catch(() => {});
}

function playCoinSound() {
  if (!audioEnabled || !audioUnlocked) return;
  const s = new Audio("assets/coin.wav");
  s.volume = 0.45;
  s.play().catch(() => {});
}
const screens = {
  start: els.screenStart,
  themes: els.screenThemes,
  config: els.screenConfig,
  game: els.screenGame,
};
 
function showScreen(name) {
  const allScreens = [
    els.screenStart,
    els.screenThemes,
    els.screenConfig,
    els.screenGame,
  ];

  allScreens.forEach((screen) => {
    if (!screen) return;
    screen.style.display = "none";
    screen.classList.remove("screen-visible");
  });

  let active = null;
  if (name === "start") active = els.screenStart;
  if (name === "themes") active = els.screenThemes;
  if (name === "config") active = els.screenConfig;
  if (name === "game") active = els.screenGame;

  if (!active) return;

  active.style.display = "block";
  setTimeout(() => {
    active.classList.add("screen-visible");
  }, 20);

  syncMusicToScreen(name);
}
 
function loadThemes() {
  try {
    const raw = localStorage.getItem(getThemesStorageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error en loadThemes:",
error)
    return [];
  }
}
 
function saveThemes(themes) {
  localStorage.setItem(getThemesStorageKey(), JSON.stringify(themes));
}

async function deleteThemeById(themeId, themeName) {
  const ok = await showAppConfirm(
    "Eliminar tema",
    `¿Seguro que quieres eliminar el tema "${themeName}"?`,
    "Eliminar",
    "Cancelar"
  );
  if (!ok) return;

  const themes = loadThemes().filter((theme) => theme.id !== themeId);
  saveThemes(themes);

  if (state.selectedThemeId === themeId) {
    state.selectedThemeId = null;
  }

  renderThemes(themes);
}

 
function parsePairs(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
 
  const pairs = [];
  for (const line of lines) {
    const parts = line.split(/\s*[-|;]\s*/).map((p) => p.trim());
    if (parts.length < 2) continue;
    const fr = parts[0];
    const es = parts[1];
    if (!fr || !es) continue;
    pairs.push({ fr, es });
  }
  return pairs;
}
 
function createTheme({ name, pairs }) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name,
    pairs,
    status: "Nuevo",
    createdAt: Date.now(),
  };
}
 
function renderThemes(themes) {
  els.themeList.innerHTML = "";

  if (themes.length === 0) {
    els.emptyState.style.display = "block";
  } else {
    els.emptyState.style.display = "none";
  }

  for (const t of themes) {
    const li = document.createElement("li");
    li.className = "theme-item";
    li.style.cursor = "pointer";

    const left = document.createElement("div");

    const name = document.createElement("div");
    name.className = "theme-name";
    name.textContent = t.name;

    const meta = document.createElement("div");
    meta.className = "theme-meta";
    meta.textContent = `${t.pairs.length} palabras`;

    left.appendChild(name);
    left.appendChild(meta);

    const right = document.createElement("div");
    right.className = "theme-actions-right";

    const status = document.createElement("div");
    status.className = "theme-meta theme-status";
    status.textContent = t.status || "Nuevo";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "theme-delete";
    deleteBtn.setAttribute("aria-label", `Eliminar tema ${t.name}`);
    deleteBtn.title = `Eliminar tema ${t.name}`;
    deleteBtn.textContent = "✕";

    deleteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteThemeById(t.id, t.name);
    });

    right.appendChild(status);
    right.appendChild(deleteBtn);

    li.appendChild(left);
    li.appendChild(right);

    li.addEventListener("click", () => {
      state.selectedThemeId = t.id;
      openConfigForTheme(t);
    });

    els.themeList.appendChild(li);
  }

  updateResumeButtons();
  updateTutorialBubbleVisibility();
}
 
function openDialog() {
  els.form.reset();
  els.dialog.showModal();
  els.themeName.focus();
}
 
function closeDialog() {
  els.dialog.close();
}

function showAppDialog({
  title = "Mensaje",
  text = "",
  okText = "Aceptar",
  cancelText = "Cancelar",
  showCancel = false,
}) {
  return new Promise((resolve) => {
    els.appDialogTitle.textContent = title;
    els.appDialogText.textContent = text;
    els.appDialogOk.textContent = okText;
    els.appDialogCancel.textContent = cancelText;
    els.appDialogCancel.style.display = showCancel ? "inline-flex" : "none";

    const cleanup = () => {
      els.appDialogOk.removeEventListener("click", onOk);
      els.appDialogCancel.removeEventListener("click", onCancel);
      els.appDialog.removeEventListener("cancel", onCancel);
    };

    const onOk = () => {
      cleanup();
      els.appDialog.close();
      resolve(true);
    };

    const onCancel = () => {
      cleanup();
      els.appDialog.close();
      resolve(false);
    };

    els.appDialogOk.addEventListener("click", onOk);
    els.appDialogCancel.addEventListener("click", onCancel);
    els.appDialog.addEventListener("cancel", onCancel, { once: true });

    els.appDialog.showModal();
  });
}

function showAppAlert(title, text, okText = "Aceptar") {
  return showAppDialog({ title, text, okText, showCancel: false });
}

function showAppConfirm(title, text, okText = "Aceptar", cancelText = "Cancelar") {
  return showAppDialog({ title, text, okText, cancelText, showCancel: true });
}
 
function updatePlayerFields() {
  const isSolo = els.gameMode.value === "solo";
  const p2Field = els.p2?.closest("label.field");
  if (p2Field) p2Field.style.display = isSolo ? "none" : "grid";
}
 
function updateAccentField() {
  if (!els.accentField) return;
  els.accentField.style.display = els.difficulty.value === "write" ? "grid" : "none";
}
 
function openConfigForTheme(theme) {
  els.configThemeTitle.textContent = `Configurar: ${theme.name}`;
  els.configThemeMeta.textContent = `${theme.pairs.length} palabras`;
 
  els.gameMode.value = "solo";
  els.difficulty.value = "normal";
  if (els.accentMode) els.accentMode.value = "ignore";
 
  els.p1.value = "Jugador 1";
  els.p2.value = "Jugador 2";
 
  updatePlayerFields();
  updateAccentField();
  showScreen("config");
}
 
function getPlayerNames() {
  const p1Name = (els.p1.value || "Jugador 1").trim() || "Jugador 1";
  const p2Name = (els.p2.value || "Jugador 2").trim() || "Jugador 2";
  return { p1Name, p2Name };
}
 
function getSelectedPhases() {
  const checks = document.querySelectorAll('input.phase[type="checkbox"]');
  return Array.from(checks).filter((c) => c.checked).map((c) => c.value);
}
 
function getThemesStorageKey() {
  return `${STORAGE_KEY_BASE}.${state.currentLanguage || "fr"}`;
}

function getSaveStorageKey() {
  return `${SAVE_KEY_BASE}.${state.currentLanguage || "fr"}`;
}

async function selectLanguage(lang) {
  state.currentLanguage = lang;
  localStorage.setItem(LANGUAGE_KEY, lang);

  await showLanguageIntroAndGoThemes();

  renderThemes(loadThemes());
  updateResumeButtons();
  updateTutorialBubbleVisibility();
  showScreen("themes");
}

function getIntroImageByLanguage() {
  return state.currentLanguage === "en" ? "intro-en.png" : "intro-fr.png";
}

async function showLanguageIntroAndGoThemes() {
  const imageName = getIntroImageByLanguage();

  if (!els.phaseOverlay || !els.phaseImage || !els.phaseContent || !els.btnContinuePhase) {
    return;
  }

  els.phaseImage.src = "assets/" + imageName;
  els.phaseImage.style.display = "block";
  els.phaseContent.style.backgroundImage = "none";

  els.phaseOverlay.style.display = "flex";
  els.btnContinuePhase.style.display = "none";

  await new Promise((resolve) => setTimeout(resolve, 3000));

  els.phaseOverlay.style.display = "none";
  els.btnContinuePhase.style.display = "inline-block";
}

function updateScoreBoard() {
  const sb = document.getElementById("scoreBoard");
  if (!sb) return;
 
  sb.innerHTML = "";
 
  const { p1Name, p2Name } = getPlayerNames();
 
  if (gameState.mode === "solo") {
    sb.appendChild(createScore(`Puntos: ${gameState.scores[0]}`));
    return;
  }
 
  if (gameState.mode === "equipe") {
    const currentName = gameState.currentPlayer === 0 ? p1Name : p2Name;
    sb.appendChild(createScore(`Turno: ${currentName}`, true));
    sb.appendChild(createScore(`Equipo: ${gameState.scores[0]}`));
    return;
  }
 
  const p1 = createScore(`${p1Name}: ${gameState.scores[0]}`, gameState.currentPlayer === 0);
  const p2 = createScore(`${p2Name}: ${gameState.scores[1]}`, gameState.currentPlayer === 1);
 
  sb.appendChild(p1);
  sb.appendChild(p2);
}
 
function createScore(text, active = false) {
  const div = document.createElement("div");
  div.className = "score" + (active ? " active" : "");
  div.textContent = text;
  return div;
}
 
let bonusResolver = null;
 
function askBonus(playerLabel) {
  return new Promise((resolve) => {
    bonusResolver = resolve;

    const spokenLanguage = state.currentLanguage === "fr" ? "francés" : "inglés";

    els.bonusTitle.textContent = "Bonus";
    els.bonusText.textContent = `${playerLabel}: ¿Dijiste la palabra en ${spokenLanguage} antes de girar?`;
    els.bonusDialog.showModal();
  });
}
 
function closeBonus(value) {
  if (bonusResolver) bonusResolver(value);
  bonusResolver = null;
  els.bonusDialog.close();
}
 
function normalizeLoose(txt) {
  return (txt || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
 
function normalizeStrict(txt) {
  return (txt || "").toLowerCase().trim();
}
 
function normalizeForWrite(txt) {
  return gameState.accentMode === "strict" ? normalizeStrict(txt) : normalizeLoose(txt);
}
 
function askWrite(correctFR) {
  return new Promise((resolve) => {
    els.writeFeedback.textContent = "";
    els.writeInput.value = "";
    els.btnWriteOk.disabled = false;
 
    els.writeDialog.showModal();
    setTimeout(() => els.writeInput.focus(), 50);
 
    const onOk = () => {
      playUISound();
      const user = normalizeForWrite(els.writeInput.value);
      const correct = normalizeForWrite(correctFR);
      const ok = user && user === correct;
 
      els.btnWriteOk.disabled = true;
 
      if (ok) {
        els.writeFeedback.textContent = "✅ Correcto";
        setTimeout(() => {
          els.writeDialog.close();
          cleanup();
          resolve(true);
        }, 1600);
      } else {
        els.writeFeedback.textContent = `❌ Correcto: ${correctFR}`;
        setTimeout(() => {
          els.writeDialog.close();
          cleanup();
          resolve(false);
        }, 2200);
      }
    };
 
    const onKey = (e) => {
      if (e.key === "Enter") onOk();
    };
 
    function cleanup() {
      els.btnWriteOk.disabled = false;
      els.btnWriteOk.removeEventListener("click", onOk);
      els.writeInput.removeEventListener("keydown", onKey);
    }
 
    els.btnWriteOk.addEventListener("click", onOk);
    els.writeInput.addEventListener("keydown", onKey);
  });
}
 
function showPhaseScreen(imageName) {
  return new Promise((resolve) => {
    if (!els.phaseOverlay || !els.phaseImage || !els.btnContinuePhase) {
      resolve();
      return;
    }

    els.phaseImage.src = "assets/" + getPhaseImageFile(imageName);
    els.phaseImage.style.display = "block";
    if (els.phaseContent) {
      els.phaseContent.style.backgroundImage = "none";
    }

    els.phaseOverlay.style.display = "flex";

    els.btnContinuePhase.onclick = () => {
      els.phaseOverlay.style.display = "none";
      resolve();
    };
  });
}

function goToLanguageScreen() {
  showScreen("start");
}
 
async function showPhaseForLabel(label) {
  const image = PHASE_IMAGE_MAP[label];
  if (!image) return;
  await showPhaseScreen(image);
}
 
function buildPhasePlanFromSelection(totalPairs) {
  const selected = getSelectedPhases();
  const numericLabels = ["1", "2", "3"].filter((x) => selected.includes(x)).map(Number);
  const playFinal = selected.includes("final");
  const labels = numericLabels.length > 0 ? numericLabels : [1];
 
  const N = labels.length;
  const base = Math.floor(totalPairs / N);
  const extra = totalPairs % N;
  const sizes = Array.from({ length: N }, (_, i) => base + (i < extra ? 1 : 0));
 
  return { labels, sizes, playFinal };
}
 
function slicePairsIntoBlocks(pairs, sizes) {
  const blocks = [];
  let start = 0;
  for (const sz of sizes) {
    blocks.push(pairs.slice(start, start + sz));
    start += sz;
  }
  return blocks;
}
 
function setCurrentPhasePairs(pairsForPhase) {
  gameState.currentPhasePairIds = new Set(pairsForPhase.map((p) => p.id));
  resetRoundState(pairsForPhase.length);
  renderBoards(pairsForPhase);
  updateGameMeta();
  updateScoreBoard();
  updateProgressBar();
}
 
async function startPhaseByIndex(index) {
  gameState.currentPhaseIndex = index;
  gameState.round = "normal";
 
  const label = Number(gameState.phaseLabels[index]);
  const pairs = gameState.phaseBlocks[index];
 
  const image = PHASE_IMAGE_MAP[label];
  if (image) {
    await showPhaseScreen(image);
  }
 
  setCurrentPhasePairs(pairs);
  saveGame();
}
 
async function startNextPhaseOrFinalOrEnd() {
  const next = gameState.currentPhaseIndex + 1;
 
  if (next < gameState.phaseBlocks.length) {
    await startPhaseByIndex(next);
    return;
  }
 
  if (gameState.playFinal && gameState.toReinforce.size > 0) {
    await showPhaseScreen(PHASE_IMAGE_MAP["final"]);
    await startFinalRound();
    return;
  }
 
  await finishGame();
}
 
async function startGame() {
  const themes = loadThemes();
  const theme = themes.find((t) => t.id === state.selectedThemeId);
 
if (!theme) {
  await showAppAlert(
    "Tema no encontrado",
    "No se encontró el tema seleccionado. Vuelve atrás y selecciona un tema.",
    "Aceptar"
  );
  showScreen("themes");
  return;
}
 
  gameState.mode = els.gameMode.value;
  gameState.difficulty = els.difficulty.value;
  gameState.accentMode = els.accentMode?.value || "ignore";
  gameState.isFinished = false;
 
  gameState.currentPlayer = 0;
  gameState.scores = gameState.mode === "bataille" ? [0, 0] : [0];
 
  gameState.themePairs = theme.pairs.map((p, idx) => ({
    id: String(idx),
    fr: p.fr,
    es: p.es,
  }));
 
  gameState.mastered = new Set();
  gameState.toReinforce = new Set();
 
  const { labels, sizes, playFinal } = buildPhasePlanFromSelection(gameState.themePairs.length);
  gameState.phaseLabels = labels;
  gameState.phaseBlocks = slicePairsIntoBlocks(gameState.themePairs, sizes);
  gameState.playFinal = playFinal;
 
  els.gameTitle.textContent = theme.name;
  showScreen("game");
 
  await startPhaseByIndex(0);
}
 
function resetRoundState(totalPairs) {
  gameState.locked = false;
  gameState.selectedES = null;
  gameState.selectedFR = null;
  gameState.matchedCount = 0;
  gameState.totalPairs = totalPairs;
  gameState.writeAttempt = null;
}
 
function renderBoards(pairsWithId) {
  els.boardES.innerHTML = "";
  els.boardFR.innerHTML = "";
 
  const itemsES = pairsWithId.map((p) => ({
    lang: "es",
    pairId: p.id,
    text: p.es,
  }));
 
  const itemsFR = pairsWithId.map((p) => ({
    lang: "fr",
    pairId: p.id,
    text: p.fr,
  }));
 
  shuffleArray(itemsES);
  shuffleArray(itemsFR);
 
  for (const item of itemsES) els.boardES.appendChild(createFlipCard(item));
  for (const item of itemsFR) els.boardFR.appendChild(createFlipCard(item));
}
 
function renderBoardsFromSavedOrder(orderES, orderFR) {
  els.boardES.innerHTML = "";
  els.boardFR.innerHTML = "";
 
  for (const item of orderES) {
    els.boardES.appendChild(createFlipCard({
      lang: item.lang,
      pairId: item.pairId,
      text: item.text
    }));
  }
 
  for (const item of orderFR) {
    els.boardFR.appendChild(createFlipCard({
      lang: item.lang,
      pairId: item.pairId,
      text: item.text
    }));
  }
}
 
function createFlipCard(item) {
  const wrapper = document.createElement("div");
  wrapper.className = "card-item";
  wrapper.setAttribute("role", "button");
  wrapper.setAttribute("tabindex", "0");
 
  wrapper.dataset.lang = item.lang;
  wrapper.dataset.pairId = item.pairId;
  wrapper.dataset.matched = "false";
  wrapper.dataset.text = item.text;
 
  const inner = document.createElement("div");
  inner.className = "card-inner";
 
  const back = document.createElement("div");
  back.className = "card-face card-back";

  const backImg = document.createElement("img");
  backImg.className = "card-back-img";
  backImg.src = "assets/card-face.png";
  backImg.alt = "Reverso de carta";

  back.appendChild(backImg);
 
  const front = document.createElement("div");
  front.className = "card-face card-front";
  front.textContent = item.text;
 
  inner.appendChild(back);
  inner.appendChild(front);
  wrapper.appendChild(inner);
 
  async function onPick() {
    if (gameState.locked) return;
    if (wrapper.dataset.matched === "true") return;
    if (wrapper.classList.contains("is-flipped")) return;
 
    const lang = wrapper.dataset.lang;
 
    if (lang === "es" && gameState.selectedES) return;
    if (lang === "fr" && gameState.selectedFR) return;
 
    if (gameState.difficulty === "write" && lang === "es") {
      gameState.writeAttempt = null;
    }
 
    if (
      gameState.difficulty === "write" &&
      lang === "fr" &&
      gameState.selectedES &&
      !gameState.selectedFR
    ) {
      gameState.locked = true;
 
      const esPairId = gameState.selectedES.dataset.pairId;
      const correctFR = gameState.themePairs.find((p) => p.id === esPairId)?.fr || "";
 
      const okWrite = await askWrite(correctFR);
      gameState.writeAttempt = { pairId: esPairId, ok: okWrite };
 
      gameState.locked = false;
    }
 
    playFlipSound();
    wrapper.classList.add("is-flipped");
 
    if (lang === "es") gameState.selectedES = wrapper;
    if (lang === "fr") gameState.selectedFR = wrapper;
 
    if (gameState.selectedES && gameState.selectedFR) {
      checkMatch();
    }
  }
 
  wrapper.addEventListener("click", onPick);
  wrapper.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPick();
    }
  });
 
  return wrapper;
}
 
async function startReinforceRoundForCurrentPhase(reinforcePairs) {
  gameState.round = "reinforce";
 
  resetRoundState(reinforcePairs.length);
  renderBoards(reinforcePairs);
  updateGameMeta();
  updateProgressBar();
 
await showAppAlert(
  "Ronda de refuerzo",
  "Vamos a repasar las palabras que costaron un poco.",
  "Continuar"
);
}
 
async function startFinalRound() {
  gameState.round = "final";
  updateProgressBar();
 
  const pendingIds = Array.from(gameState.toReinforce);
  if (pendingIds.length === 0) {
    await finishGame();
    return;
  }
 
  let selectedIds = pendingIds;
  if (pendingIds.length > FINAL_MAX_PAIRS) {
    selectedIds = sampleArray(pendingIds, FINAL_MAX_PAIRS);
  }
 
  const finalPairs = gameState.themePairs.filter((p) => selectedIds.includes(p.id));
 
  resetRoundState(finalPairs.length);
  renderBoards(finalPairs);
  updateGameMeta();
  updateProgressBar();
 
await showAppAlert(
  "Fase final",
  `¡Vamos a por las más difíciles!\n\nParejas en esta fase: ${finalPairs.length}`,
  "Continuar"
);
 
  saveGame();
}
 
async function checkMatch() {
  gameState.locked = true;
 
  const esCard = gameState.selectedES;
  const frCard = gameState.selectedFR;
 
  const ok = esCard.dataset.pairId === frCard.dataset.pairId;
  const pairId = esCard.dataset.pairId;
 
  const { p1Name, p2Name } = getPlayerNames();
  const currentName =
    gameState.mode === "solo"
      ? p1Name
      : gameState.currentPlayer === 0
      ? p1Name
      : p2Name;
 
  if (ok) {
    esCard.dataset.matched = "true";
    frCard.dataset.matched = "true";
 
    playCoinSound();

    gameState.matchedCount += 1;
 
    if (gameState.mode === "bataille") gameState.scores[gameState.currentPlayer] += 1;
    else gameState.scores[0] += 1;
 
    updateGameMeta();
    updateScoreBoard();
    updateProgressBar();

    let gaveBonus = false;
 
    if (gameState.difficulty === "write") {
      const wa = gameState.writeAttempt;
      gaveBonus = !!(wa && wa.pairId === pairId && wa.ok === true);
 
      if (gaveBonus) {
        if (gameState.mode === "bataille") gameState.scores[gameState.currentPlayer] += 1;
        else gameState.scores[0] += 1;
      }
    } else if (gameState.difficulty === "normal" || gameState.difficulty === "reinforce") {
      const wantsBonus = await askBonus(currentName);
      if (wantsBonus) {
        gaveBonus = true;
        if (gameState.mode === "bataille") gameState.scores[gameState.currentPlayer] += 1;
        else gameState.scores[0] += 1;
      }
    }
 
    if (gaveBonus) {
      gameState.mastered.add(pairId);
      gameState.toReinforce.delete(pairId);
    } else {
      gameState.toReinforce.add(pairId);
      gameState.mastered.delete(pairId);
    }
 
    if (gameState.mode === "equipe") {
      gameState.currentPlayer = gameState.currentPlayer === 0 ? 1 : 0;
    }
 
    gameState.selectedES = null;
    gameState.selectedFR = null;
    gameState.writeAttempt = null;
    gameState.locked = false;
 
updateScoreBoard();
saveGame();

if (gameState.matchedCount === gameState.totalPairs) {
  await wait(2000); // prueba 1200; si quieres más tiempo, usa 1500
  await handleRoundComplete();
}
  } else {
    if (gameState.mode === "bataille" || gameState.mode === "equipe") {
      gameState.currentPlayer = gameState.currentPlayer === 0 ? 1 : 0;
      updateScoreBoard();
    }
 
    setTimeout(() => {
      esCard.classList.remove("is-flipped");
      frCard.classList.remove("is-flipped");
 
      gameState.selectedES = null;
      gameState.selectedFR = null;
      gameState.writeAttempt = null;
      gameState.locked = false;
 
      saveGame();
    }, 3000);
  }
}
 
async function handleRoundComplete() {
  if (gameState.difficulty === "reinforce" && gameState.round === "normal") {
    const idsThisPhase = Array.from(gameState.currentPhasePairIds);
    const reinforceIds = idsThisPhase.filter((id) => gameState.toReinforce.has(id));
 
    if (reinforceIds.length > 0) {
      const reinforcePairs = gameState.themePairs.filter((p) => reinforceIds.includes(p.id));
      await startReinforceRoundForCurrentPhase(reinforcePairs);
      return;
    }
  }
 
  if (gameState.round === "reinforce" || gameState.round === "normal") {
    await startNextPhaseOrFinalOrEnd();
    return;
  }
 
  if (gameState.round === "final") {
    await finishGame();
  }
}
 
async function finishGame() {
  gameState.isFinished = true;
 
  const masteredCount = gameState.mastered.size;
  const pendingCount = gameState.toReinforce.size;
 
  const { p1Name, p2Name } = getPlayerNames();
  const pointsText =
    gameState.mode === "bataille"
      ? `${p1Name} ${gameState.scores[0]} / ${p2Name} ${gameState.scores[1]}`
      : `${gameState.scores[0]}`;
 
  const fillEl = document.getElementById("progressFill");
  const labelsEl = document.getElementById("progressLabels");
 
  if (fillEl) fillEl.style.width = "100%";
  if (labelsEl) {
    const labels = labelsEl.querySelectorAll(".progress-label");
    labels.forEach((label) => label.classList.remove("active"));
    if (labels.length > 0) labels[labels.length - 1].classList.add("active");
  }
 
  clearSavedGame();
 
  const image = PHASE_IMAGE_MAP["victory"];
  if (image) {
    await showPhaseScreen(image);
  }
 
await showAppAlert(
  "Partida terminada",
  `Dominadas: ${masteredCount} - \nPendientes: ${pendingCount}\n - \nPuntos: ${pointsText}`,
  "Aceptar"
);
}
  
function updateGameMeta() {
  const label = gameState.phaseLabels[gameState.currentPhaseIndex] ?? 1;
 
  let roundLabel = "";
  if (gameState.round === "final") roundLabel = " (Fase Final)";
  else if (gameState.difficulty === "reinforce") {
    roundLabel = gameState.round === "reinforce" ? " (Refuerzo)" : " (Normal)";
  }
 
  els.gameMeta.textContent =
    `Fase ${label} — ${gameState.totalPairs} parejas — Aciertos: ${gameState.matchedCount}${roundLabel}`;
}
 
function updateProgressBar() {
  const labelsEl = document.getElementById("progressLabels");
  const fillEl = document.getElementById("progressFill");

  if (!labelsEl || !fillEl) return;

  labelsEl.innerHTML = "";

  const labels = gameState.phaseLabels.map((p) => "F" + p);
  if (gameState.playFinal) labels.push("FINAL");
  labels.push("🏁");

  // Número de tramos reales de progreso
  const totalSegments = labels.length - 1;

  // Índice base del tramo actual
  let currentSegment = gameState.currentPhaseIndex;

  // Si estamos en fase final, el tramo actual es el siguiente a las fases normales
  if (gameState.round === "final") {
    currentSegment = gameState.phaseLabels.length;
  }

  // Progreso dentro de la fase actual según parejas acertadas
  let inPhaseProgress = 0;
  if (gameState.totalPairs > 0) {
    inPhaseProgress = gameState.matchedCount / gameState.totalPairs;
  }

  // Si ya terminó la partida, finishGame() la pondrá al 100%
  const progress = Math.min(1, (currentSegment + inPhaseProgress) / totalSegments);
  fillEl.style.width = (progress * 100) + "%";

  labels.forEach((lab, i) => {
    const span = document.createElement("span");
    span.textContent = lab;
    span.className = "progress-label";

    if (i < currentSegment) {
      span.classList.add("done");
    } else if (i === currentSegment) {
      span.classList.add("active");
    }

    labelsEl.appendChild(span);
  });

}
 
function getMatchedPairIdsFromBoard() {
  return Array.from(document.querySelectorAll('.card-item[data-matched="true"]'))
    .map((el) => el.dataset.pairId)
    .filter((v, i, a) => a.indexOf(v) === i);
  }
 
function saveGame() {
  if (gameState.isFinished) return;

  const orderES = Array.from(els.boardES.children).map((card) => ({
    pairId: card.dataset.pairId,
    text: card.dataset.text,
    lang: card.dataset.lang,
    matched: card.dataset.matched === "true",
  }));

  const orderFR = Array.from(els.boardFR.children).map((card) => ({
    pairId: card.dataset.pairId,
    text: card.dataset.text,
    lang: card.dataset.lang,
    matched: card.dataset.matched === "true",
  }));

  const snapshot = {
    v: 1,
    ts: Date.now(),
    selectedThemeId: state.selectedThemeId,
  
    mode: gameState.mode,
    difficulty: gameState.difficulty,
    accentMode: gameState.accentMode,
    playFinal: gameState.playFinal,
  
    round: gameState.round,
    currentPlayer: gameState.currentPlayer,
    scores: gameState.scores,

    playerNames: getPlayerNames(),

    phaseLabels: gameState.phaseLabels,
    currentPhaseIndex: gameState.currentPhaseIndex,
    phaseBlocksIds: gameState.phaseBlocks.map((block) => block.map((p) => p.id)),
  
    mastered: Array.from(gameState.mastered),
    toReinforce: Array.from(gameState.toReinforce),

    matchedThisPhase: getMatchedPairIdsFromBoard(),
  
    finalRoundIds:
      gameState.round === "final"
        ? Array.from(gameState.currentPhasePairIds)
        : null,

    orderES,
    orderFR,
  };

  localStorage.setItem(getSaveStorageKey(), JSON.stringify(snapshot));
  updateResumeButtons();
}

function loadSavedGame() {
  try {
    const raw = localStorage.getItem(getSaveStorageKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}
 
function clearSavedGame() {
  localStorage.removeItem(getSaveStorageKey());
  updateResumeButtons();
}
 
function updateResumeButtons() {
  const hasSave = !!loadSavedGame();

  if (els.btnAddTheme) els.btnAddTheme.style.display = "inline-block";
  if (els.btnResumeGame) els.btnResumeGame.style.display = hasSave ? "inline-block" : "none";
  if (els.btnDeleteSave) els.btnDeleteSave.style.display = hasSave ? "inline-block" : "none";
}

function updateThemeDialogTexts() {
  const isFR = state.currentLanguage === "fr";

  const title = els.dialog.querySelector(".dialog-title");
  const labelSpans = els.dialog.querySelectorAll("label.field > span");
  const note = els.dialog.querySelector(".muted.small");

  if (title) {
    title.textContent = isFR
      ? "Nuevo tema / Nouveau thème"
      : "Nuevo tema / New theme";
  }

  if (labelSpans[0]) {
    labelSpans[0].textContent = isFR
      ? "Nombre del tema / Nom du thème"
      : "Nombre del tema / Theme name";
  }

  if (labelSpans[1]) {
    labelSpans[1].textContent = isFR
      ? "Vocabulario FR - ES — una línea por pareja / une ligne par paire"
      : "Vocabulario EN - ES — una línea por pareja / one line per pair";
  }

  if (note) {
    note.textContent = isFR
      ? "Nota / Remarque : los temas se guardarán SOLO en este dispositivo (local)."
      : "Nota / Note: los temas se guardarán SOLO en este dispositivo (local).";
  }

  if (els.themeName) {
    els.themeName.placeholder = isFR ? "Ej. Les fruits" : "E.g. Food";
  }

  if (els.themePairs) {
    els.themePairs.placeholder = isFR
      ? "la pomme - manzana\nle lait - leche"
      : "apple - manzana\nmilk - leche";
  }
}function markMatched(pairIds) {
  const unique = new Set(pairIds);
  const cards = document.querySelectorAll(".card-item");
  cards.forEach((card) => {
    if (unique.has(card.dataset.pairId)) {
      card.dataset.matched = "true";
      card.classList.add("is-flipped");
    }
  });
}
 
async function resumeSavedGame() {
  const snapshot = loadSavedGame();
  if (!snapshot) return;
 
  const themes = loadThemes();
  const theme = themes.find((t) => t.id === snapshot.selectedThemeId);
  if (!theme) {
    clearSavedGame();
    return;
  }
 
  state.selectedThemeId = theme.id;
 
  gameState.mode = snapshot.mode;
  gameState.difficulty = snapshot.difficulty;
  gameState.accentMode = snapshot.accentMode;
  gameState.playFinal = snapshot.playFinal;
 
  gameState.currentPlayer = snapshot.currentPlayer;
  gameState.scores = snapshot.scores || [0];
  gameState.isFinished = false;
 
  gameState.themePairs = theme.pairs.map((p, idx) => ({
    id: String(idx),
    fr: p.fr,
    es: p.es,
  }));
 
  gameState.phaseLabels = snapshot.phaseLabels || [1];
  gameState.currentPhaseIndex = snapshot.currentPhaseIndex || 0;
  gameState.phaseBlocks = (snapshot.phaseBlocksIds || []).map((blockIds) =>
    blockIds.map((id) => gameState.themePairs.find((p) => p.id === id)).filter(Boolean)
  );
 
  gameState.mastered = new Set(snapshot.mastered || []);
  gameState.toReinforce = new Set(snapshot.toReinforce || []);
  gameState.round = snapshot.round || "normal";
 
  els.gameTitle.textContent = theme.name;
  showScreen("game");
 
  let currentPairs = [];
  if (gameState.round === "final") {
    const finalIds = snapshot.finalRoundIds || Array.from(gameState.toReinforce).slice(0,   FINAL_MAX_PAIRS);
    currentPairs = gameState.themePairs.filter((p) => finalIds.includes(p.id));
  } else {
    currentPairs = gameState.phaseBlocks[gameState.currentPhaseIndex] || [];
  }
 
  gameState.currentPhasePairIds = new Set(currentPairs.map((p) => p.id));
  resetRoundState(currentPairs.length);
 
  if (snapshot.orderES && snapshot.orderFR) {
    renderBoardsFromSavedOrder(snapshot.orderES, snapshot.orderFR);
  } else {
    renderBoards(currentPairs);
  }
 

  if (snapshot.playerNames) {
    els.p1.value = snapshot.playerNames.p1Name || "Jugador 1";
    els.p2.value = snapshot.playerNames.p2Name || "Jugador 2";
  }

  const matchedIds = snapshot.matchedThisPhase || [];
  markMatched(matchedIds);
  gameState.matchedCount = matchedIds.length;
 
  updateGameMeta();
  updateScoreBoard();
  updateProgressBar();

}
 
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
 
function sampleArray(arr, n) {
  const copy = [...arr];
  shuffleArray(copy);
  return copy.slice(0, n);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

if (els.btnAddTheme) {
  els.btnAddTheme.addEventListener("click", () => {
    playUISound();
    updateThemeDialogTexts();
    openDialog();
  });
}
els.btnCancel.addEventListener("click", closeDialog);
 
if (els.btnResumeGame) {
  els.btnResumeGame.addEventListener("click", () => {
    playUISound();
    resumeSavedGame();
  });
}
 
if (els.btnDeleteSave) {
  els.btnDeleteSave.addEventListener("click", async () => {
    playUISound();
    const ok = await showAppConfirm(
      "Borrar partida",
      "¿Quieres borrar la partida guardada?",
      "Borrar",
      "Cancelar"
    );
    if (ok) clearSavedGame();
  });
}
 
els.dialog.addEventListener("click", (e) => {
  const rect = els.dialog.getBoundingClientRect();
  const inDialog =
    rect.top <= e.clientY && e.clientY <= rect.bottom &&
    rect.left <= e.clientX && e.clientX <= rect.right;
  if (!inDialog) closeDialog();
});
 
els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  playUISound();

  const name = els.themeName.value.trim();
  const pairsText = els.themePairs.value.trim();
  const pairs = parsePairs(pairsText);

  if (!name) {
    await showAppAlert(
      "Falta información",
      "Escribe un nombre para el tema."
    );
    return;
  }

  if (pairs.length === 0) {
    await showAppAlert(
      "Tema incompleto",
      "Añade al menos una pareja: francés - español."
    );
    return;
  }

  const themes = loadThemes();
  themes.push(createTheme({ name, pairs }));
  saveThemes(themes);

  closeDialog();
  renderThemes(themes);
}); 

els.btnBack.addEventListener("click", () => {
  playUISound();
  showScreen("themes");
});
els.gameMode.addEventListener("change", updatePlayerFields);
els.difficulty.addEventListener("change", updateAccentField);
 
els.btnStart.addEventListener("click", () => {
  unlockAudio();
  playUISound();
  startGame();
});
 
els.btnExitGame.addEventListener("click", () => {
  playUISound();
  saveGame();
  showScreen("themes");
});
 
els.btnBonusYes.addEventListener("click", () => {
  playUISound();
  closeBonus(true);
});
els.btnBonusNo.addEventListener("click", () => {
  playUISound();
  closeBonus(false);
});
 

// ============================
// Tutorial bubble Vocabulapp
// ============================

let tutorialStep = 0;
let tutorialClosed = false;
let tutorialDelayTimer = null;

function getTutorialBubbleEls() {
  return {
    bubble: document.getElementById("tutorialBubble"),
    bubbleText: document.getElementById("tutorialBubbleText"),
    bubbleNext: document.getElementById("tutorialBubbleNext"),
  };
}

function getTutorialMessages() {
  const firstLanguage = state.currentLanguage === "en" ? "inglés" : "francés";

  return [
 "¡Bienvenido!\nPrimero necesitas crear un tema de vocabulario.\nPulsa 'Añadir tema' para crear tu primera lista de palabras.",

    `Escribe las palabras así:\n ${firstLanguage} – español \n(una pareja por línea).\nPuedes añadir emojis y también poner un nombre al tema.`,

    "Si dejas una partida a \nmedias, podrás continuarla \nmás tarde o borrarla \nsi quieres empezar de nuevo.",

   "Si hay más de 9 \nparejas, por fase, podrás \ndeslizar hacia abajo \npara verlas todas. \nLas parejas se dividen entre las fases.",

    "Cuando crees tu tema,\npodrás empezar a jugar.\nPincha en el tema y configura el tipo de partida que quieras.\n¿Te atreves?"
  ];
}

function hideTutorialBubble() {
  const { bubble } = getTutorialBubbleEls();
  if (!bubble) return;
  bubble.style.display = "none";
  bubble.classList.remove("is-visible");
}

function updateTutorialBubbleVisibility() {
  const { bubble, bubbleText } = getTutorialBubbleEls();
  if (!bubble) return;

  const tutorialMessages = getTutorialMessages();
  const themes = loadThemes();
  const hasThemes = Array.isArray(themes) && themes.length > 0;

  if (tutorialDelayTimer) {
    clearTimeout(tutorialDelayTimer);
    tutorialDelayTimer = null;
  }

  bubble.classList.remove("is-visible");

  if (tutorialClosed || hasThemes) {
    bubble.style.display = "none";
    return;
  }

  bubble.style.display = "none";
  tutorialStep = 0;

  if (bubbleText) {
    bubbleText.textContent = tutorialMessages[0];
  }

  tutorialDelayTimer = setTimeout(() => {
    bubble.style.display = "block";
    bubble.classList.remove("is-visible");
    void bubble.offsetWidth;
    bubble.classList.add("is-visible");
    playUISound();
  }, 1500);
}

function bindTutorialBubble() {
  const { bubble, bubbleText, bubbleNext } = getTutorialBubbleEls();
  if (!bubble || !bubbleText || !bubbleNext || bubbleNext.dataset.bound === "true") {
    return;
  }

  bubbleNext.dataset.bound = "true";
  bubbleNext.addEventListener("click", () => {
    const tutorialMessages = getTutorialMessages();
    tutorialStep += 1;

    if (tutorialStep >= tutorialMessages.length) {
      tutorialClosed = true;
      hideTutorialBubble();
      return;
    }

    bubbleText.textContent = tutorialMessages[tutorialStep];
  });
}

(function init() {
  updateAccentField();
  bindTutorialBubble();
  preloadImages();

  document.addEventListener("click", () => {
    unlockAudio();
syncMusicToScreen(getCurrentScreenName());
  }, { once: true });

  // Conectar botones de idioma
  if (els.btnLangFR) {
    els.btnLangFR.addEventListener("click", async () => {
      unlockAudio();
      playUISound();
      await selectLanguage("fr");
    });
  }

  if (els.btnLangEN) {
    els.btnLangEN.addEventListener("click", async () => {
      unlockAudio();
      playUISound();
      await selectLanguage("en");
    });
  }

  if (els.btnChangeLanguage) {
    els.btnChangeLanguage.addEventListener("click", () => {
      playUISound();
      showScreen("start");
    });
  }

 if (els.btnAudioToggle) {
   els.btnAudioToggle.onclick = (e) => {
     e.preventDefault();
     e.stopPropagation();
     toggleAudio();
  };
}

updateAudioButtonUI();
  // Renderizar datos si existe idioma previo
  if (state.currentLanguage) {
    renderThemes(loadThemes());
    updateResumeButtons();
    updateTutorialBubbleVisibility();
  }

  // SIEMPRE arrancar en pantalla inicial
  showScreen("start");
})();

/* ===== Guardado de seguridad al cerrar / recargar ===== */
window.addEventListener("pagehide", () => {
  if (!gameState.isFinished && state.selectedThemeId) {
    saveGame();
  }
});

window.addEventListener("beforeunload", () => {
  if (!gameState.isFinished && state.selectedThemeId) {
    saveGame();
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => console.log('Service Worker registrado'))
      .catch(err => console.log('Error Service Worker', err));
  });
}