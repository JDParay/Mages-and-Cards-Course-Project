const isDev = true;

if (isDev) {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'E' || e.key === 'e') {
      if (window.currentNode && window.currentNode.next) {
        startVN(window.currentNode.next);
      } else {
        console.warn('No current node or next node to skip to.');
      }
    }
  });
}

const GameAudio = {
    music: {
        current: null,
        tracks: {
            menu: new Audio('audio/MainMenuBGM.m4a'),
            vn: new Audio('audio/TutorialBGM.m4a')
        }
    },
    sfx: {
        volume: 0.5,
        tracks: {
            button: new Audio('audio/sfx_button.mp3'),
            tap: new Audio('audio/sfx_tap.mp3')
        }
    }
};

// Enable looping
GameAudio.music.tracks.menu.loop = true;
GameAudio.music.tracks.vn.loop = true;

function playMusic(trackName) {
    const nextTrack = GameAudio.music.tracks[trackName];
    if (GameAudio.music.current === nextTrack) return;
    if (GameAudio.music.current) {
        GameAudio.music.current.pause();
        GameAudio.music.current.currentTime = 0;
    }
    GameAudio.music.current = nextTrack;
    GameAudio.music.current.play().catch(() => console.log("Interaction needed for audio"));
}

function playSFX(sfxName) {
    const sound = GameAudio.sfx.tracks[sfxName].cloneNode();
    sound.volume = GameAudio.sfx.volume;
    sound.play();
}

// Initial interaction to start music
window.addEventListener('click', () => playMusic('menu'), { once: true });

/* ==========================================
   STORY DATA
   ========================================== */
let storyData = { };

async function loadChapter(file) {
    const response = await fetch(file);
    storyData = await response.json();
}

async function startLevel(file, startNode) {
    await loadChapter(file);
    startVN(startNode);
}

document.querySelectorAll('.quest').forEach(btn => {
    btn.addEventListener('click', async () => {
        const file = btn.dataset.file;
        const startNode = btn.dataset.start;

        if (!file || !startNode) {
            console.error("Missing data-file or data-start");
            return;
        }

        await startLevel(file, startNode);
    });
});
/* ==========================================
   ENGINE LOGIC
   ========================================== */
let isTyping = false;
let typeTimeout = null;
let currentFullText = "";
let gameHistory = [];
let claimedRewards = [];
let playerResources = { land: 0, ocean: 0, forest: 0 };
let currentNode = null;
let unlockedNodes = ["ch1_start"];

function updateBGMVolume(vol) {
    for (let track in GameAudio.music.tracks) {
        GameAudio.music.tracks[track].volume = vol;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Volume sliders
    const bgmSlider = document.getElementById('bgm-slider');
    const sfxSlider = document.getElementById('sfx-slider');

    if (bgmSlider) {
        bgmSlider.addEventListener('input', (e) => updateBGMVolume(e.target.value));
    }
    if (sfxSlider) {
        sfxSlider.addEventListener('input', (e) => GameAudio.sfx.volume = e.target.value);
    }

    // Quest cards
    document.querySelectorAll('.quest-card').forEach(card => {
        card.addEventListener('click', async () => {
            if (card.classList.contains('locked')) return;

            const file = card.dataset.file;
            const startNode = card.dataset.start;

            if (!file || !startNode) {
                console.error("Missing data-file or data-start");
                return;
            }

            await startLevel(file, startNode);
        });
    });
});

function updateMapUI() {
    // --- STEP 1: If 1 is done, unlock 2 & 3 ---
    // Note: 'ch1_start_done' is a tag we add when Level 1 finishes
    if (unlockedNodes.includes("ch1_start_done")) {
        unlockQuest('q-2', 'ENTER');
    }

    // --- STEP 2: If 2 is finished, show and unlock 2.1 ---
    if (unlockedNodes.includes("ch1_level2_done")) {
        const q21 = document.getElementById('q-2-1');
        q21.classList.remove('hidden');
        unlockQuest('q-2-1', 'ENTER');
    }


    if (unlockedNodes.includes("ch1_scorched_done")) {
    const q31 = document.getElementById('q-3-1');
    q31.classList.remove('hidden');

    if (playerResources.ocean >= 50) {
        unlockQuest('q-3-1', 'ENTER');
    } else {
        q31.querySelector('.quest-action').innerText = "50💧 REQ";
    }
}

    // --- STEP 4: If 3.1 is done, show 3.2 and 4 ---
    if (unlockedNodes.includes("ch1_ocean_canon_done")) {
        document.getElementById('q-3-2').classList.remove('hidden');
        unlockQuest('q-3-2', 'ENTER');
        
        document.getElementById('q-4').classList.remove('hidden');
        unlockQuest('q-4', 'ENTER');
    }
}

// HELPER: This prevents you from typing the same code 10 times
function unlockQuest(id, text) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove('locked');
        const action = el.querySelector('.quest-action');
        if (action) action.innerText = text;
    }
}

function selectChoice(choice) {
    // 🚫 REQUIREMENT CHECK
    if (choice.requirement) {
        for (const [res, amt] of Object.entries(choice.requirement)) {
            if ((playerResources[res] || 0) < amt) {
                console.log("Not enough resources");
                return; // BLOCK the choice
            }
        }
    }

    // 🎁 REWARD
   if (choice.reward) {
    const rewardId = currentNode.id + "_" + choice.text;

    if (!claimedRewards.includes(rewardId)) {
        for (const [res, amt] of Object.entries(choice.reward)) {
            playerResources[res] = (playerResources[res] || 0) + amt;
        }
        claimedRewards.push(rewardId);
        updateResourceUI();
    } else {
        console.log("Reward already claimed");
    }
}

    // 🔓 UNLOCK TAG
    if (choice.unlockTag) {
        if (!unlockedNodes.includes(choice.unlockTag)) {
            unlockedNodes.push(choice.unlockTag);
        }
    }

    addToLog("YOU", choice.text);

    const destination = choice.next || choice.nextNode || choice.nextPath;
    if (!destination) return;

// 🔥 If staying in same node → refresh buttons
if (destination === currentNode.id) {
    renderNode(currentNode.id);
} else {
    renderNode(destination);
}
}

function startVN(nodeId = "ch1_start") {
    playMusic('vn'); // <--- TRIGGER GAMEPLAY MUSIC
    
    document.getElementById('path-selection-screen').classList.add('hidden');
    document.getElementById('path-selection-screen').style.display = 'none';
    
    const vnScreen = document.getElementById('vn-game-screen');
    vnScreen.classList.remove('hidden');
    vnScreen.style.display = 'flex';

    const resBar = document.getElementById('vn-resource-bar');
    resBar.classList.remove('menu-mode');
    resBar.classList.add('game-mode', 'active');
    resBar.style.display = 'flex';
    
    updateResourceUI();
    renderNode(nodeId);
}

function typeWriter(element, text, callback) {
    element.innerHTML = "";
    currentFullText = text;
    isTyping = true;
    let i = 0;
    const speed = 30;

    clearTimeout(typeTimeout);

    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            typeTimeout = setTimeout(type, speed);
        } else {
            isTyping = false;
            if (callback) callback();
        }
    }
    type();
}

function renderNode(nodeId) {
    if (nodeId === "main_menu" || nodeId === "go_to_path_selection") {
        playMusic('menu'); 
        

        document.getElementById('vn-game-screen').classList.add('hidden');
        document.getElementById('vn-game-screen').style.display = 'none';
        
        // Show Path Selection Screen Directly
        const pathScreen = document.getElementById('path-selection-screen');
        pathScreen.classList.remove('hidden');
        pathScreen.style.display = 'flex';

        // Reset resource bar to menu mode
        const resBar = document.getElementById('vn-resource-bar');
        resBar.classList.remove('game-mode');
        resBar.classList.add('menu-mode');

        
        updateMapUI(); 
        return;
    }

    currentNode = storyData[nodeId];
    currentNode.id = nodeId;
    if (!currentNode) return;

    window.currentNode = currentNode;

    const storyBox = document.getElementById('story-box');
    const storyText = document.getElementById('story-text');
    const mageBox = document.getElementById('mage-dialogue-box');
    const mageText = document.getElementById('mage-text');
    const standardContainer = document.getElementById('standard-choice-container');
    const cardContainer = document.getElementById('card-choice-container');

    standardContainer.innerHTML = '';
    cardContainer.innerHTML = '';

    if (currentNode.uiType === "narrative") {
        storyBox.classList.remove('hidden');
        storyBox.style.display = 'flex'; // FORCE visibility
        mageBox.classList.add('hidden');
        addToLog("NARRATOR", currentNode.text);
        typeWriter(storyText, currentNode.text);
    } 
    else if (currentNode.uiType === "mage") {
        // Hide narrator box when mage speaks
        storyBox.classList.add('hidden'); 
        storyBox.style.display = 'none';

        mageBox.classList.remove('hidden');
        mageBox.style.display = 'block';
        document.querySelector('.mage-name').innerText = currentNode.mageName;
        addToLog(currentNode.mageName, currentNode.mageText);
        typeWriter(mageText, currentNode.mageText);
    }
    else if (currentNode.uiType === "standard" || currentNode.uiType === "cards") {
        storyBox.classList.remove('hidden');
        storyBox.style.display = 'flex';
        storyText.innerText = currentNode.text; 
        
        const container = currentNode.uiType === "standard" ? standardContainer : cardContainer;
        
        currentNode.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'game-btn';
            let displayText = choice.text;
            btn.innerText = displayText;

    const hasRequirement = choice.requirement;
    let hasEnough = true;

    if (hasRequirement) {
        hasEnough = Object.entries(choice.requirement).every(
            ([res, amt]) => (playerResources[res] || 0) >= amt
        );

        if (!hasEnough) {
            btn.disabled = true;

            const reqText = Object.entries(choice.requirement)
                .map(([res, amt]) => `${amt} ${res}`)
                .join(", ");

            displayText += ` (${reqText} needed)`;
        }
    }
            btn.onclick = (e) => {
                e.stopPropagation();
                if (btn.disabled) return;
                selectChoice(choice);
            };
            container.appendChild(btn);
        });
    }

    if (nodeId === "main_menu") {
    playMusic('menu');
    
    // Switch screens
    document.getElementById('vn-game-screen').classList.add('hidden');
    document.getElementById('vn-game-screen').style.display = 'none';
    document.getElementById('path-selection-screen').classList.remove('hidden');
    document.getElementById('path-selection-screen').style.display = 'flex';
    }
}

function handleGlobalClick() {
    const logModal = document.getElementById('history-log');
    if (logModal.style.display === 'flex') return;

    if (!currentNode) return;

    if (isTyping) {
        clearTimeout(typeTimeout);
        isTyping = false;
        const targetId = currentNode.uiType === "mage" ? "mage-text" : "story-text";
        document.getElementById(targetId).innerHTML = currentFullText;
        return;
    }

    if ((currentNode.uiType === "narrative" || currentNode.uiType === "mage") && currentNode.next) {
        renderNode(currentNode.next);
    }
}

/* ==========================================
   NAVIGATION & UI
   ========================================== */
function addToLog(name, text) {
    gameHistory.push({ name, text });
}

function toggleLog(e) {
    if (e) e.stopPropagation();
    const logModal = document.getElementById('history-log');
    const logContent = document.getElementById('log-content');
    
    if (logModal.style.display === 'none') {
        logContent.innerHTML = gameHistory.map(entry => `
            <div class="log-entry">
                <span class="log-name">${entry.name}</span>
                <span class="log-text">${entry.text}</span>
            </div>
        `).join('');
        logModal.style.display = 'flex';
    } else {
        logModal.style.display = 'none';
    }
}

function showCampaign() {
    document.getElementById('main-menu-screen').classList.add('hidden');
    document.getElementById('campaign-screen').classList.remove('hidden');
    
    // Fix: Ensure resource bar shows up correctly in menu-mode
    const resBar = document.getElementById('vn-resource-bar');
    resBar.classList.add('active', 'menu-mode');
    resBar.classList.remove('game-mode'); // Ensure it's not in game-mode
    resBar.style.display = 'flex';
}

function showPathSelection(chapterId) {
    document.getElementById('campaign-screen').classList.add('hidden');
    document.getElementById('path-selection-screen').classList.remove('hidden');
    document.getElementById('path-selection-screen').style.display = 'flex';
}

function goBackToChapters() {
    document.getElementById('path-selection-screen').classList.add('hidden');
    document.getElementById('path-selection-screen').style.display = 'none';
    document.getElementById('campaign-screen').classList.remove('hidden');
}

function goBackToMenu() {
    document.getElementById('campaign-screen').classList.add('hidden');
    document.getElementById('main-menu-screen').classList.remove('hidden');
    
    // FIX: Completely hide and reset the resource bar classes
    const resBar = document.getElementById('vn-resource-bar');
    resBar.style.display = 'none';
    resBar.classList.remove('active', 'menu-mode', 'game-mode');
}

function updateResourceUI() {
    document.getElementById('res-land').innerText = playerResources.land;
    document.getElementById('res-ocean').innerText = playerResources.ocean;
    document.getElementById('res-forest').innerText = playerResources.forest;
}

function openOptions() {
    document.getElementById('options-modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
}

function openCredits() {
    document.getElementById('credits-modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
}

function closeModals() {
    document.getElementById('options-modal').style.display = 'none';
    document.getElementById('credits-modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
}