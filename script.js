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
    document.getElementById('modal-overlay').style.display = 'none';
    
    // Hide ALL modal boxes
    const allModals = document.querySelectorAll('.modal-box');
    allModals.forEach(m => {
        m.style.setProperty('display', 'none', 'important');
    });
    
    // Remove blur
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('is-blurred'));
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

        setChapterProgress('antakin-fill', 'antakin-status', 1, 3);

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

    if (GameAudio.music.current !== GameAudio.music.tracks.menu) {
        playMusic('menu');
    }
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

function showReadyPopup() {
    const proceed = confirm("Conversation ended. Are you ready for battle?");
    if (proceed) {
        // This is where you would trigger your Card Game logic
        console.log("Transitioning to Battle...");
        // For now, let's just go back to map and unlock next level
        userProgress.unlockedLevels++; 
        confirmQuit(); 
    }
}

function skipDialogue() {
    // If text is currently typing, finish the line instantly
    if (isTyping) {
        fastForward();
    }

    // Loop through the scene until we hit a choice or the end
    while (step < currentScene.length) {
        const nextLine = currentScene[step];

        // STOP skipping if we hit a choice or the end of the scene
        if (nextLine.type === "choice" || nextLine.type === "end") {
            advanceDialogue(); 
            break; 
        }

        // Render line instantly without typewriter effects
        if (nextLine.type === "char") {
            renderInstantDialogue(nextLine);
        } else if (nextLine.type === "narrator") {
            renderInstantNarrator(nextLine.text);
        }
        
        step++;
    }
}

function renderInstantDialogue(data) {
    const container = document.getElementById('dialogue-container');
    const box = document.createElement('div');
    box.className = 'dialogue-box animate-in';
    box.innerHTML = `
        <img src="${data.avatar}" class="vn-portrait">
        <div class="vn-text-content">
            <span class="vn-name">${data.name}</span>
            <p class="vn-text">${data.text}</p>
        </div>
    `;
    container.appendChild(box);
    container.scrollTop = container.scrollHeight;
}

function renderInstantNarrator(text) {
    const container = document.getElementById('dialogue-container');
    const narratorDiv = document.createElement('div');
    narratorDiv.className = 'narrator-entry animate-in';
    narratorDiv.innerHTML = `<p class="vn-narrator-text">${text}</p>`;
    container.appendChild(narratorDiv);
    container.scrollTop = container.scrollHeight;
}
// Opens the "Are you sure?" Modal
function openQuitModal() {
    playSFX('button');
    document.getElementById('modal-overlay').style.display = 'block';
    
    const quitModal = document.getElementById('quit-modal');
    // Switch from 'none' to 'flex'
    quitModal.style.setProperty('display', 'flex', 'important');
    
    // Add blur to background
    document.querySelector('.screen').classList.add('is-blurred');
}
// Confirms quit and goes back to Campaign
function confirmQuit() {
    closeModals();
    document.getElementById('vn-screen').style.display = 'none';
    document.getElementById('campaign-screen').style.display = 'flex';
    // Optional: playMusic('menu'); 
}

function goBackToChapters() {
    playSFX('button');
    const chapterGrid = document.querySelector('.chapter-grid');
    const levelGrid = document.getElementById('level-grid');

    // 1. THE SWAP BACK: Show chapters, hide levels
    chapterGrid.style.display = 'flex';
    levelGrid.style.display = 'none';

    // 2. Reset Header UI
    document.getElementById('menu-back-btn').style.display = 'block';
    document.getElementById('campaign-back-btn').style.display = 'none';
    document.getElementById('chapter-subtitle').innerText = "Select a Chapter";
}

const storyData = {
    "1-1: Antakin's Help": [
        { type: "char", name: "???", text: "I've heard good things about you.", avatar: "assets/antakinPFP.png" },
        { 
            type: "choice", 
            options: ["Who are you?", "You know me?"],
            responses: [
                { type: "char", name: "???", text: "Oh, I should've introduced myself first.", avatar: "assets/antakinPFP.png" },
                { type: "char", name: "???", text: "Why of course, little mage. I'm no stranger to a colleague's apprentice.", avatar: "assets/antakinPFP.png" }
            ]
        },
        { type: "char", name: "Antakin", text: "I'm Antakin the Protector, but the woods call me Antakin.", avatar: "assets/antakinPFP.png" },
        { type: "char", name: "Antakin", text: "If I’m not mistaken, you’re Heraconda’s disciple, are you not?", avatar: "assets/antakinPFP.png" },
        { type: "narrator", text: "You can't help but shiver as she mentions your deceased senior..." },
        { 
            type: "choice", 
            options: ["Yes I am.","I think so."],
            responses: [
                { type: "char", name: "Antakin", text: "Sigh, it is such a shame for her to pass so soon.", avatar: "assets/antakinPFP.png" },
                { type: "char", name: "Antakin", text: "Sigh, it is such a shame for her to pass so soon.", avatar: "assets/antakinPFP.png" }
            ]
        },
        { type: "char", name: "Antakin", text: "And now I have to fulfill her wishes, as a very good friend of hers.", avatar: "assets/antakinPFP.png" },
        { 
            type: "choice", 
            options: ["Wish?","What wish?"],
            responses: [
                { type: "char", name: "Antakin", text: "To make you, her predecessor!", avatar: "assets/antakinPFP.png" },
                { type: "char", name: "Antakin", text: "To make you, her predecessor!", avatar: "assets/antakinPFP.png" },
            ]
        },
        { type: "char", name: "Antakin", text: "A bit of a challenge, if you ask me... She did share you're a bit... unexperienced.", avatar: "assets/antakinPFP.png" },
        { type: "narrator", text: "She's not wrong, you are still learning about the practive of Mana Cards." },
        { type: "narrator", text: "Without a beat, Antakin reveals a pack of cards right in front of you, urging you to take it." },
        { type: "char", name: "Antakin", text: "The best way to learn is to experience it, so shall we?", avatar: "assets/antakinPFP.png" },
        { type: "char", name: "Antakin", text: "Now don't you worry, dear. This should be easy as warts pie.", avatar: "assets/antakinPFP.png" },
        { type: "end" }
    ]
};

let currentScene = [];
let step = 0;
let isTyping = false;
let typeSpeed = 30; // ms per character
let discardUsed = false

function startLevel(levelName) {
    // 1. Switch screens immediately
    document.getElementById('campaign-screen').style.display = 'none';
    const vnScreen = document.getElementById('vn-screen');
    vnScreen.style.display = 'flex';
    
    // 2. Ensure UI elements are visible and reset (No fade-in)
    const vnHeader = document.getElementById('vn-header');
    vnHeader.style.opacity = "1"; // Set to 1 immediately
    
    document.getElementById('skip-btn').style.display = 'block';
    document.getElementById('battle-start-container').style.display = 'none';

    // 3. Reset Level Data
    document.getElementById('vn-level-title').innerText = levelName;
    currentScene = storyData[levelName];
    step = 0;
    
    // Clear old chat
    document.getElementById('dialogue-container').innerHTML = ''; 
    
    // 4. Start dialogue immediately without delay
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
        // Instead of a browser confirm(), show the Battle Button and hide Skip
        document.getElementById('skip-btn').style.display = 'none';
        document.getElementById('battle-start-container').style.display = 'flex';
        
        // Optional: Auto-scroll to ensure button is visible
        const container = document.getElementById('dialogue-container');
        container.scrollTop = container.scrollHeight;
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
    isTyping = false; // Stop any accidental fast-forwarding

    data.options.forEach((opt, i) => {
        buttons[i].innerText = opt;
        buttons[i].style.display = 'block';
        buttons[i].classList.remove('selected', 'dimmed'); // Reset states
    });
}

function makeChoice(index) {
    const choiceContainer = document.getElementById('choice-container');
    const choiceData = currentScene[step]; // The choice object from storyData
    const selectedText = choiceData.options[index];

    // 1. Hide the interactive buttons
    choiceContainer.style.display = 'none';

    // 2. Inject the PLAYER'S choice into the conversation log
    const container = document.getElementById('dialogue-container');
    const playerBox = document.createElement('div');
    playerBox.className = 'dialogue-box player-choice-box animate-in';
    playerBox.innerHTML = `
        <div class="vn-text-content">
            <span class="vn-name">You</span>
            <p class="vn-text">${selectedText}</p>
        </div>
    `;
    container.appendChild(playerBox);
    
    // 3. Auto-scroll to show your choice
    container.scrollTop = container.scrollHeight;

    // 4. Delay the NPC's response slightly for a natural feel
    isTyping = true; // Block clicking during the "thinking" pause
    setTimeout(() => {
        isTyping = false;
        createDialogueBox(choiceData.responses[index]);
        step++; 
    }, 600); 
}

// Global listener for progression
window.addEventListener('mousedown', (e) => {
    const vnVisible = document.getElementById('vn-screen').style.display === 'flex';
    const choiceVisible = document.getElementById('choice-container').style.display === 'flex';
    
    // Ensure we aren't clicking a button or an active choice menu
    if (vnVisible && !choiceVisible && !e.target.closest('button') && !e.target.closest('.choice-btn')) {
        advanceDialogue();
    }
});

function showNarrator(text) {
    const container = document.getElementById('dialogue-container');
    const narratorDiv = document.createElement('div');
    narratorDiv.className = 'narrator-entry animate-in';
    narratorDiv.innerHTML = `<p class="vn-narrator-text"></p>`;
    
    container.appendChild(narratorDiv);
    
    // Use the typewriter on the narrator text
    const textElement = narratorDiv.querySelector('.vn-narrator-text');
    typeWriter(textElement, text);
    
    container.scrollTop = container.scrollHeight;
}

function showReadyPopup() {
    // Standard browser popup
    const proceed = confirm("Conversation ended. Are you ready for battle?");
    
    if (proceed) {
        // Trigger the battle logic
        startGameplay(); 
    } else {
        // If they hit cancel, they just stay on the VN screen 
        // Or you can use confirmQuit() if you want them to go back to map
        console.log("User canceled battle.");
    }
}

let enemyDeck=[]
let enemyHand=[]
let deck = [];
let discardPile = [];
let handSize = 3;
let battleData = {
    playerMana: 100,
    enemyMana: 100,
    maxMana: 100,
    resources: {
        forest: 10,
        ocean: 10,
        land: 10
    }
};


function startGameplay() {
    // Switch Screens
    document.getElementById('vn-screen').style.display = 'none';
    document.getElementById('battle-screen').style.display = 'flex';

    enemyHand = [
        wrathCards[0], 
        wrathCards[1]
    ];
    
    playMusic('tutorial');
    initBattle();
}

function initBattle() {
    battleData.playerMana = 100;
    battleData.enemyMana = 100;
    battleData.maxMana = 100;
    battleData.resources = { forest: 10, ocean: 10, land: 10};
    
    document.getElementById('player-hand').innerHTML = ''; // Reset hand
    updateBattleUI();
    drawHand();
}

let isPlayerTurn = true;

function endTurn() {
    if (!isPlayerTurn) return; // prevent multiple clicks
    isPlayerTurn = false;
    startEnemyTurn();
}

function endEnemyTurn() {
    logBattle("Your turn!");
    isPlayerTurn = true;
    discardUsed = false;

    // Player Regen
    battleData.playerMana = Math.min(battleData.maxMana, battleData.playerMana + 5);
    // Enemy Regen
    battleData.enemyMana = Math.min(battleData.maxMana, battleData.enemyMana + 5);
    
    drawHand(); 
    updateBattleUI(); // <--- Ensure this is here to refresh the bars and numbers
}

function updateBattleUI() {
    // Health
    document.getElementById('player-hp-val').innerText = battleData.playerMana;
    document.getElementById('enemy-hp-val').innerText = battleData.enemyMana;
    document.getElementById('player-hp-fill').style.width = (battleData.playerMana / battleData.maxMana * 100) + "%";
    document.getElementById('enemy-hp-fill').style.width = (battleData.enemyMana / battleData.maxMana * 100) + "%";

    // Resources
    document.getElementById('res-forest').innerText = battleData.resources.forest;
    document.getElementById('res-ocean').innerText = battleData.resources.ocean;
    document.getElementById('res-land').innerText = battleData.resources.land;

    checkAffordability();
}

function checkAffordability(){

const cards=document.querySelectorAll('.card')

cards.forEach(cardEl=>{

const card=JSON.parse(cardEl.dataset.card)

if(!canAfford(card)){
cardEl.classList.add("disabled")
}else{
cardEl.classList.remove("disabled")
}

})

}

function spendResources(costs){

for(const [res,val] of Object.entries(costs)){

if(res==="mana"){
battleData.playerMana -= val
}else{
battleData.resources[res] -= val
}

}

}

function discardCard(card,element){

if(discardUsed){
logBattle("Discard already used this turn")
return
}

discardUsed = true

discardPile.push(card)
element.remove()

drawHand()

}

function checkGameState(){

if(battleData.playerMana <= 0){
alert("You lost!");
confirmQuit();
}

if(battleData.enemyMana <= 0){
alert("You win!");
confirmQuit();
}

if(
battleData.resources.forest <=0 &&
battleData.resources.ocean <=0 &&
battleData.resources.land <=0
){
alert("All resources depleted. You lose.");
confirmQuit();
}

}

function drawHand() {
    const hand = document.getElementById('player-hand');
    while (hand.children.length < 3) {
        const card = cardTypes[Math.floor(Math.random() * cardTypes.length)];
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        
        // 1. Generate cost badges
        let costHTML = '<div class="cost-container">';
        for (const [res, amt] of Object.entries(card.costs)) {
            costHTML += `<div class="mini-cost cost-${res}">${amt}</div>`;
        }
        costHTML += '</div>';

        // 2. SMART DESCRIPTION LOGIC
        let description = "";
        if (card.type === 'attack') {
            description = `${card.damage} DMG`;
        } else if (card.type === 'gen') {
            // This turns {forest: 2} into "Gains 2 forest"
            const resName = Object.keys(card.effect)[0];
            const amount = card.effect[resName];
            description = `+${amount} ${resName}`;
        } else {
            description = card.desc || "Special";
        }

        cardEl.innerHTML = `
            ${costHTML}
            <span class="card-icon">${card.icon}</span>
            <strong class="card-name">${card.name}</strong>
        
            <div class="card-hover-desc">
                ${description}
            </div>
        `;
        
        cardEl.onclick = () => playCard(card, cardEl);
        hand.appendChild(cardEl);

        cardEl.dataset.card = JSON.stringify(card);
    }
}

function canAfford(card) {
    for (const [res, amount] of Object.entries(card.costs)) {
        if (res === 'mana') {
            if (battleData.playerMana < amount) return false;
        } else {
            if ((battleData.resources[res] || 0) < amount) return false;
        }
    }
    return true;
}

function playCard(card, element) {
    if (!canAfford(card)) {
        logBattle("Insufficient resources!");
        return;
    }

    // Deduct Costs
    for (const [res, amount] of Object.entries(card.costs)) {
        if (res === 'mana') battleData.playerMana -= amount;
        else battleData.resources[res] -= amount;
    }

    // Effects
    if (card.type === 'attack') {
        battleData.enemyMana -= card.damage;
        logBattle(`Used ${card.name}! Dealt ${card.damage} DMG.`);
    } else if (card.type === 'gen') {
    for (const [res, amt] of Object.entries(card.effect)) {
        battleData.resources[res] += amt;
        logBattle(`Gained ${amt} ${res}!`);
    } else if (card.type === 'mana-gen') {
        battleData.playerMana = Math.min(battleData.maxMana, battleData.playerMana + card.amount);
        logBattle(`Used ${card.name}! Restored ${card.amount} Mana.`);
    }
}

    element.remove();
    updateBattleUI();
    if (battleData.enemyMana <= 0) winBattle();
}

function startEnemyTurn() {
    logBattle("Enemy thinking...");

    setTimeout(() => {
        // 1. Find a card the enemy can afford
        let cardToPlay = enemyHand.find(c => canAfford(c));

        if (cardToPlay) {
            playEnemyCard(cardToPlay);
        } else {
            enemyHarmonyRecovery();
        }

        setTimeout(() => {
            endEnemyTurn();
        }, 1000);
        
    }, 1500);
}
function enemyHarmonyRecovery(){

if(battleData.enemyMana >= 30){

battleData.enemyMana -= 30

battleData.resources.forest++
battleData.resources.ocean++
battleData.resources.land++

logBattle("Enemy restores the world balance.")

}

}

function playEnemyCard(card) {
    // Deduct Costs from Enemy
    for (const [res, amount] of Object.entries(card.costs)) {
        if (res === 'mana') battleData.enemyMana -= amount;
        else battleData.resources[res] -= amount;
    }

    battleData.playerMana -= card.damage;
    logBattle(`Enemy used ${card.name}! You took ${card.damage} DMG.`);
    
    updateBattleUI();
}

function logBattle(msg) {
    document.getElementById('battle-log').innerText = msg;
}

function shuffleDeckCost(){

if(battleData.playerMana < 10){
logBattle("Not enough mana to shuffle")
return
}

battleData.playerMana -= 10

deck = deck.concat(discardPile)
discardPile = []

shuffleDeck()

logBattle("Deck reshuffled")

}

function shuffleDeck(){

for(let i=deck.length-1;i>0;i--){

let j=Math.floor(Math.random()*(i+1))

[deck[i],deck[j]]=[deck[j],deck[i]]

}

}

const wrathCards = [
{
name:"Magma Shot",
type:"attack",
damage:25,
icon:"🔥",
costs:{land:2, ocean:1}
},

{
name:"Tsunami",
type:"attack",
damage:40,
icon:"🌊",
costs:{ocean:5}
},

{
name:"Storm Cloud",
type:"attack",
damage:30,
icon:"🌪",
costs:{ocean:3,land:1}
},

{
name:"Canyon Former",
type:"attack",
damage:50,
icon:"💀",
costs:{forest:3,ocean:3,land:3,mana:40}
}
];

const harmonyCards = [

{
name:"Cultivate",
type:"gen",
icon:"🌲",
costs:{mana:30},
effect:{forest:2}
},

{
name:"Ocean Ritual",
type:"gen",
icon:"🌊",
costs:{mana:35},
effect:{ocean:2}
},

{
name:"Terraform",
type:"gen",
icon:"🌍",
costs:{mana:40},
effect:{land:2}
},

{
name: "Glintful Serum",
type: "mana-gen",
icon: "✨",
costs: { land: 2, ocean: 1, forest: 3 },
amount: 20,
desc: "Restore 20 Mana"
},
    
{
name: "Nature's Gift",
type: "mana-gen",
icon: "🔯",
costs: { land: 4, ocean: 2, forest: 2 },
amount: 100, // This will act as "Back to Full"
desc: "Full Mana Restore"
    }
];

const cardTypes = [...wrathCards, ...harmonyCards];
