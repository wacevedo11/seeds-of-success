let soundEnabled = true;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (!soundEnabled) return;
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click') {
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
    } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    }
}

// Toggle Sound Button
document.getElementById('soundToggle').addEventListener('click', function() {
    soundEnabled = !soundEnabled;
    this.textContent = soundEnabled ? 'Voice on' : 'Voice off';
    this.setAttribute('aria-pressed', soundEnabled);
});

// Game State
let foundCount = 0;
const totalClues = 3;
const foundClues = { vent: false, microscope: false, journals: false };

// Clue Messages (Simple Language)
const cluesData = {
    vent: { title: "Clue 1: Air Vent", text: "You found clean airflow data. Good airflow helps crops grow strong without pollution." },
    microscope: { title: "Clue 2: Microscope", text: "You looked at plant cells. Healthy seeds make strong food for our community." },
    journals: { title: "Clue 3: Lab Journals", text: "The notes show how organic farming protects the soil and water." }
};

// Screens
const startScreen = document.getElementById('start-screen');
const labScreen = document.getElementById('lab-screen');
const modalScreen = document.getElementById('modal-screen');
const hypothesisScreen = document.getElementById('hypothesis-screen');
const beakerScreen = document.getElementById('beaker-screen');
const evidenceScreen = document.getElementById('evidence-screen');
const securityScreen = document.getElementById('security-screen');
const finishScreen = document.getElementById('finish-screen');

// Enter Lab
document.getElementById('enter-lab-btn').addEventListener('click', () => {
    playSound('click');
    startScreen.classList.remove('active');
    labScreen.classList.add('active');
});

// Clue Hotspots
const hotspots = document.querySelectorAll('.clue-hotspot');
const foundCountSpan = document.getElementById('found-count');
const clueTitle = document.getElementById('clue-title');
const clueText = document.getElementById('clue-text');
let activeHotspot = null;

hotspots.forEach(hotspot => {
    hotspot.addEventListener('click', () => {
        const clueType = hotspot.getAttribute('data-clue');
        if (!foundClues[clueType]) {
            playSound('click');
            foundClues[clueType] = true;
            activeHotspot = hotspot;
            clueTitle.textContent = cluesData[clueType].title;
            clueText.textContent = cluesData[clueType].text;
            modalScreen.classList.remove('hidden');
        }
    });
});

document.getElementById('close-modal-btn').addEventListener('click', () => {
    playSound('success');
    modalScreen.classList.add('hidden');
    if (activeHotspot) {
        activeHotspot.classList.add('found');
        foundCount++;
        foundCountSpan.textContent = foundCount;
    }

    if (foundCount === totalClues) {
        setTimeout(() => {
            labScreen.classList.remove('active');
            hypothesisScreen.classList.add('active');
        }, 400);
    }
});

// Hypothesis
const hypothesisBtns = document.querySelectorAll('.hypothesis-btn');
const hypoError = document.getElementById('hypo-error');

hypothesisBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const isCorrect = btn.getAttribute('data-correct') === 'true';
        if (isCorrect) {
            playSound('success');
            hypothesisScreen.classList.remove('active');
            beakerScreen.classList.add('active');
        } else {
            playSound('error');
            hypoError.classList.remove('hidden');
        }
    });
});

// Beakers
const beakers = document.querySelectorAll('.beaker');
const beakerMsg = document.getElementById('beaker-msg');

beakers.forEach(beaker => {
    beaker.addEventListener('click', () => {
        const beakerNum = beaker.getAttribute('data-beaker');
        // Beaker 2 is natural compost
        if (beakerNum === '2') {
            playSound('success');
            beakerScreen.classList.remove('active');
            evidenceScreen.classList.add('active');
        } else {
            playSound('error');
            beakerMsg.classList.remove('hidden');
        }
    });
});

// Evidence Grid
const submitGridBtn = document.getElementById('submit-grid-btn');
const gridOpt1 = document.getElementById('grid-opt-1');
const gridOpt2 = document.getElementById('grid-opt-2');
const gridError = document.getElementById('grid-error');

submitGridBtn.addEventListener('click', () => {
    if (gridOpt1.value === 'correct' && gridOpt2.value === 'correct') {
        playSound('success');
        evidenceScreen.classList.remove('active');
        securityScreen.classList.add('active');
    } else {
        playSound('error');
        gridError.classList.remove('hidden');
    }
});

// Security Code (Answer: plant or crop)
const submitCodeBtn = document.getElementById('submit-code-btn');
const securityInput = document.getElementById('security-input');
const codeError = document.getElementById('code-error');

submitCodeBtn.addEventListener('click', () => {
    const code = securityInput.value.trim().toLowerCase();
    if (code === 'plant' || code === 'crop' || code === 'plants') {
        playSound('success');
        securityScreen.classList.remove('active');
        finishScreen.classList.add('active');
    } else {
        playSound('error');
        codeError.classList.remove('hidden');
    }
});

// Restart
document.getElementById('restart-btn').addEventListener('click', () => {
    playSound('click');
    location.reload();
});