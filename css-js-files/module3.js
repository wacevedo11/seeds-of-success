const $ = (id) => document.getElementById(id);

let voiceOn = true, musicOn = false, stars = 0, currentStep = 0;
let audioCtx;
let currentRiverIndex = 0;
const riverAssets = ['gallery/river.webp', 'gallery/river2.jpg'];

// Preload user assets
const imgFish1 = new Image();
imgFish1.src = 'home/fish.png';
const imgFish2 = new Image();
imgFish2.src = 'home/fish2.png';
const imgRiverBg = new Image();
imgRiverBg.src = 'gallery/river.webp';

let quizAnswersCorrect = [false, false, false];

document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar && window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else if (navbar) {
      navbar.classList.remove('scrolled');
    }
  });

  initChemLab();
  initFiltrationStage();
  initIrrigationStage();
  initQuiz();
});

function say(message) {
  if (!voiceOn || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
}

function playSound(type) {
  if (!musicOn) return;
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'catch') {
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } else if (type === 'success') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  }
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
    'Bio-Indicators & Aquatic Health',
    'River Field Sampling',
    'Water Chemistry Analysis',
    'Multi-Stage Filtration',
    'Safe Farm Irrigation',
    'Water STEM Quiz'
  ];
  say(titles[n]);

  if (n === 0) startMission1Canvas();
  else if (n === 1) startMission2Sampling();

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
  else say('Voice guidance enabled.');
});

$('musicBtn').addEventListener('click', () => {
  musicOn = !musicOn;
  $('musicBtn').textContent = musicOn ? 'Audio on' : 'Audio off';
  $('musicBtn').setAttribute('aria-pressed', musicOn);
});

// MISSION 1: CANVAS FISHING GAME
let canvas, ctx, animId, timerInterval;
let fishList = [], obstacles = [];
let hook = { x: 0, targetY: 40, length: 40, isFishing: false };
let fishCount = 0, lives = 3, timer = 30;

function startMission1Canvas() {
  canvas = $('gameCanvas');
  ctx = canvas.getContext('2d');
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  fishCount = 0;
  lives = 3;
  timer = 30;
  $('fish-count').textContent = fishCount;
  $('timer-val').textContent = timer;
  $('lives-val').textContent = '❤️❤️❤️';

  fishList = [
    { x: 80, y: 140, speed: 2, type: 1, caught: false },
    { x: 280, y: 220, speed: -1.8, type: 2, caught: false },
    { x: 450, y: 300, speed: 2.2, type: 1, caught: false }
  ];

  obstacles = [
    { x: 180, y: 180, speed: -2, size: 30 },
    { x: 380, y: 260, speed: 2.5, size: 30 }
  ];

  hook = { x: canvas.width / 2, targetY: 40, length: 40, isFishing: false };

  canvas.onclick = (e) => {
    if (hook.isFishing) return;
    const rect = canvas.getBoundingClientRect();
    hook.targetY = Math.max(50, e.clientY - rect.top);
    hook.x = e.clientX - rect.left;
    hook.isFishing = true;
  };

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer--;
    $('timer-val').textContent = timer;
    if (timer <= 0) {
      clearInterval(timerInterval);
      say('Time expired! Resetting stage.');
      startMission1Canvas();
    }
  }, 1000);

  if (animId) cancelAnimationFrame(animId);
  loopCanvas();
}

function loopCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Render background image river.webp or blue fallback
  if (imgRiverBg.complete && imgRiverBg.naturalWidth > 0) {
    ctx.drawImage(imgRiverBg, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(2, 132, 199, 0.35)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  fishList.forEach(f => {
    if (!f.caught) {
      f.x += f.speed;
      if (f.x < 20 || f.x > canvas.width - 70) f.speed *= -1;
      
      const img = (f.type === 1) ? imgFish1 : imgFish2;
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, f.x, f.y, 65, 40);
      } else {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(f.x + 30, f.y + 20, 20, 0, Math.PI * 2);
        ctx.fill();
      }

      if (hook.isFishing && Math.hypot(hook.x - (f.x + 30), hook.length - (f.y + 20)) < 35) {
        f.caught = true;
        fishCount++;
        $('fish-count').textContent = fishCount;
        playSound('catch');
        hook.isFishing = false;

        if (fishCount >= 3) {
          clearInterval(timerInterval);
          playSound('success');
          addStar();
          say('Great job sampling bio-indicator fish!');
          $('next0').classList.remove('hidden');
        }
      }
    }
  });

  obstacles.forEach(o => {
    o.x += o.speed;
    if (o.x < 20 || o.x > canvas.width - 50) o.speed *= -1;
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(o.x, o.y, o.size, o.size);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.fillText('🗑️', o.x + 6, o.y + 20);

    if (hook.isFishing && Math.abs(hook.x - (o.x + 15)) < 25 && Math.abs(hook.length - (o.y + 15)) < 25) {
      hook.isFishing = false;
      lives--;
      $('lives-val').textContent = '❤️'.repeat(Math.max(0, lives));
      if (lives <= 0) {
        clearInterval(timerInterval);
        startMission1Canvas();
      }
    }
  });

  if (hook.isFishing) {
    if (hook.length < hook.targetY) hook.length += 10;
    else hook.isFishing = false;
  } else {
    if (hook.length > 40) hook.length -= 10;
  }

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(hook.x, hook.length);
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(hook.x, hook.length, 6, 0, Math.PI * 2);
  ctx.fill();

  if (currentStep === 0) animId = requestAnimationFrame(loopCanvas);
}

$('next0').addEventListener('click', () => showStep(1));

// MISSION 2: RIVER SAMPLING
function startMission2Sampling() {
  let samplesFound = 0;
  $('sample-count').textContent = samplesFound;
  const container = $('river-container');
  container.querySelectorAll('.river-hotspot').forEach(el => el.remove());

  const spots = [
    { top: '35%', left: '30%' },
    { top: '60%', left: '68%' },
    { top: '48%', left: '48%' }
  ];

  spots.forEach(pos => {
    const spot = document.createElement('div');
    spot.className = 'river-hotspot';
    spot.style.top = pos.top;
    spot.style.left = pos.left;

    spot.onclick = () => {
      spot.classList.add('collected');
      samplesFound++;
      $('sample-count').textContent = samplesFound;
      playSound('catch');

      if (samplesFound >= 3) {
        playSound('success');
        addStar();
        say('All river water samples collected!');
        $('next1').classList.remove('hidden');
      }
    };
    container.appendChild(spot);
  });
}

$('toggle-river-bg').addEventListener('click', () => {
  currentRiverIndex = (currentRiverIndex + 1) % riverAssets.length;
  $('river-background').src = riverAssets[currentRiverIndex];
  $('bannerImg').src = riverAssets[currentRiverIndex];
});

$('next1').addEventListener('click', () => showStep(2));

// MISSION 3: CHEMISTRY LAB
function initChemLab() {
  const phInput = $('phInput');
  const nitrateInput = $('nitrateInput');

  function updateChemState() {
    const ph = parseFloat(phInput.value);
    const nitrate = parseInt(nitrateInput.value);

    $('phDisplay').textContent = ph;
    $('nitrateDisplay').textContent = nitrate;

    const box = $('chemStatusBox');
    if (ph >= 6.5 && ph <= 7.5 && nitrate <= 10) {
      box.className = 'status-box clean';
      box.innerHTML = '<b>Status: Clean & Balanced Water. Optimal for agricultural usage.';
      $('next2').classList.remove('hidden');
    } else {
      box.className = 'status-box polluted';
      box.innerHTML = '<b>Status: Unsafe Water ⚠️</b> Adjust pH to 6.5-7.5 and reduce Nitrates under 10 mg/L.';
      $('next2').classList.add('hidden');
    }
  }

  phInput.oninput = updateChemState;
  nitrateInput.oninput = updateChemState;
}

$('next2').addEventListener('click', () => showStep(3));

// MISSION 4: FILTRATION STAGE
function initFiltrationStage() {
  const phSlider = $('phSlider');
  const filterSlider = $('filterSlider');

  function updateFilter() {
    const ph = parseFloat(phSlider.value);
    const filter = parseInt(filterSlider.value);

    $('ph-val').textContent = ph;
    $('filter-val').textContent = filter;

    const box = $('water-preview-box');
    if (ph >= 6.8 && ph <= 7.4 && filter >= 85) {
      box.className = 'water-preview clean';
      $('preview-status').textContent = 'Status: Clean & Safe Water. Ready for farm irrigation!';
      $('next3').classList.remove('hidden');
    } else {
      box.className = 'water-preview polluted';
      $('preview-status').textContent = 'Status: Polluted Runoff ⚠️ (Target pH ~7.0, Sand Filter >= 85%)';
      $('next3').classList.add('hidden');
    }
  }

  phSlider.oninput = updateFilter;
  filterSlider.oninput = updateFilter;
}

$('next3').addEventListener('click', () => showStep(4));

// MISSION 5: IRRIGATION DRAG AND DROP
function initIrrigationStage() {
  let irrigatedCount = 0;
  const bucket = $('water-bucket');
  const zones = document.querySelectorAll('.farm-zone');

  bucket.ondragstart = (e) => e.dataTransfer.setData('text/plain', 'bucket');

  zones.forEach(zone => {
    zone.ondragover = (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    };

    zone.ondragleave = () => zone.classList.remove('drag-over');

    zone.ondrop = (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');

      if (!zone.classList.contains('irrigated')) {
        zone.classList.add('irrigated');
        zone.querySelector('.status-text').textContent = 'Irrigated & Healthy';
        irrigatedCount++;
        playSound('catch');

        if (irrigatedCount >= 4) {
          playSound('success');
          addStar();
          say('All farm zones successfully irrigated!');
          $('next4').classList.remove('hidden');
        }
      }
    };
  });
}

$('next4').addEventListener('click', () => showStep(5));

// MISSION 6: QUIZ LOGIC
function initQuiz() {
  const quizBoxes = document.querySelectorAll('.quiz-question-box');

  quizBoxes.forEach((box, qIndex) => {
    const buttons = box.querySelectorAll('.quiz-options button');
    const hint = box.querySelector('.quiz-hint');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.style.pointerEvents = 'none');
        const isCorrect = btn.dataset.correct === 'true';

        if (isCorrect) {
          btn.classList.add('correct');
          hint.textContent = 'Correct answer!';
          hint.style.color = '#155724';
          quizAnswersCorrect[qIndex] = true;
          addStar();
          say('Correct!');
        } else {
          btn.classList.add('incorrect');
          hint.textContent = 'Incorrect answer.';
          hint.style.color = '#721c24';
        }

        if (qIndex + 1 < quizBoxes.length) {
          $('qBox-' + (qIndex + 1)).classList.remove('hidden');
        } else {
          $('finishQuizBtn').classList.remove('hidden');
        }
      });
    });
  });

  $('finishQuizBtn').addEventListener('click', () => {
    $('mission5').classList.add('hidden');
    $('celebration').classList.remove('hidden');
    say('Mission complete! You passed the STEM Water Quality module.');
  });
}

// CERTIFICATE DOWNLOAD GENERATOR
$('downloadArchiveBtn').addEventListener('click', () => {
  const correctCount = quizAnswersCorrect.filter(Boolean).length;
  const certificateText = `
========================================
   SEEDS OF SUCCESS: RIVER WATER QUALITY
        STEM DIPLOMA ARCHIVE
========================================

Completion Date: ${new Date().toLocaleDateString()}
Total Stars Earned: ${stars} ⭐
STEM Quiz Score: ${correctCount} / 3 Correct

COMPLETED EXPERIMENTAL STAGES:
1. Aquatic Bio-Indicator Sampling (fish.png & fish2.png)
2. River Site Field Collection (river.webp & river2.jpg)
3. Water Chemistry & Nitrate Analysis
4. Environmental Multi-Stage Filtration & Neutralization
5. Sustainable Farm Irrigation (Crops & Livestock)
6. High School Environmental STEM Quiz

"Protecting watershed ecosystems ensures agricultural sustainability."

Authorized by:
Seeds of Success & McCullough Fellowship - UNCA
========================================
`.trim();

  const blob = new Blob([certificateText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Water_Quality_STEM_Certificate.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

$('againBtn').addEventListener('click', () => location.reload());