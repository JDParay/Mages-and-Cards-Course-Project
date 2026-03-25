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

// Enable looping for background music
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
    GameAudio.music.current.play().catch(() => console.log("User interaction required for audio"));
}

function playSFX(sfxName) {
    const sound = GameAudio.sfx.tracks[sfxName].cloneNode();
    sound.volume = GameAudio.sfx.volume;
    sound.play();
}

window.addEventListener('click', () => playMusic('menu'), { once: true });


let playerResources = { land: 0, ocean: 0, forest: 0 };

const storyData = {
    // CHAPTER 1
    "ch1_start": {
        text: "The Great Barrier has cracked. Mana leaks into the world like bleeding light.",
        type: "dialogue",
        next: "ch1_intro_2"
    },
    "ch1_intro_2": {
        text: "You stand at the precipice. You must stabilize a region, but your strength is fading.",
        type: "choice",
        choices: [
            { text: "Heal the Scorched Earth", next: "ch1_land_path", reward: { land: 2 } },
            { text: "Purify the Corrupted Spring", next: "ch1_ocean_path", reward: { ocean: 2 } }
        ]
    },
    // CHAPTER 2 (Unlocked via Menu or Path)
    "ch2_start": {
        text: "The Whispering Woods loom ahead. The trees scream in a language of rustling leaves.",
        type: "dialogue",
        next: "ch2_choice_1"
    },
    "ch2_choice_1": {
        text: "The corruption is thick here. How will you proceed?",
        type: "choice",
        choices: [
            { text: "Listen to the Forest", next: "ch2_end", reward: { forest: 3 } },
            { text: "Burn the Rot", next: "ch2_end", reward: { land: 5 }, required: { ocean: 5 } }
        ]
    },
    "ch2_end": { text: "You push deeper into the unknown...", type: "dialogue", next: "main_menu" }
};

/* ==========================================
   3. THE ENGINE (Rendering & Logic)
   ========================================== */
let currentNode = "";

function startVN(nodeId = "ch1_start") {
    document.getElementById('main-menu-screen').classList.add('hidden');
    document.getElementById('campaign-screen').classList.add('hidden');
    
    document.getElementById('vn-resource-bar').style.display = 'flex';
    document.getElementById('vn-game-screen').style.display = 'flex';
    document.getElementById('vn-game-screen').classList.remove('hidden');
    
    updateResourceUI();
    renderNode(nodeId);
}

function renderNode(nodeId) {
    currentNode = nodeId;
    const node = storyData[nodeId];
    if (!node) return;

    const textEl = document.getElementById('story-text');
    const choiceEl = document.getElementById('choice-container');
    const storyBox = document.getElementById('story-box');

    // Reset UI
    textEl.innerText = node.text;
    choiceEl.innerHTML = '';
    storyBox.onclick = null;
    storyBox.style.cursor = "default";

    if (node.type === "dialogue") {
        // Dialogue Phase: Click the box to advance
        storyBox.style.cursor = "pointer";
        storyBox.onclick = () => {
            playSFX('tap');
            if (node.next === "main_menu") {
                goBackToMenu();
            } else {
                renderNode(node.next);
            }
        };
        // Hint for the player
        choiceEl.innerHTML = `<p style="color:rgba(255,255,255,0.5)">[ Click text to continue ]</p>`;
        
    } else if (node.type === "choice") {
        // Choice Phase: Show Cards
        node.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'game-btn';
            btn.innerHTML = `<span>${choice.text}</span>`;

            // Resource Validation
            let canUnlock = true;
            if (choice.required) {
                for (const [res, amt] of Object.entries(choice.required)) {
                    if (playerResources[res] < amt) {
                        canUnlock = false;
                        btn.innerHTML += `<br><small style="color:#ff4444">(Needs ${amt} ${res})</small>`;
                    }
                }
            }

            if (!canUnlock) {
                btn.disabled = true;
                btn.classList.add('locked-choice');
            } else {
                btn.onclick = (e) => {
                    e.stopPropagation(); // Prevent trigger dialogue click
                    playSFX('tap');
                    if (choice.reward) {
                        for (const [res, amt] of Object.entries(choice.reward)) {
                            playerResources[res] += amt;
                        }
                        updateResourceUI();
                    }
                    renderNode(choice.next);
                };
            }
            choiceEl.appendChild(btn);
        });
    }
}

// Level Selector Logic
function selectChapter(chapterId) {
    playSFX('button');
    if (chapterId === 1) startVN("ch1_start");
    if (chapterId === 2) startVN("ch2_start");
}

function updateResourceUI() {
    document.getElementById('res-land').innerText = playerResources.land;
    document.getElementById('res-ocean').innerText = playerResources.ocean;
    document.getElementById('res-forest').innerText = playerResources.forest;
}

function handleMenu(destination) {
    // playSFX('button');
    if (destination === 'START') {
        startVN();
    }
}

function showCampaign() {
    // playSFX('button');
    document.getElementById('main-menu-screen').classList.add('hidden');
    document.getElementById('campaign-screen').classList.remove('hidden');
}

function goBackToMenu() {
    // playSFX('button');
    document.getElementById('campaign-screen').classList.add('hidden');
    document.getElementById('main-menu-screen').classList.remove('hidden');
}

function openOptions() {
    // playSFX('button');
    document.getElementById('options-modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
}

function openCredits() {
    // playSFX('button');
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('credits-modal').style.display = 'block';
}

function closeModals() {
    // playSFX('button');
    document.getElementById('options-modal').style.display = 'none';
    document.getElementById('credits-modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
}