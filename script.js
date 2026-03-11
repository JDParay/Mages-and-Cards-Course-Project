const GameAudio = {
    music: {
        current: null,
        tracks: {
            menu: new Audio('audio/MainMenuBGM.m4a'),
            tutorial: new Audio('audio/TutorialBGM.m4a'),
            tutorialBoss: new Audio('audio/TutBossBGM.m4a'),
            world1: new Audio('audio/WorldOneBGM.m4a'),
            world1Boss: new Audio('audio/CorruptBGM.m4a')
        }
    },
    sfx: {
        volume: 0.5, // Default volume stored here
        tracks: {
            button: new Audio('audio/sfx_button.mp3'),
            cardDrag: new Audio('audio/sfx_drag.mp3'),
            tap: new Audio('audio/sfx_tap.mp3')
        }
    }
};

// 1. Unified Initialization
Object.values(GameAudio.music.tracks).forEach(track => {
    track.loop = true;
    track.volume = 0.8; // Set a default starting volume
});

// 2. Optimized Audio Functions
function playMusic(trackName) {
    const nextTrack = GameAudio.music.tracks[trackName];
    if (GameAudio.music.current === nextTrack) return; // Don't restart if already playing

    if (GameAudio.music.current) {
        GameAudio.music.current.pause();
        GameAudio.music.current.currentTime = 0;
    }
    
    GameAudio.music.current = nextTrack;
    GameAudio.music.current.play().catch(() => console.log("Waiting for user interaction..."));
}

function playSFX(sfxName) {
    const sound = GameAudio.sfx.tracks[sfxName].cloneNode();
    sound.volume = GameAudio.sfx.volume;
    sound.play();
}

// 3. Consolidated Slider & Volume Logic
function updateSlider(slider) {
    // Handle the Visual Fill
    const val = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    slider.style.background = `linear-gradient(to right, #4c1d95 ${val}%, #ede9fe ${val}%)`;

    // Handle the Actual Volume
    const vol = slider.value / 100;
    if (slider.id === 'bgm-slider') {
        Object.values(GameAudio.music.tracks).forEach(t => t.volume = vol);
    } else if (slider.id === 'sfx-slider') {
        GameAudio.sfx.volume = vol;
    }
}

// Attach listeners to all sliders once
document.querySelectorAll('.custom-slider').forEach(slider => {
    slider.min = 0;
    slider.max = 100;
    slider.value = 50; // Default center
    
    updateSlider(slider); // Run once to set visual state
    slider.addEventListener('input', () => updateSlider(slider));
});

// 4. Navigation & Modals
function openOptions() {
    playSFX('button');
    // 1. Show the modal and overlay
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('options-modal').style.display = 'block';
    
    document.querySelector('.screen').classList.add('is-blurred');
    document.querySelector('.waterfall-bg').classList.add('is-blurred');
}

function openCredits() {
    playSFX('button');
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('credits-modal').style.display = 'block';
    
    document.querySelector('.screen').classList.add('is-blurred');
    document.querySelector('.waterfall-bg').classList.add('is-blurred');
}

function closeModals() {
    // 1. Hide everything
    document.getElementById('modal-overlay').style.display = 'none';
    document.querySelectorAll('.modal-box').forEach(m => m.style.display = 'none');
    
    document.querySelector('.screen').classList.remove('is-blurred');
    document.querySelector('.waterfall-bg').classList.remove('is-blurred');
}

// Start Menu Music on first click
window.addEventListener('click', () => playMusic('menu'), { once: true });

function setChapterProgress(fillId, statusId, current, total) {
    const fillElement = document.getElementById(fillId);
    const statusElement = document.getElementById(statusId);
    
    if (!fillElement) return;

    // The Math: (current / total) * 100
    const percentage = (current / total) * 100;
    
    // Apply the width to the CSS
    fillElement.style.width = percentage + "%";
    
    // Update the text (e.g., "2/3 Levels")
    if (statusElement) {
        statusElement.innerText = `${current}/${total} Levels ${percentage === 100 ? '• Complete' : ''}`;
    }
}

// Inside your handleMenu function:
function handleMenu(destination) {
    if (destination === 'START') {
        // ... (your existing screen swap code) ...

        // Card 1: Finished 1 level out of 3 (33%)
        setChapterProgress('antakin-fill', 'antakin-status', 1, 3);
        
        // Card 2: Finished 3 levels out of 3 (100%)
        setChapterProgress('aelthred-fill', 'aelthred-status', 0, 3);
    }
}
function handleMenu(destination) {
    if (destination === 'START') {
        playSFX('button');
        
        // 1. Hide Menu, Show Campaign
        document.getElementById('main-menu-screen').style.display = 'none';
        document.getElementById('campaign-screen').style.display = 'flex';
        
        // 2. Change the Background Vibe
        document.querySelector('.waterfall-bg').classList.add('bg-campaign');
    }
}

function showMainMenu() {
    playSFX('button');
    document.getElementById('main-menu-screen').style.display = 'block';
    document.getElementById('campaign-screen').style.display = 'none';
    document.querySelector('.waterfall-bg').classList.remove('bg-campaign');
    playMusic('menu');
}

// Add this data object if you haven't yet!
const chapterData = {
    'antakin': {
        title: "Antakin the Protector",
        levels: [{name: "1-1: Antakin's Help"}, {name: "1-2: Antakin's Request"}, {name: "1-3: The Fate of Antakin"}]
    },
    'aelthred': {
        title: "Aelthred the Grey",
        levels: [{name: "2-1: Aelthred's Reply"}, {name: "2-2: Aelthred's Solution"}]
    }
};

function openLevelSelect(chapterKey) {
    playSFX('button');
    const data = chapterData[chapterKey];
    const chapterGrid = document.querySelector('.chapter-grid');
    const levelGrid = document.getElementById('level-grid');

    // 1. Swap visibility
    chapterGrid.style.display = 'none';
    levelGrid.style.display = 'flex';

    // 2. Update Header UI
    document.getElementById('menu-back-btn').style.display = 'none';
    document.getElementById('campaign-back-btn').style.display = 'block';
    document.getElementById('chapter-subtitle').innerText = data.title;

    // 3. Generate the cards
    levelGrid.innerHTML = ''; 
    data.levels.forEach((lvl, index) => {
        const card = document.createElement('div');
        card.className = 'level-card';
        
        // This line "escapes" the name so "Antakin's" becomes "Antakin\'s"
        const safeName = lvl.name.replace(/'/g, "\\'"); 

        card.innerHTML = `
            <img src="assets/star-bg.png">
            <div class="level-card-footer">
                <div class="level-badge">0 - ${index + 1}</div>
                <div class="play-node-btn" onclick="startLevel('${safeName}')">▶</div>
            </div>
        `;
        levelGrid.appendChild(card);
    });
}

// Switches from Campaign to VN
function startLevel(levelName) {
    console.log("Entering VN Mode for:", levelName);
    
    // 1. Hide the Campaign Map
    document.getElementById('campaign-screen').style.display = 'none';
    
    // 2. Show the VN Screen
    const vnScreen = document.getElementById('vn-screen');
    vnScreen.style.display = 'flex';
    
    // 3. Set the Level Title in the header
    document.getElementById('vn-level-title').innerText = levelName;

    // 4. Start the story logic (if you have the storyData object ready)
    if (typeof startDialogue === "function") {
        startDialogue(levelName);
    }
}

function showReadyPopup() {
    // You can use a simple alert for now, or a nice modal
    const proceed = confirm("Conversation ended. Are you ready for battle?");
    if (proceed) {
        // This is where you would trigger your Card Game logic
        console.log("Transitioning to Battle...");
        // For now, let's just go back to map and unlock next level
        userProgress.unlockedLevels++; 
        confirmQuit(); 
    }
}
// Opens the "Are you sure?" Modal
function openQuitModal() {
    playSFX('button');
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('quit-modal').style.display = 'block';
}

// Confirms quit and goes back to Campaign
function confirmQuit() {
    closeModals();
    document.getElementById('vn-screen').style.display = 'none';
    document.getElementById('campaign-screen').style.display = 'flex';
    // Optional: playMusic('menu'); 
}

function goBackToChapters() {
    const chapterGrid = document.querySelector('.chapter-grid');
    const levelGrid = document.getElementById('level-grid');

    chapterGrid.classList.remove('hidden');
    levelGrid.classList.add('hidden');
}

const storyData = {
    "1-1: Antakin's Help": [
        { type: "char", name: "???", text: "I've heard good things about you.", avatar: "assets/antakinPFP.png" },
        { 
            type: "choice", 
            options: ["Who are you?", "You know me?"],
            responses: [
                { type: "char", name: "Antakin", text: "Oh, I should've introduced myself first. Antakin the Protector.", avatar: "assets/antakinPFP.png" },
                { type: "char", name: "Antakin", text: "News travels fast in these woods, little mage.", avatar: "assets/antakinPFP.png" }
            ]
        },
        { type: "char", name: "Antakin", text: "If I’m not mistaken, you’re Heraconda’s disciple, are you not?", avatar: "assets/antakinPFP.png" },
        { type: "narrator", text: "You can't help but shiver as she mentions your deceased senior..." },
        { type: "end" }
    ]
};

let currentScene = [];
let step = 0;
let isTyping = false;
let typeSpeed = 30; // ms per character

function startLevel(levelName) {
    document.getElementById('campaign-screen').style.display = 'none';
    document.getElementById('vn-screen').style.display = 'flex';
    document.getElementById('vn-level-title').innerText = levelName;
    
    currentScene = storyData[levelName];
    step = 0;
    document.getElementById('dialogue-container').innerHTML = ''; // Clear old chat
    advanceDialogue();
}

function advanceDialogue() {
    if (isTyping) {
        fastForward();
        return;
    }

    const line = currentScene[step];
    if (!line) return;

    if (line.type === "char") {
        createDialogueBox(line);
        step++;
    } else if (line.type === "narrator") {
        showNarrator(line.text);
        step++;
    } else if (line.type === "choice") {
        showChoices(line);
    } else if (line.type === "end") {
        showReadyPopup();
    }
}

function createDialogueBox(data) {
    const container = document.getElementById('dialogue-container');
    const box = document.createElement('div');
    box.className = 'dialogue-box animate-in';
    box.innerHTML = `
        <img src="${data.avatar}" class="vn-portrait">
        <div class="vn-text-content">
            <span class="vn-name">${data.name}</span>
            <p class="vn-text"></p>
        </div>
    `;
    container.appendChild(box);
    typeWriter(box.querySelector('.vn-text'), data.text);
    container.scrollTop = container.scrollHeight;
}

function typeWriter(element, text) {
    isTyping = true;
    let i = 0;
    element.innerHTML = "";
    
    const interval = setInterval(() => {
        element.innerHTML += text.charAt(i);
        i++;
        if (i >= text.length) {
            clearInterval(interval);
            isTyping = false;
        }
    }, typeSpeed);
    
    // Simple Fast Forward storage
    element.dataset.fullText = text;
    element.dataset.intervalId = interval;
}

function fastForward() {
    const texts = document.querySelectorAll('.vn-text');
    const lastText = texts[texts.length - 1];
    clearInterval(lastText.dataset.intervalId);
    lastText.innerHTML = lastText.dataset.fullText;
    isTyping = false;
}

// Level Progression Pattern
function completeLevel(levelKey) {
    // Logic to unlock the next index in your level array
    // Example: userProgress.unlockedLevels++;
    alert("Level Complete! Ready for Battle?");
    showMainMenu(); 
}

function showChoices(data) {
    const choiceContainer = document.getElementById('choice-container');
    const buttons = choiceContainer.querySelectorAll('.choice-btn');
    
    choiceContainer.style.display = 'flex';
    
    data.options.forEach((opt, i) => {
        buttons[i].innerText = opt;
        buttons[i].style.display = 'block';
    });
    
    // Hide the 'Next' indicator so they MUST choose
    document.querySelector('.next-indicator').style.display = 'none';
}

function makeChoice(index) {
    playSFX('button');
    const choiceContainer = document.getElementById('choice-container');
    choiceContainer.style.display = 'none';
    document.querySelector('.next-indicator').style.display = 'block';
    
    // Inject the specific response from the data
    const choiceData = currentScene[step]; // This is the 'choice' object
    createDialogueBox(choiceData.responses[index]);
    
    step++; // Move to the next line in the story
}

// Global listener for progression
window.addEventListener('keydown', (e) => {
    if (document.getElementById('vn-screen').style.display === 'flex') {
        advanceDialogue();
    }
});

window.addEventListener('mousedown', (e) => {
    // Prevent clicking if a choice is active or if clicking the settings gear
    const choiceVisible = document.getElementById('choice-container').style.display === 'flex';
    const isButton = e.target.tagName === 'BUTTON' || e.target.closest('button');
    
    if (document.getElementById('vn-screen').style.display === 'flex' && !choiceVisible && !isButton) {
        advanceDialogue();
    }
});
