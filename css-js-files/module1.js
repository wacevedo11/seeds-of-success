const $ = (id) => document.getElementById(id);
let voiceOn = true, musicOn = false, stars = 0, currentStep = 0, growthNext = 0;
let audioContext, musicTimer;

// Correct soil profile order (Top to Bottom)
const correctSoilOrder = ['topsoil', 'subsoil', 'parent', 'bedrock'];
let selectedDragItem = null;

// Quiz State Tracking
let quizAnswersCorrect = [false, false, false];

// Mobile navigation toggle script matching foodmodules.html
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // Navbar Scroll Shadow Effect
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  });

  initSoilDragGame();
  initQuiz();
});

function say(message) {
  if (!voiceOn || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.88;
  utterance.pitch = 1.12;
  utterance.volume = 0.9;
  speechSynthesis.speak(utterance);
}

function addStar() {
  stars++;
  $('starCount').textContent = stars;
}

function showStep(n) {
  currentStep = n;
  document.querySelectorAll('.mission-card[id^="mission"]').forEach((el, i) => el.classList.toggle('hidden', i !== n));
  document.querySelectorAll('.mission-tab').forEach((el, i) => {
    el.classList.toggle('active', i === n);
    el.classList.toggle('done', i < n);
  });
  const titles = [
    'Count the Farm Friends!',
    'Find the Soil Helper!',
    'Help the Plants Grow!',
    'How many cows on the farm?',
    'Build the Soil Layers!',
    'Final Knowledge Quiz!'
  ];
  say(titles[n]);
  document.querySelector('.mission-card[id="mission' + n + '"]').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

$('startBtn').addEventListener('click', () => {
  $('welcome').classList.add('hidden');
  $('game').classList.remove('hidden');
  showStep(0);
});

document.querySelectorAll('.mission-tab').forEach(btn => btn.addEventListener('click', () => {
  const n = Number(btn.dataset.step);
  if (n <= currentStep) showStep(n);
}));

$('voiceBtn').addEventListener('click', () => {
  voiceOn = !voiceOn;
  $('voiceBtn').textContent = voiceOn ? 'Voice on' : 'Voice off';
  $('voiceBtn').setAttribute('aria-pressed', voiceOn);
  if (!voiceOn && 'speechSynthesis' in window) speechSynthesis.cancel();
  else say('Hello little farmer!');
});

function playTone(freq, duration = 0.18) {
  if (!audioContext) return;
  const osc = audioContext.createOscillator(), gain = audioContext.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.setValueAtTime(.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.045, audioContext.currentTime + .02);
  gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start();
  osc.stop(audioContext.currentTime + duration);
}

$('musicBtn').addEventListener('click', () => {
  musicOn = !musicOn;
  $('musicBtn').textContent = musicOn ? 'Music on' : 'Music off';
  $('musicBtn').setAttribute('aria-pressed', musicOn);
  if (musicOn) {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    let notes = [523, 659, 784, 659, 587, 698, 880, 698], i = 0;
    musicTimer = setInterval(() => { if (musicOn) playTone(notes[i++ % notes.length], .28) }, 420);
  } else clearInterval(musicTimer);
});

function correct(feedback, next, message) {
  feedback.textContent = message;
  feedback.style.color = '#2f7138';
  addStar();
  say(message);
  next.classList.remove('hidden');
}

// Mission 1 Answer Check (2 Insects)
$('seedAnswers').querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
  if (btn.textContent === '2') {
    correct($('seedFeedback'), $('next0'), 'Great job! Two farm insects. One, two!');
  } else {
    $('seedFeedback').textContent = 'Let’s count again. Touch each insect!';
    say('Let’s count again. One, two.');
  }
}));

$('next0').addEventListener('click', () => showStep(1));

// Mission 2 Answer Check
$('wormAnswers').querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
  if (btn.dataset.correct === 'true') {
    btn.classList.add('correct');
    correct($('wormFeedback'), $('next1'), 'That’s right! Worms protect our plants.');
  } else {
    $('wormFeedback').textContent = 'Good try! Look for the brown worm.';
    say('Good try! Look for the brown worm.');
  }
}));

$('next1').addEventListener('click', () => showStep(2));

// Mission 3 Sequence Check
$('growthOptions').querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
  const stage = Number(btn.dataset.stage);
  if (stage === growthNext) {
    btn.classList.add('selected');
    $('growthProgress').children[growthNext].classList.add('filled');
    growthNext++;
    if (growthNext === 7) {
      correct($('growthFeedback'), $('next2'), 'Wonderful! You tapped all seven growth stages!');
    } else {
      const encouragements = [
        'Great job! What comes next?', 
        'Awesome growth! What comes next?', 
        'Looking good! Keep going!', 
        'Getting taller! What is next?', 
        'Almost there! Find the next step.', 
        'One more stage to go!'
      ];
      const msg = encouragements[growthNext - 2] || 'What comes next?';
      $('growthFeedback').textContent = msg;
      say(msg);
    }
  } else {
    $('growthFeedback').textContent = 'Not quite! Look for the next step in order.';
    say('Not quite! Look for the next step in order.');
  }
}));

$('next2').addEventListener('click', () => showStep(3));

// Mission 4 Answer Check (3 Cows)
$('cowAnswers').querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
  if (btn.textContent === '3') {
    correct($('cowFeedback'), $('next3'), 'Moo! Three cows. You counted them all!');
  } else {
    $('cowFeedback').textContent = 'Let’s count together: one, two, three!';
    say('Let’s count together: one, two, three!');
  }
}));

$('next3').addEventListener('click', () => showStep(4));

// --- MISSION 5: SOIL HORIZONS DRAG & DROP GAME LOGIC ---
function initSoilDragGame() {
  const items = document.querySelectorAll('.drag-item');
  const slots = document.querySelectorAll('.slot');

  items.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.dataset.layerId);
      setTimeout(() => item.classList.add('hidden'), 0);
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('hidden');
    });

    item.addEventListener('click', () => {
      items.forEach(i => i.classList.remove('selected-tap'));
      selectedDragItem = item;
      item.classList.add('selected-tap');
      $('soilFeedback').textContent = `Selected "${item.querySelector('b').textContent}". Now click a slot!`;
    });
  });

  slots.forEach(slot => {
    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
      slot.classList.add('drag-over');
    });

    slot.addEventListener('dragleave', () => {
      slot.classList.remove('drag-over');
    });

    slot.addEventListener('drop', (e) => {
      e.preventDefault();
      slot.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      const draggedElement = document.querySelector(`[data-layer-id="${id}"]`);
      placeLayerInSlot(draggedElement, slot);
    });

    slot.addEventListener('click', () => {
      if (selectedDragItem) {
        placeLayerInSlot(selectedDragItem, slot);
        selectedDragItem.classList.remove('selected-tap');
        selectedDragItem = null;
      }
    });
  });

  $('checkSoilBtn').addEventListener('click', checkSoilOrder);
  $('resetSoilBtn').addEventListener('click', resetSoilGame);
}

function placeLayerInSlot(element, slot) {
  if (!element || !slot) return;
  const slotContent = slot.querySelector('.slot-content');
  if (slotContent.children.length > 0) {
    const existing = slotContent.children[0];
    $('layerPool').appendChild(existing);
  }
  slotContent.appendChild(element);
  $('soilFeedback').textContent = 'Layer placed! Arrange all 4 layers, then click "Check Soil Layers".';
}

function checkSoilOrder() {
  const slots = document.querySelectorAll('.slot-content');
  let currentOrder = [];

  slots.forEach(slot => {
    if (slot.children.length > 0) {
      currentOrder.push(slot.children[0].dataset.layerId);
    } else {
      currentOrder.push(null);
    }
  });

  if (currentOrder.includes(null)) {
    $('soilFeedback').textContent = 'Please place all 4 soil layers into the slots first!';
    say('Please place all four soil layers into the slots first!');
    return;
  }

  let isCorrect = true;
  for (let i = 0; i < correctSoilOrder.length; i++) {
    if (currentOrder[i] !== correctSoilOrder[i]) {
      isCorrect = false;
      break;
    }
  }

  if (isCorrect) {
    correct($('soilFeedback'), $('next4'), 'Awesome! You correctly built the soil horizons profile from Topsoil down to Bedrock!');
  } else {
    $('soilFeedback').textContent = 'Not quite in the right order! Hint: Topsoil goes on top (Slot 1) and Bedrock is at the bottom (Slot 4). Try again!';
    $('soilFeedback').style.color = '#c86d51';
    say('Not quite in the right order. Try rearranging the soil layers!');
  }
}

function resetSoilGame() {
  const items = document.querySelectorAll('.drag-item');
  const pool = $('layerPool');
  items.forEach(item => pool.appendChild(item));
  $('soilFeedback').textContent = 'Drag or click a layer picture to start building the soil profile!';
  $('soilFeedback').style.color = '#2f7138';
}

$('next4').addEventListener('click', () => showStep(5));

// --- MISSION 6: FINAL QUIZ LOGIC ---
function initQuiz() {
  const quizBoxes = document.querySelectorAll('.quiz-question-box');

  quizBoxes.forEach((box, qIndex) => {
    const buttons = box.querySelectorAll('.quiz-options button');
    const hint = box.querySelector('.quiz-hint');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Disable all buttons in this question box
        buttons.forEach(b => b.style.pointerEvents = 'none');

        const isCorrect = btn.dataset.correct === 'true';
        if (isCorrect) {
          btn.classList.add('correct');
          hint.textContent = 'Correct! Fantastic job!';
          hint.style.color = '#2f7138';
          quizAnswersCorrect[qIndex] = true;
          addStar();
          say('Correct! Fantastic job!');

          // Reveal next question or finish button
          if (qIndex + 1 < quizBoxes.length) {
            $('qBox-' + (qIndex + 1)).classList.remove('hidden');
            $('qBox-' + (qIndex + 1)).scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            $('finishQuizBtn').classList.remove('hidden');
            $('finishQuizBtn').scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          btn.classList.add('incorrect');
          hint.textContent = 'Not quite right, but good try! Let’s keep going.';
          hint.style.color = '#c86d51';
          quizAnswersCorrect[qIndex] = false;
          say('Good try!');

          // Reveal next question anyway so they can finish the quiz
          if (qIndex + 1 < quizBoxes.length) {
            $('qBox-' + (qIndex + 1)).classList.remove('hidden');
            $('qBox-' + (qIndex + 1)).scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            $('finishQuizBtn').classList.remove('hidden');
            $('finishQuizBtn').scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      });
    });
  });

  $('finishQuizBtn').addEventListener('click', () => {
    $('mission5').classList.add('hidden');
    $('celebration').classList.remove('hidden');
    say('You did it, little farmer! You completed all missions and aced the quiz!');
    $('celebration').scrollIntoView({ behavior: 'smooth' });
  });
}

// --- ARCHIVE DOWNLOAD GENERATOR ---
$('downloadArchiveBtn').addEventListener('click', () => {
  const correctCount = quizAnswersCorrect.filter(Boolean).length;
  const certificateText = `
========================================
   SEEDS OF SUCCESS: SOIL HEALTH FARM
        OFFICIAL DIPLOMA ARCHIVE
========================================

Student Name: Little Farmer
Completion Date: ${new Date().toLocaleDateString()}
Total Stars Earned: ${stars} ⭐
Quiz Score: ${correctCount} / 3 Correct

MISSIONS COMPLETED:
1. Count the Farm Friends (Insects)
2. Living Soil (Earthworm Protection)
3. Plant Science (7 Growth Stages)
4. Farm Math (Counting Cows)
5. Soil Horizons (Topsoil to Bedrock Profile)
6. Final Knowledge Quiz

"Topsoil takes hundreds of years to form! 
Thank you for learning about sustainable 
agriculture, soil health, and environmental advocacy."

Authorized by:
Seeds of Success & McCullough Fellowship - UNCA
========================================
`.trim();

  const blob = new Blob([certificateText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Little_Farmer_Soil_Health_Certificate.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

$('againBtn').addEventListener('click', () => location.reload());