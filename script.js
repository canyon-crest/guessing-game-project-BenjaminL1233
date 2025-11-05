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

// ---- Initialize date/time ----
updateDate();
setInterval(updateDate, 1000);
avgScore.textContent = "Average Score: N/A";

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
  if (diff >= level / 2) feedback = "Cold!";
  else if (diff >= level / 4) feedback = "Warm!";
  else feedback = "Hot!";

  if (userGuess < answer) {
    msg.textContent = `${name}, too low (${feedback}). Guess again! (Try #${score})`;
  } else if (userGuess > answer) {
    msg.textContent = `${name}, too high (${feedback}). Guess again! (Try #${score})`;
  } else {
    const endTime = new Date().getTime();
    const roundTime = (endTime - startTime) / 1000;
    roundTimeArr.push(roundTime);
    msg.textContent = "CORRECT!!! It took " + score + " tries and " + roundTime + " s.";
    reset();
    updateScore();
  }
}

function giveUpGame() {
  const endTime = new Date().getTime();
  const roundTime = (endTime - startTime) / 1000;
  roundTimeArr.push(roundTime);
  msg.textContent = name + ', you gave up! The answer was ' + answer;
  score = parseInt(level); // set score to max range
  reset();
  updateScore();
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
  scoreArr.push(score);
  scoreArr.sort((a, b) => a - b);

  let sum = 0;
  for (let i = 0; i < scoreArr.length; i++) {
    sum += scoreArr[i];
    if (i < lb.length) lb[i].textContent = scoreArr[i];
  }

  const avg = sum / scoreArr.length;
  wins.textContent = "Total wins: " + scoreArr.length;
  avgScore.textContent = "Average Score: " + avg.toFixed(2);

  // Score feedback
  let feedback;
  if (score <= 3) feedback = "Great!";
  else if (score <= 6) feedback = "Good!";
  else if (score <= 10) feedback = "Ok!";
  else feedback = "Bad!";

  msg.textContent += ` (${feedback})`;

  // Average and fastest times
  const totalTime = roundTimeArr.reduce((a, b) => a + b, 0);
  const avgTime = (totalTime / roundTimeArr.length).toFixed(2);
  const fastest = Math.min(...roundTimeArr).toFixed(2);
  avgScore.textContent += ` | Avg Time: ${avgTime}s | Fastest: ${fastest}s`;
}
