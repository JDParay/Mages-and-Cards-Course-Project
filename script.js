const GameAudio = {
    // Background Music Tracks
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
    // Sound Effects
    sfx: {
        button: new Audio('audio/sfx_button.mp3'),
        cardDrag: new Audio('audio/sfx_drag.mp3'),
        tap: new Audio('audio/sfx_tap.mp3')
    }
};

// Set all music to loop
Object.values(GameAudio.music.tracks).forEach(track => track.loop = true);

// Function to change music
function playMusic(trackName) {
    if (GameAudio.music.current) {
        GameAudio.music.current.pause();
        GameAudio.music.current.currentTime = 0;
    }
    GameAudio.music.current = GameAudio.music.tracks[trackName];
    GameAudio.music.current.play().catch(() => {
        console.log("Autoplay blocked. Music will start after first click.");
    });
}

// Function to play SFX
function playSFX(sfxName) {
    const sound = GameAudio.sfx[sfxName].cloneNode(); // Allows overlapping sounds
    sound.volume = GameAudio.sfx.volume;
    sound.play();
}


function handleMenu(destination) {
  console.log("Navigating to: " + destination);
  
  if(destination === 'START') {
    alert("Loading Chapter Select...");
    // This is where you'd swap the HTML to show your Chapter Select screen
  }
}

function openOptions() {
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('options-modal').style.display = 'block';
}

function openCredits() {
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('credits-modal').style.display = 'block';
}

function closeModals() {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('options-modal').style.display = 'none';
    document.getElementById('credits-modal').style.display = 'none';
}

document.querySelectorAll('input[name="gfx"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const pattern = document.querySelector('.body-before-selector'); // your background class
        if (e.target.value === 'low') {
            pattern.style.display = 'none'; // Save performance
        } else {
            pattern.style.display = 'block';
        }
    });
});

function updateSliderFill(slider) {
    const val = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    slider.style.background = `linear-gradient(to right, #4c1d95 ${val}%, #ede9fe ${val}%)`;
}

// Initialize sliders on load
document.querySelectorAll('.custom-slider').forEach(slider => {
    updateSliderFill(slider);
    slider.addEventListener('input', () => updateSliderFill(slider));
});
