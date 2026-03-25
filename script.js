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
    // CHAPTER 1: THE AWAKENING
    "ch1_start": {
        text: "The Great Barrier has cracked. Mana leaks into the world. You must stabilize a region, but you only have enough strength for one.",
        choices: [
            { text: "Heal the Scorched Earth (Gain 2 Land)", next: "ch1_land_path", reward: { land: 2 } },
            { text: "Purify the Corrupted Spring (Gain 2 Ocean)", next: "ch1_ocean_path", reward: { ocean: 2 } },
            { text: "Use Ancient Rites (Costs 3 Land, 3 Ocean)", next: "ch1_secret_end", required: { land: 3, ocean: 3 } }
        ]
    },
    "ch1_land_path": {
        text: "The ground stops trembling. You find a strange seed in the dirt. It feels heavy with potential.",
        choices: [{ text: "Enter the Deep Forest", next: "ch2_start" }]
    },
    "ch1_ocean_path": {
        text: "The waters clear, revealing an old sunken shrine. You feel the pull of the tides.",
        choices: [{ text: "Follow the River", next: "ch2_start" }]
    },
    "ch1_secret_end": {
        text: "[HIDDEN PATH] You balanced both! The elders are stunned. You gain massive Forest affinity.",
        choices: [{ text: "Ascend to Chapter 2", next: "ch2_start", reward: { forest: 10 } }]
    },

    // CHAPTER 2: THE WHISPERING WOODS
    "ch2_start": {
        text: "You arrive at the Whispering Woods. The trees are screaming in a language only Mages understand.",
        choices: [
            { text: "Listen to the Forest (Gain 3 Forest)", next: "ch2_normal", reward: { forest: 3 } },
            { text: "Burn the corruption (Costs 5 Ocean)", next: "ch2_burn", required: { ocean: 5 } }
        ]
    },
    "ch2_burn": {
        text: "The fire cleanses the rot, but the Forest hates you now. You found a charred Land artifact.",
        choices: [{ text: "Move to Chapter 3", next: "ch3_start", reward: { land: 5 } }]
    },

    // ... Add more nodes following this structure until 3 chapters are full ...
    "ch3_start": {
        text: "The final trial begins. The resources you gathered will determine your fate.",
        choices: [
            { text: "Standard Ending", next: "end_normal" },
            { text: "True Balance Ending (Needs 10 All)", next: "end_true", required: { land: 10, ocean: 10, forest: 10 } }
        ]
    },
    "end_normal": { text: "You survived, but the world remains scarred. (Try gathering more resources in your next run!)", choices: [] },
    "end_true": { text: "The world is reborn in perfect harmony. You are the Arch-Mage.", choices: [] }
};

/* ==========================================
   3. THE ENGINE (Rendering & Logic)
   ========================================== */
function startVN() {
    // Hide menus
    document.getElementById('main-menu-screen').classList.add('hidden');
    document.getElementById('campaign-screen').classList.add('hidden');
    
    // Show Resource Bar and VN Screen
    document.getElementById('vn-resource-bar').style.display = 'flex';
    document.getElementById('vn-game-screen').style.display = 'flex';
    document.getElementById('vn-game-screen').classList.remove('hidden');
    
    updateResourceUI();
    renderNode("ch1_start");
}


function renderNode(nodeId) {
    const node = storyData[nodeId];
    if (!node) return;

    const textEl = document.getElementById('story-text');
    const choiceEl = document.getElementById('choice-container');

    // Typewriter effect (simplified for deadline)
    textEl.innerText = node.text;
    choiceEl.innerHTML = ''; 

    node.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'game-btn';
        btn.innerHTML = choice.text;

        // Resource Validation
        let canUnlock = true;
        if (choice.required) {
            for (const [res, amt] of Object.entries(choice.required)) {
                if (playerResources[res] < amt) {
                    canUnlock = false;
                    btn.innerHTML += ` <br><small>(Needs ${amt} ${res})</small>`;
                }
            }
        }

        if (!canUnlock) {
            btn.disabled = true;
            btn.style.opacity = "0.4";
            btn.style.cursor = "not-allowed";
        } else {
            btn.onclick = () => {
                playSFX('tap');
                // Apply rewards
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