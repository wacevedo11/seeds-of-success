const $ = (id) => document.getElementById(id);
let voiceOn = true, musicOn = false, stars = 0, jarsCollected = 0;
let audioContext, musicTimer;

// Sound Effects Synthesizer for High Engagement
function playSfx(type) {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.connect(gain);
  gain.connect(audioContext.destination);

  const now = audioContext.currentTime;

  if (type === 'pop') {
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === 'success') {
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.35);
  } else if (type === 'jar') {
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
    osc.start(now);
    osc.stop(now + 0.25);
  }
}

// County Unlocking Tracker
const unlockedCounties = {
  haywood: true,
  buncombe: false,
  mcdowell: false,
  henderson: false
};

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initMapEvents();
  initHaywoodLogic();
  initBuncombeLogic();
  initMcDowellLogic();
  initHendersonLogic();
  initKitchenGame();
});

function initNavbar() {
  const hamburger = $('hamburger'), navLinks = $('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  }
}

function say(message) {
  if (!voiceOn || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.92;
  utterance.pitch = 1.05;
  speechSynthesis.speak(utterance);
}

function addStar(count = 1) {
  stars += count;
  $('starCount').textContent = stars;
  playSfx('success');
}

function updateJars() {
  $('jarCount').textContent = jarsCollected;
  playSfx('jar');
}

function switchTab(target) {
  document.querySelectorAll('.mission-card').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.mission-tab').forEach(tab => tab.classList.remove('active'));

  if (target === 'map') {
    $('mapSection').classList.remove('hidden');
    document.querySelector('[data-county="map"]').classList.add('active');
  } else if (target === 'kitchen') {
    $('kitchenSection').classList.remove('hidden');
    document.querySelector('[data-county="kitchen"]').classList.add('active');
  } else {
    $(`county-${target}`).classList.remove('hidden');
    const activeTab = $(`tab-${target}`);
    if (activeTab) activeTab.classList.add('active');
  }
  window.scrollTo({ top: 320, behavior: 'smooth' });
}

/* MAP HUB NAVIGATION */
function initMapEvents() {
  $('startBtn').addEventListener('click', () => {
    playSfx('pop');
    $('welcome').classList.add('hidden');
    $('game').classList.remove('hidden');
    switchTab('map');
    say("Welcome to Western North Carolina! Click Haywood County on the map to begin!");
  });

  document.querySelectorAll('.mission-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const county = tab.dataset.county;
      if (county === 'map' || county === 'kitchen' || unlockedCounties[county]) {
        playSfx('pop');
        switchTab(county);
      }
    });
  });

  document.querySelectorAll('.map-pin').forEach(pin => {
    pin.addEventListener('click', () => {
      const target = pin.dataset.target;
      if (unlockedCounties[target]) {
        playSfx('pop');
        switchTab(target);
      } else {
        say("Complete the previous county first to unlock this pin!");
      }
    });
  });
}

/* COUNTY 1: HAYWOOD LOGIC */
function initHaywoodLogic() {
  let cleared = 0;
  const targets = [$('branch1'), $('branch2'), $('soilSpot')];

  targets.forEach(t => {
    t.addEventListener('click', () => {
      if (!t.classList.contains('cleared')) {
        playSfx('pop');
        t.classList.add('cleared');
        cleared++;
        if (cleared === 3) {
          $('haywoodActFeedback').textContent = "Great pruning and composting!";
          $('haywoodQuiz').classList.remove('hidden');
          addStar(1);
          say("Great job! Now answer the Haywood knowledge question.");
        } else {
          $('haywoodActFeedback').textContent = `${3 - cleared} zone(s) left to manage!`;
        }
      }
    });
  });

  $('haywoodOptions').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.correct === 'true') {
        playSfx('success');
        $('haywoodQuizFeedback').textContent = "Correct! Winter pruning allows sunlight canopy access.";
        $('claimJar1').classList.remove('hidden');
        addStar(1);
        say("Correct answer! Claim your Haywood Apple Jelly Jar!");
      } else {
        $('haywoodQuizFeedback').textContent = "Good try! Think about how sunlight reaches ripening apples.";
      }
    });
  });

  $('btnClaim1').addEventListener('click', () => {
    jarsCollected = 1;
    updateJars();
    unlockedCounties.buncombe = true;
    $('tab-buncombe').disabled = false;
    $('pinBuncombe').classList.remove('pin-locked');
    $('pinBuncombe').classList.add('pin-active');
    $('pinBuncombe').querySelector('.pin-icon').textContent = '';
    switchTab('map');
    say("Haywood Apple Jelly Jar claimed! Buncombe County is unlocked on your map.");
  });
}

/* COUNTY 2: BUNCOMBE LOGIC */
function initBuncombeLogic() {
  let selected = null;
  let matches = 0;

  document.querySelectorAll('#buncombeMatch .match-card').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('matched')) return;
      playSfx('pop');

      if (!selected) {
        selected = btn;
        btn.style.borderColor = "#f28b6b";
      } else {
        if (selected !== btn && selected.dataset.pair === btn.dataset.pair) {
          selected.classList.add('matched');
          btn.classList.add('matched');
          matches++;
          playSfx('success');
          if (matches === 2) {
            $('buncombeActFeedback').textContent = "Perfect eco-matching! Pollinators and Nitrogen paired!";
            $('buncombeQuiz').classList.remove('hidden');
            addStar(1);
            say("Awesome eco-matching! Complete the Buncombe quiz.");
          }
        } else {
          selected.style.borderColor = "#b2d8aa";
        }
        selected = null;
      }
    });
  });

  $('buncombeQ1Opts').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.correct === 'true') {
        playSfx('pop');
        $('buncombeQ2Box').classList.remove('hidden');
      }
    });
  });

  $('buncombeQ2Opts').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.correct === 'true') {
        playSfx('success');
        $('buncombeQuizFeedback').textContent = "Both Buncombe questions correct!";
        $('claimJar2').classList.remove('hidden');
        addStar(1);
        say("Great work! Claim your Buncombe Jar!");
      }
    });
  });

  $('btnClaim2').addEventListener('click', () => {
    jarsCollected = 2;
    updateJars();
    unlockedCounties.mcdowell = true;
    $('tab-mcdowell').disabled = false;
    $('pinMcdowell').classList.remove('pin-locked');
    $('pinMcdowell').classList.add('pin-active');
    $('pinMcdowell').querySelector('.pin-icon').textContent = '';
    switchTab('map');
    say("Buncombe Apple Jelly Jar claimed! McDowell County is unlocked.");
  });
}

/* COUNTY 3: MCDOWELL LOGIC */
function initMcDowellLogic() {
  let removed = 0;
  [$('thin1'), $('thin2')].forEach(btn => {
    btn.addEventListener('click', () => {
      if (!btn.classList.contains('removed')) {
        playSfx('pop');
        btn.classList.add('removed');
        removed++;
        if (removed === 2) {
          $('mcdowellActFeedback').textContent = " Cluster thinned! 1 king apple receives maximum solar energy.";
          $('mcdowellQuiz').classList.remove('hidden');
          addStar(1);
          say("Great fruit thinning! Answer the McDowell question.");
        }
      }
    });
  });

  $('mcdowellOptions').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.correct === 'true') {
        playSfx('success');
        $('mcdowellQuizFeedback').textContent = "Correct! Thinning concentrates tree sugar and water.";
        $('claimJar3').classList.remove('hidden');
        addStar(1);
        say("Correct! Claim your McDowell Jar!");
      }
    });
  });

  $('btnClaim3').addEventListener('click', () => {
    jarsCollected = 3;
    updateJars();
    unlockedCounties.henderson = true;
    $('tab-henderson').disabled = false;
    $('pinHenderson').classList.remove('pin-locked');
    $('pinHenderson').classList.add('pin-active');
    $('pinHenderson').querySelector('.pin-icon').textContent = '';
    switchTab('map');
    say("McDowell Jar claimed! Henderson County is unlocked.");
  });
}

/* COUNTY 4: HENDERSON LOGIC */
function initHendersonLogic() {
  let sorted = 0;
  document.querySelectorAll('#harvestSort .sort-apple').forEach(btn => {
    btn.addEventListener('click', () => {
      if (Number(btn.dataset.brix) >= 12 && !btn.disabled) {
        playSfx('pop');
        btn.style.background = "#d4edda";
        btn.disabled = true;
        sorted++;
        if (sorted === 2) {
          $('hendersonActFeedback').textContent = "🧪 Peak fructose apples harvested (12°+ Brix)!";
          $('hendersonQuiz').classList.remove('hidden');
          addStar(1);
          say("High sugar apples selected! Answer the final harvest question.");
        }
      }
    });
  });

  $('hendersonOptions').querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.correct === 'true') {
        playSfx('success');
        $('hendersonQuizFeedback').textContent = "Correct! Cold storage locks in natural pectin for jelly setting.";
        $('claimJar4').classList.remove('hidden');
        addStar(1);
        say("All county questions completed! Unlock the Apple Jelly Kitchen!");
      }
    });
  });

  $('btnClaim4').addEventListener('click', () => {
    jarsCollected = 4;
    updateJars();
    $('tab-kitchen').disabled = false;
    switchTab('kitchen');
    say("All 4 jars collected! Welcome to the Apple Jelly Kitchen!");
  });
}

/* STEP-BY-STEP APPLE JELLY KITCHEN GAME */
function initKitchenGame() {
  const steps = [$('kStep1'), $('kStep2'), $('kStep3'), $('kStep4'), $('kStep5')];
  const stages = [$('kStage1'), $('kStage2'), $('kStage3'), $('kStage4'), $('kStage5')];

  function advanceKitchen(nextIdx) {
    playSfx('success');
    stages.forEach((st, i) => st.classList.toggle('hidden', i !== nextIdx));
    steps.forEach((sp, i) => sp.classList.toggle('active', i <= nextIdx));
  }

  $('btnAction1').addEventListener('click', () => {
    $('kitchenFeedback').textContent = "Sliced! Peels and cores retained for maximum pectin.";
    advanceKitchen(1);
    say("Step 2: Simmer pot to extract liquid pectin.");
  });

  $('btnAction2').addEventListener('click', () => {
    $('kitchenFeedback').textContent = "Simmered at 212°F! Cell walls broken down.";
    advanceKitchen(2);
    say("Step 3: Gravity strain juice for crystal clarity.");
  });

  $('btnAction3').addEventListener('click', () => {
    $('kitchenFeedback').textContent = "Clear extract strained without cloudiness!";
    advanceKitchen(3);
    say("Step 4: Balance pectin, sugar, and lemon acid.");
  });

  $('btnAction4').addEventListener('click', () => {
    $('kitchenFeedback').textContent = "Chemical gel network formed!";
    advanceKitchen(4);
    say("Step 5: Fill and seal sterile glass jars!");
  });

  $('btnAction5').addEventListener('click', () => {
    playSfx('jar');
    $('kitchenSection').classList.add('hidden');
    $('celebration').classList.remove('hidden');
    say("Congratulations! You cooked fresh Western NC Apple Jelly!");
  });

  $('downloadArchiveBtn').addEventListener('click', () => {
    const text = `SEEDS OF SUCCESS: APPLE JELLY STEM MODULE\nCompletion Date: ${new Date().toLocaleDateString()}\nStars Earned: ${stars}\nJelly Jars Collected: 4 / 4\nMastered Counties: Haywood, Buncombe, McDowell, Henderson.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'WNC_Apple_Jelly_Module_Summary.txt';
    a.click();
  });

  $('againBtn').addEventListener('click', () => location.reload());
}