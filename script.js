// element references
const date = document.getElementById("date");
const playBtn = document.getElementById("playBtn");
const guessBtn = document.getElementById("guessBtn");
const guess = document.getElementById("guess");
const msg = document.getElementById("msg");
const wins = document.getElementById("wins");
const avgScore = document.getElementById("avgScore");
const giveUp = document.getElementById("giveUp");
const levelArr = document.getElementsByName("level");
const lb = document.getElementsByName("leaderboard");
const playerName = document.getElementById("playerName");
const saveName = document.getElementById("saveName");
const welcome = document.getElementById("welcome");

// globals
let score, answer, level;
let scoreArr = [];
let roundTimeArr = [];
let name;
let startTime;
let streak = 0;
let bestScores = {}; // keyed by level
const STORAGE_KEY = "gg_state_v1";

// ---- Initialize date/time ----
updateDate();
setInterval(updateDate, 1000);
avgScore.textContent = "Average Score: N/A";

// create extra UI controls (hint button, streak/best displays)
createExtraControls();

// load persisted state (if any)
loadState();

// ---- Event listeners ----
saveName.addEventListener("click", savePlayerName);
playBtn.addEventListener("click", play);
guessBtn.addEventListener("click", makeGuess);
giveUp.addEventListener("click", giveUpGame);

function savePlayerName() {
  name = playerName.value.trim();
  if (name === "") {
    msg.textContent = "Please enter a valid name!";
    return;
  }
  name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  welcome.textContent = `Welcome, ` + name;
  playBtn.disabled = false;
  msg.textContent = name + `, select a level and click Play!`;
  // disable name input after saving so it doesn't remain editable
  playerName.disabled = true;
  saveName.disabled = true;
  saveState();
}

// ---- Date + time functions ----
function updateDate() {
  const d = new Date();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const suffix = getSuffix(day);
  const year = d.getFullYear();
  const timeStr = d.toLocaleTimeString();
  date.textContent = month + " " + day + suffix + ", " + year + " - " + timeStr;
}

function getSuffix(day) {
  if (day % 10 === 1 && day !== 11) return "st";
  if (day % 10 === 2 && day !== 12) return "nd";
  if (day % 10 === 3 && day !== 13) return "rd";
  return "th";
}

// ---- Game logic ----
function play() {
  playBtn.disabled = true;
  guessBtn.disabled = false;
  guess.disabled = false;
  giveUp.disabled = false;

  for (let i = 0; i < levelArr.length; i++) {
    levelArr[i].disabled = true;
    if (levelArr[i].checked) level = levelArr[i].value;
  }

  answer = Math.floor(Math.random() * level) + 1;
  msg.textContent = name + `, guess a number between 1 and ` + level;
  score = 0;
  startTime = new Date().getTime();
  // update UI
  updateExtraUI();
}

function makeGuess() {
  const userGuess = parseInt(guess.value);
  if (isNaN(userGuess) || userGuess < 1 || userGuess > level) {
    msg.textContent = "INVALID!";
    return;
  }

  score++;
  const diff = Math.abs(userGuess - answer);

  // feedback based on proximity
  let feedback;
  if (diff <= level / 10) feedback = "Hot!";
  else if (diff <= level / 5) feedback = "Warm!";
  else feedback = "Cold!";

  // play a tone depending on proximity
  playFeedbackTone(feedback);

  if (userGuess < answer) {
    msg.textContent = name + ", your guess is too low (" + feedback + "). Guess again! (Try #" + score + ")"
  } else if (userGuess > answer) {
    msg.textContent = name + ", your guess is too high (" + feedback + "). Guess again! (Try #" + score + ")"
  } else {
    const endTime = new Date().getTime();
    const roundTime = (endTime - startTime) / 1000;
    roundTimeArr.push(roundTime);
    msg.textContent = "CORRECT!!! It took " + score + " tries and " + roundTime + " s.";
    // win handling: streak, best scores, confetti, victory sound
    streak = (streak || 0) + 1;
    const lvlKey = String(level);
    if (!bestScores[lvlKey] || score < bestScores[lvlKey]) bestScores[lvlKey] = score;
    showConfetti();
    playVictoryJingle();
    reset();
    updateScore();
    saveState();
  }
}

function giveUpGame() {
  const endTime = new Date().getTime();
  const roundTime = (endTime - startTime) / 1000;
  roundTimeArr.push(roundTime);
  msg.textContent = name + ', you gave up! The answer was ' + answer;
  score = parseInt(level); // set score to max range
  // giving up resets streak
  streak = 0;
  reset();
  updateScore();
  saveState();
}

function reset() {
  guessBtn.disabled = true;
  guess.value = "";
  guess.disabled = true;
  playBtn.disabled = false;
  giveUp.disabled = true;
  for (let i = 0; i < levelArr.length; i++) levelArr[i].disabled = false;
}

function updateScore() {
  // Only add a score if it's a valid number (prevents NaN when updateScore
  // is called during loadState or at startup).
  if (typeof score === 'number' && !isNaN(score)) {
    scoreArr.push(score);
  }
  scoreArr.sort((a, b) => a - b);

  let sum = 0;
  for (let i = 0; i < scoreArr.length; i++) {
    sum += scoreArr[i];
    if (i < lb.length) lb[i].textContent = scoreArr[i];
  }

  wins.textContent = "Total wins: " + scoreArr.length;
  if (scoreArr.length === 0) {
    avgScore.textContent = "Average Score: N/A";
  } else {
    const avg = sum / scoreArr.length;
    avgScore.textContent = "Average Score: " + avg.toFixed(2);
  }

  // Score feedback
  let feedback;
  if (score <= 3) feedback = "Great!";
  else if (score <= 6) feedback = "Good!";
  else if (score <= 10) feedback = "Ok!";
  else feedback = "Bad!";

  msg.textContent += ` (${feedback})`;

  // Average and fastest times
  if (!Array.isArray(roundTimeArr) || roundTimeArr.length === 0) {
    avgScore.textContent += ", Avg Time: N/A, Fastest: N/A";
  } else {
    const totalTime = roundTimeArr.reduce((a, b) => a + b, 0);
    const avgTime = (totalTime / roundTimeArr.length).toFixed(2);
    const fastest = Math.min(...roundTimeArr).toFixed(2);
    avgScore.textContent += ", Avg Time: " + avgTime + ", Fastest: " + fastest;
  }
}

// ------------------ Extra features: persistence, hints, audio, confetti ------------------

function saveState() {
  // Persistence disabled per user request: do not store any state across reloads.
  // Keep this function as a no-op so other code can continue to call it.
  return;
}

function loadState() {
  // Per user request: reset everything on load/reload. Remove any existing
  // stored state and keep in-memory arrays empty so leaderboard/stats start
  // fresh each page load.
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignore localStorage errors
  }
  scoreArr = [];
  roundTimeArr = [];
  streak = 0;
  bestScores = {};
  updateScore();
  updateExtraUI();
}

// Create hint button and displays for streak & best score
function createExtraControls() {
  // streak display
  const streakSpan = document.createElement('div');
  streakSpan.id = 'streakSpan';
  streakSpan.style.marginTop = '6px';
  streakSpan.style.fontWeight = '600';
  streakSpan.textContent = 'Streak: 0';
  welcome.parentNode.insertBefore(streakSpan, welcome.nextSibling);

  // best score display
  const bestSpan = document.createElement('div');
  bestSpan.id = 'bestSpan';
  bestSpan.style.marginTop = '4px';
  bestSpan.textContent = 'Best (per level): N/A';
  welcome.parentNode.insertBefore(bestSpan, streakSpan.nextSibling);

  // hint button
  const hintBtn = document.createElement('button');
  hintBtn.id = 'hintBtn';
  hintBtn.textContent = 'Hint';
  hintBtn.style.marginLeft = '8px';
  hintBtn.disabled = true; // only enabled during play
  playBtn.parentNode.insertBefore(hintBtn, playBtn.nextSibling);
  hintBtn.addEventListener('click', giveHint);

  // enable Enter key to submit guess
  guess.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !guessBtn.disabled) makeGuess();
  });
}

function updateExtraUI() {
  const streakEl = document.getElementById('streakSpan');
  const bestEl = document.getElementById('bestSpan');
  const hintBtn = document.getElementById('hintBtn');
  if (streakEl) streakEl.textContent = 'Streak: ' + (streak || 0);
  if (bestEl) {
    const entries = Object.keys(bestScores).sort((a,b)=>+a-+b).map(k => `${k}: ${bestScores[k]}`);
    bestEl.textContent = 'Best (per level): ' + (entries.length ? entries.join(' | ') : 'N/A');
  }
  if (hintBtn) {
    // Only enable hint button during active game (playBtn is disabled while playing)
    const gameActive = playBtn.disabled && !guessBtn.disabled && !guess.disabled;
    hintBtn.disabled = !gameActive;
  }
}

function giveHint() {
  if (!answer) return;
  const userGuess = parseInt(guess.value);
  if (isNaN(userGuess)) {
    msg.textContent = (name ? name + ', ' : '') + 'enter a guess first for a hint!';
    return;
  }
  const diff = Math.abs(userGuess - answer);
  const rel = diff / level;
  if (rel === 0) {
    msg.textContent = 'You already guessed it!';
    return;
  }
  // give a directional + proximity hint without revealing answer
  let proximity;
  if (rel <= 0.05) proximity = 'Very close';
  else if (rel <= 0.15) proximity = 'Close';
  else if (rel <= 0.35) proximity = 'Somewhat close';
  else proximity = 'Not close';
  const dir = userGuess < answer ? 'higher' : 'lower';
  // parity hint (even/odd)
  const parity = (answer % 2 === 0) ? 'even' : 'odd';
  msg.textContent = name + ", here's your hint: The number is " + parity + ".";
  // small beep to indicate hint
  playFeedbackTone('Warm!');
}

// simple Web Audio feedback tones
const audioCtx = (typeof window !== 'undefined' && window.AudioContext) ? new AudioContext() : null;
function playFeedbackTone(feedback) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g);
  g.connect(audioCtx.destination);
  if (feedback === 'Hot!') o.frequency.value = 1000;
  else if (feedback === 'Warm!') o.frequency.value = 600;
  else o.frequency.value = 300;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
  o.start(now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  o.stop(now + 0.13);
}

function playVictoryJingle() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const freqs = [880, 1047, 1319];
  freqs.forEach((f, i) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.frequency.value = f;
    const t = now + i * 0.12;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    o.start(t); o.stop(t + 0.13);
  });
}

// light confetti animation using divs
function showConfetti() {
  const count = 28;
  const colors = ['#f94144','#f3722c','#f9844a','#f9c74f','#90be6d','#43aa8b','#577590'];
  const frag = document.createDocumentFragment();
  const container = document.createElement('div');
  container.style.pointerEvents = 'none';
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '100%';
  container.style.height = '0';
  container.style.overflow = 'visible';
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const size = Math.floor(Math.random()*10) + 6;
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.background = colors[Math.floor(Math.random()*colors.length)];
    el.style.position = 'absolute';
    el.style.left = (Math.random()*90 + 5) + '%';
    el.style.top = '10px';
    el.style.opacity = '0.95';
    el.style.borderRadius = '2px';
    el.style.transform = `translateY(0) rotate(${Math.random()*360}deg)`;
    el.style.transition = `transform 1.6s cubic-bezier(.2,.8,.2,1), opacity 1.6s`;
    container.appendChild(el);
    // stagger start
    setTimeout(() => {
      const dx = (Math.random()*160 - 80);
      const dy = 600 + Math.random()*180;
      el.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.random()*720}deg)`;
      el.style.opacity = '0';
    }, Math.random()*200);
  }
  // cleanup
  setTimeout(() => { document.body.removeChild(container); }, 2200);
}

