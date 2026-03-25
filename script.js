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
const storyData = {
    "ch1_start": {
        text: "The Great Barrier has cracked. Mana leaks into the world like bleeding light, staining the sky a bruised purple.",
        uiType: "narrative",
        next: "mage_intro"
    },
    "mage_intro": {
        mageName: "ELDER MAGE",
        mageText: "You there! Do not just stand there watching the mana bleed away. The foundations of this world are brittle.",
        uiType: "mage",
        next: "response_options"
    },
    "response_options": {
        text: "How do you respond to the Elder's call?",
        uiType: "standard",
        choices: [
            { text: "I am ready to help. What must be done?", next: "mage_explains" },
            { text: "Who are you to command me?", next: "mage_annoyed" }
        ]
    },
    "mage_explains": {
        mageName: "ELDER MAGE",
        mageText: "A rift has opened in the Valley. Use your cards to stabilize the land before the corruption takes root.",
        uiType: "mage",
        next: "valley_card_choice"
    },
    "valley_card_choice": {
        text: "The ground splits beneath you! Choose a card to play:",
        uiType: "cards",
        choices: [
            { text: "Earth Aegis", next: "ch1_end", reward: { land: 5 } },
            { text: "Tidal Surge", next: "ch1_end", reward: { ocean: 5 } }
        ]
    },
    "ch1_end": {
        text: "The rift closes. For now, the world is quiet. You have taken your first step.",
        uiType: "narrative",
        next: "main_menu"
    }
};

/* ==========================================
   ENGINE LOGIC
   ========================================== */
let typeTimeout;
let currentFullText = "";
let gameHistory = [];
let playerResources = { land: 0, ocean: 0, forest: 0 };
let isTyping = false;
let currentNode = null;
let unlockedNodes = ["ch1_start"];

function updateBGMVolume(vol) {
    for (let track in GameAudio.music.tracks) {
        GameAudio.music.tracks[track].volume = vol;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const bgmSlider = document.getElementById('bgm-slider');
    const sfxSlider = document.getElementById('sfx-slider');

    if (bgmSlider) {
        bgmSlider.addEventListener('input', (e) => updateBGMVolume(e.target.value));
    }
    if (sfxSlider) {
        sfxSlider.addEventListener('input', (e) => GameAudio.sfx.volume = e.target.value);
    }
});

function updateMapUI() {
    const nodes = document.querySelectorAll('.path-node');
    nodes.forEach(node => {
        // Extract nodeId from the onclick string, e.g., "startVN('ch1_start')" -> "ch1_start"
        const clickAttr = node.getAttribute('onclick');
        const nodeId = clickAttr.match(/'([^']+)'/)[1];

        if (unlockedNodes.includes(nodeId)) {
            node.classList.remove('locked');
        } else {
            node.classList.add('locked');
        }
    });
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
    // FIX: Instead of reload, go back to the map and stop music
    if (nodeId === "main_menu") {
        playMusic('menu'); // Switch back to menu music
        
        document.getElementById('vn-game-screen').classList.add('hidden');
        document.getElementById('vn-game-screen').style.display = 'none';
        
        // Show the map again
        const pathScreen = document.getElementById('path-selection-screen');
        pathScreen.classList.remove('hidden');
        pathScreen.style.display = 'flex';

        // Reset resource bar to menu mode (top right)
        const resBar = document.getElementById('vn-resource-bar');
        resBar.classList.remove('game-mode');
        resBar.classList.add('menu-mode');
        return;
    }

    currentNode = storyData[nodeId];
    if (!currentNode) return;

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
            btn.innerHTML = choice.text;
            btn.onclick = (e) => {
                e.stopPropagation(); 
                // PERSISTENCE: Resources are updated here and not wiped
                if (choice.reward) {
                    for (const [res, amt] of Object.entries(choice.reward)) {
                        playerResources[res] += amt;
                    }
                    updateResourceUI();
                }
                addToLog("YOU", choice.text);
                renderNode(choice.next);
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

    // UNLOCK LOGIC: 
    // If player finished ch1_start, unlock BOTH branches for the demo
    if (!unlockedNodes.includes("ch1_scorched")) {
        unlockedNodes.push("ch1_scorched", "ch1_spring");
    }

    updateMapUI(); 
    return;
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
    const resBar = document.getElementById('vn-resource-bar');
    resBar.classList.add('active', 'menu-mode');
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
    document.getElementById('vn-resource-bar').style.display = 'none';
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