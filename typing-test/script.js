const sentences = [
  "The morning sun cast long shadows across the quiet village street.",
  "She picked up the old book and began reading from the first page.",
  "A strong wind blew through the open window, scattering papers everywhere.",
  "He walked quickly down the path, hoping to arrive before dark.",
  "The children played happily in the garden until it started raining.",
  "Every winter, the mountain peaks are covered in a blanket of snow.",
  "The cat sat on the warm ledge and watched the birds outside.",
  "After many years of hard work, she finally opened her own bakery.",
  "The river flows gently through the valley toward the distant ocean.",
  "He could not believe how much the city had changed since his last visit.",
  "They decided to take the longer route because the scenery was beautiful.",
  "The teacher asked the class to write a short story about their summer.",
  "A small boat drifted slowly across the calm surface of the lake.",
  "She smiled when she saw the letter waiting on the kitchen table.",
  "The old clock on the wall ticked loudly in the silent room.",
  "Running every morning helps clear the mind and build energy for the day.",
  "The dog barked twice and then lay down beside the front door.",
  "He spent the entire afternoon trying to fix the broken engine.",
  "Fresh bread from the local bakery is one of life's simple pleasures.",
  "The stars were bright enough to light the path through the forest.",
  "She always carried a notebook in case an idea came to her suddenly.",
  "The train arrived exactly on time, much to everyone's surprise.",
  "A good book can transport you to places you have never been before.",
  "The garden was full of colour; roses, tulips, and sunflowers bloomed together.",
  "He found an old map hidden inside the cover of a dusty journal.",
  "The sound of thunder echoed across the dark sky for several minutes.",
  "They built a small wooden bridge over the stream behind the house.",
  "Learning a new language takes patience, practice, and a lot of courage.",
  "The market was crowded with people looking for fresh fruit and vegetables.",
  "She watched the sunset from the top of the hill, feeling perfectly calm.",
  "The factory produced thousands of parts each day without stopping.",
  "He opened the door carefully, not sure what he would find inside.",
  "Music has the power to change your mood in just a few seconds.",
  "The snow melted quickly once the warm spring weather finally arrived.",
  "They packed their bags the night before so they could leave early.",
  "The lighthouse stood alone on the rocky cliff, guiding ships through the fog.",
  "She took a deep breath and stepped onto the stage for the first time.",
  "The museum had an incredible collection of paintings from around the world.",
  "He promised to call as soon as he arrived at the airport safely.",
  "The field was covered in wildflowers that swayed gently in the breeze.",
  "Nobody expected the final exam to be so difficult; many students struggled.",
  "The bus was late again, so she decided to walk the rest of the way.",
  "A cup of hot coffee on a cold morning is hard to beat.",
  "The bridge connected the two sides of the city across the wide river.",
  "He read the instructions twice before attempting to assemble the furniture.",
  "The forest was quiet except for the occasional sound of a bird singing.",
  "She painted the walls a bright shade of blue to match the curtains.",
  "The team worked together to finish the project before the Friday deadline.",
  "An old friend called out of nowhere, and they talked for over an hour.",
  "The road stretched endlessly into the distance under a cloudless sky.",
  "He carefully placed the fragile vase on the top shelf of the cabinet.",
  "The waves crashed against the rocks, sending spray high into the air.",
  "She ordered a large pizza with extra cheese and fresh mushrooms.",
  "The library was the quietest place in town, perfect for studying.",
  "He noticed a strange pattern in the data that no one had seen before.",
  "The plane took off smoothly despite the strong crosswind at the runway.",
  "She left her umbrella at home and got caught in the afternoon rain.",
  "The new software update fixed several bugs and improved overall performance.",
  "He sat by the fire, reading a mystery novel late into the night.",
  "The park was full of families enjoying the warm Saturday afternoon.",
  "She typed the email quickly, checked it once, and pressed send.",
  "The clock struck midnight, and the entire house fell completely silent.",
  "He drove through the countryside, admiring the green hills and open fields.",
  "The recipe called for three eggs, a cup of flour, and some butter.",
  "She found it difficult to concentrate with so much noise outside.",
  "The company announced plans to expand into several new markets next year.",
  "He carefully measured each piece of wood before making a single cut.",
  "The sunset painted the sky in shades of orange, pink, and gold.",
  "She volunteered at the local shelter every weekend without fail.",
  "The test results came back positive, and everyone felt a wave of relief.",
  "He forgot his keys inside the car and had to call for help.",
  "The restaurant on the corner serves the best pasta in the neighbourhood.",
  "She kept a journal where she recorded her thoughts at the end of each day.",
  "The wind picked up speed, and dark clouds gathered on the horizon.",
  "He finished the marathon in under four hours, beating his personal record.",
  "The birds returned to the garden as soon as the feeder was filled.",
  "She handed in her report early, well ahead of the official deadline.",
  "The conference room was booked solid for the entire week.",
  "He always double-checked his work before submitting it to the manager.",
  "The heavy rain caused flooding in several low-lying areas of the town.",
  "She grabbed her coat and headed out into the chilly evening air.",
  "The project required input from designers, engineers, and marketing staff.",
  "He studied the map closely, trying to find the shortest route north.",
  "The café on the high street makes excellent sandwiches and fresh juice.",
  "She arranged the flowers neatly in a glass vase on the dining table.",
  "The temperature dropped sharply overnight, and frost covered the ground.",
  "He listened carefully to the instructions and followed them step by step.",
  "The new bridge will reduce travel time between the two towns significantly.",
  "She practised the piano every evening, slowly improving each week.",
  "The match ended in a draw after a tense final ten minutes.",
  "He walked along the beach, collecting shells and smooth stones.",
  "The power went out during the storm, leaving the street in total darkness.",
  "She wrote a letter to her grandmother and posted it the next morning.",
  "The city centre was decorated with lights and banners for the festival.",
  "He offered to help carry the heavy boxes up the narrow staircase.",
  "The documentary explored the history of space travel from its earliest days.",
  "She set her alarm for six o'clock so she could catch the early train.",
  "The children built a tall sandcastle near the edge of the water.",
  "He repaired the fence over the weekend using spare timber from the shed.",
  "The meeting was rescheduled to Thursday afternoon at short notice.",
];

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generatePassage() {
  const shuffled = shuffleArray(sentences);
  let passage = "";
  for (const sentence of shuffled) {
    const next = passage ? passage + " " + sentence : sentence;
    if (next.split(" ").length > 200) break;
    passage = next;
  }
  return passage;
}

const textDisplay = document.getElementById("text-display");
const inputField = document.getElementById("input-field");
const timerEl = document.getElementById("timer");
const wpmEl = document.getElementById("wpm");
const accuracyEl = document.getElementById("accuracy");
const retryBtn = document.getElementById("retry-btn");
const resultsDiv = document.getElementById("results");
const finalWpm = document.getElementById("final-wpm");
const finalAccuracy = document.getElementById("final-accuracy");
const finalChars = document.getElementById("final-chars");
const finalCorrect = document.getElementById("final-correct");

let passage = "";
let timerInterval = null;
let timeLeft = 60;
let started = false;
let totalCharsTyped = 0;
let correctChars = 0;

function renderText(typedLength) {
  let html = "";
  for (let i = 0; i < passage.length; i++) {
    let cls = "pending";
    if (i < typedLength) {
      cls = inputField.value[i] === passage[i] ? "correct" : "incorrect";
    } else if (i === typedLength) {
      cls = "current";
    }
    const ch = passage[i] === " " ? "&nbsp;" : escapeHtml(passage[i]);
    html += `<span class="char ${cls}">${ch}</span>`;
  }
  textDisplay.innerHTML = html;
}

function escapeHtml(ch) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return map[ch] || ch;
}

function startTimer() {
  started = true;
  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    updateLiveStats();
    if (timeLeft <= 0) {
      endTest();
    }
  }, 1000);
}

function updateLiveStats() {
  const elapsed = 60 - timeLeft;
  if (elapsed > 0) {
    // Count correct words: split typed text into words, compare with passage words
    const typedText = inputField.value;
    const wpm = Math.round((correctChars / 5) / (elapsed / 60));
    wpmEl.textContent = wpm;
  }
  if (totalCharsTyped > 0) {
    const acc = Math.round((correctChars / totalCharsTyped) * 100);
    accuracyEl.textContent = acc + "%";
  }
}

function endTest() {
  clearInterval(timerInterval);
  timerEl.textContent = "0";
  inputField.disabled = true;
  retryBtn.style.display = "block";

  const elapsed = 60;
  const wpm = Math.round((correctChars / 5) / (elapsed / 60));
  const acc = totalCharsTyped > 0 ? Math.round((correctChars / totalCharsTyped) * 100) : 0;

  wpmEl.textContent = wpm;
  accuracyEl.textContent = acc + "%";

  finalWpm.textContent = wpm;
  finalAccuracy.textContent = acc + "%";
  finalChars.textContent = totalCharsTyped;
  finalCorrect.textContent = correctChars;
  resultsDiv.style.display = "block";
}

function init() {
  passage = generatePassage();
  timeLeft = 60;
  started = false;
  totalCharsTyped = 0;
  correctChars = 0;
  clearInterval(timerInterval);

  timerEl.textContent = "60";
  wpmEl.textContent = "0";
  accuracyEl.textContent = "100%";
  inputField.value = "";
  inputField.disabled = false;
  retryBtn.style.display = "none";
  resultsDiv.style.display = "none";

  renderText(0);
  inputField.focus();
}

inputField.addEventListener("input", () => {
  if (!started) {
    startTimer();
  }

  const typed = inputField.value;

  // Prevent typing beyond the passage
  if (typed.length > passage.length) {
    inputField.value = typed.slice(0, passage.length);
    return;
  }

  // Recalculate correct chars from scratch each input event
  totalCharsTyped = typed.length;
  correctChars = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === passage[i]) {
      correctChars++;
    }
  }

  renderText(typed.length);
  updateLiveStats();
});

// Prevent pasting
inputField.addEventListener("paste", (e) => e.preventDefault());

retryBtn.addEventListener("click", init);

// Initialize on load
init();
