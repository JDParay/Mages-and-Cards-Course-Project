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
        levels: [{name: "1-1: The Ritual"}, {name: "1-2: Ambush"}, {name: "1-3: Final Stand"}]
    },
    'aelthred': {
        title: "Aelthred the Grey",
        levels: [{name: "2-1: Frozen Path"}, {name: "2-2: Cave of Echoes"}]
    }
};

function openLevelSelect(chapterKey) {
    const data = chapterData[chapterKey];
    
    // Hide Chapters, Show Levels
    document.querySelector('.chapter-grid').style.display = 'none';
    document.getElementById('level-grid').style.display = 'flex';
    
    // UI Swap: Show "Back to Chapters" button, hide "Back to Menu"
    document.getElementById('campaign-back-btn').style.display = 'block';
    document.getElementById('menu-back-btn').style.display = 'none';
    document.getElementById('chapter-subtitle').innerText = data.title;
    
    const levelGrid = document.getElementById('level-grid');
    levelGrid.innerHTML = ''; 
    data.levels.forEach((lvl, index) => {
        const card = document.createElement('div');
        card.className = 'level-card';
        card.innerHTML = `
            <img src="assets/star-bg.png">
            <div class="level-card-footer">
                <div class="level-badge">0 - ${index + 1}</div>
                <div class="play-node-btn" onclick="startLevel('${lvl.name}')">▶</div>
            </div>
        `;
        levelGrid.appendChild(card);
    });
}

function goBackToChapters() {
    document.querySelector('.chapter-grid').style.display = 'flex';
    document.getElementById('level-grid').style.display = 'none';
    
    // UI Swap: Show "Menu" button, hide "Back to Chapters"
    document.getElementById('campaign-back-btn').style.display = 'none';
    document.getElementById('menu-back-btn').style.display = 'block';
    document.getElementById('chapter-subtitle').innerText = "Select a Chapter";
}
