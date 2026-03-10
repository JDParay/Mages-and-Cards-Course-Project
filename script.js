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
    track.volume = 0.5; // Set a default starting volume
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
    
    document.querySelector('.menu-screen').classList.add('is-blurred');
    document.querySelector('.waterfall-bg').classList.add('is-blurred');
}

function openCredits() {
    playSFX('button');
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('credits-modal').style.display = 'block';
    
    document.querySelector('.menu-screen').classList.add('is-blurred');
    document.querySelector('.waterfall-bg').classList.add('is-blurred');
}

function closeModals() {
    // 1. Hide everything
    document.getElementById('modal-overlay').style.display = 'none';
    document.querySelectorAll('.modal-box').forEach(m => m.style.display = 'none');
    
    document.querySelector('.menu-screen').classList.remove('is-blurred');
    document.querySelector('.waterfall-bg').classList.remove('is-blurred');
}

// Start Menu Music on first click
window.addEventListener('click', () => playMusic('menu'), { once: true });

function handleMenu(destination) {
    if (destination === 'START') {
        playSFX('button');
        
        // 1. Hide Menu, Show Campaign
        document.getElementById('main-menu-screen').style.display = 'none';
        document.getElementById('campaign-screen').style.display = 'block';
        
        // 2. Change the Background Vibe
        document.querySelector('.waterfall-bg').classList.add('bg-campaign');
        
        // 3. Swap Music
        playMusic('tutorial'); 
    }
}

function showMainMenu() {
    playSFX('button');
    document.getElementById('main-menu-screen').style.display = 'block';
    document.getElementById('campaign-screen').style.display = 'none';
    document.querySelector('.waterfall-bg').classList.remove('bg-campaign');
    playMusic('menu');
}
