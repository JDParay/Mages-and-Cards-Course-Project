/* ==========================================
   MAGES & CARDS — Battle Rewrite v1.1
   ========================================== */

const isDev = false;

/* ==========================================
   AUDIO
   ========================================== */
const GameAudio = {
    music: {
        current: null,
        tracks: {
            menu:   new Audio('audio/MainMenuBGM.m4a'),
            battle: new Audio('audio/TutorialBGM.m4a')
        }
    },
    sfx: {
        volume: 0.5,
        tracks: {
            button: new Audio('audio/sfx_button.mp3'),
            tap:    new Audio('audio/sfx_tap.mp3'),
            card:   new Audio('audio/sfx_button.mp3'), // reuse until dedicated sfx exists
            hit:    new Audio('audio/sfx_tap.mp3')
        }
    }
};
GameAudio.music.tracks.menu.loop   = true;
GameAudio.music.tracks.battle.loop = true;

function playMusic(trackName) {
    const next = GameAudio.music.tracks[trackName];
    if (!next || GameAudio.music.current === next) return;
    if (GameAudio.music.current) {
        GameAudio.music.current.pause();
        GameAudio.music.current.currentTime = 0;
    }
    GameAudio.music.current = next;
    next.play().catch(() => {});
}

function playSFX(name) {
    const src = GameAudio.sfx.tracks[name];
    if (!src) return;
    const s = src.cloneNode();
    s.volume = GameAudio.sfx.volume;
    s.play().catch(() => {});
}

window.addEventListener('click', () => playMusic('menu'), { once: true });

/* ==========================================
   BATTLE STATE
   ========================================== */

let player = {
    hp: 100, maxHp: 100,
    mana: 50, maxMana: 50,
    resources: { forest: 10, ocean: 10, land: 10 }
};

let deck = [];
let hand = [];
let discardPile = [];
let selectedCards = []; // for display zone + merge/attack

let currentEnemy = null;
let enemyQueue = [];
let enemyIndex = 0;

let gameHistory = [];
let unlockedLevels = { '1-1': true, '1-2': false, '1-3': false };

// Card definitions (Wrath + Harmony)
const allCards = [
    // Wrath (Combat)
    { id: 'w1', type: 'wrath', name: 'Fire Blast', icon: '🔥', resReq: {forest:2}, damage: 25, manaCost: 12, element: 'forest' },
    { id: 'w2', type: 'wrath', name: 'Forest Fire', icon: '🔥', resReq: {forest:4}, damage: 40, manaCost: 10, element: 'forest' },
    { id: 'w3', type: 'wrath', name: 'Burning Shot', icon: '🔥', resReq: {land:2}, damage: 20, manaCost: 11, element: 'forest' },
    { id: 'w4', type: 'wrath', name: 'Tsunami', icon: '🌊', resReq: {ocean:5}, damage: 50, manaCost: 12, element: 'ocean' },
    { id: 'w5', type: 'wrath', name: 'Water Strike', icon: '🌊', resReq: {ocean:2}, damage: 20, manaCost: 10, element: 'ocean' },
    { id: 'w6', type: 'wrath', name: 'Rain Dance', icon: '🌊', resReq: {ocean:3}, damage: 25, manaCost: 11, element: 'ocean' },
    { id: 'w7', type: 'wrath', name: 'Earthquake', icon: '⛰️', resReq: {land:5}, damage: 50, manaCost: 12, element: 'land' },
    { id: 'w8', type: 'wrath', name: 'Sinkhole', icon: '⛰️', resReq: {land:3}, damage: 25, manaCost: 10, element: 'land' },
    { id: 'w9', type: 'wrath', name: 'Earth Slam', icon: '⛰️', resReq: {land:2}, damage: 20, manaCost: 11, element: 'land' },
    

    // Harmony
    { id: 'h1', type: 'harmony', name: 'Mana Bloom', icon: '🌟', effect: 'mana', value: 30, resCost: {forest:5, ocean:5, land:5} },
    { id: 'h2', type: 'harmony', name: 'Resource Gift', icon: '🌱', effect: 'resource', value: 8, manaCost: 25 },
    { id: 'h3', type: 'harmony', name: 'Free Merge', icon: '🔄', effect: 'freemerge', manaCost: 0, resCost: {} }
];

function initDeck() {
    deck = Array.from({length: 12}, (_,i) => ({...allCards[i % allCards.length], uid: 'c'+Date.now()+i}));
    discardPile = [];
}

/* ==========================================
   SCREEN NAVIGATION
   ========================================== */
function showCampaign() {
    playSFX('button');
    switchScreen('main-menu-screen', 'campaign-screen');
}
function showPathSelection(chapterId) {
    playSFX('button');
    switchScreen('campaign-screen', 'path-selection-screen');
}
function goBackToChapters() {
    playSFX('button');
    switchScreen('path-selection-screen', 'campaign-screen');
}
function goBackToMenu() {
    playSFX('button');
    playMusic('menu');
    switchScreen('campaign-screen', 'main-menu-screen');
}
function switchScreen(fromId, toId) {
    const from = document.getElementById(fromId);
    const to   = document.getElementById(toId);
    if (from) { from.classList.add('hidden'); from.style.display = ''; }
    if (to)   { to.classList.remove('hidden'); to.style.display = 'flex'; }
}

document.querySelectorAll('.map-node').forEach(node => {
    node.addEventListener('click', () => {
        if (node.classList.contains('locked')) return;
        const level = node.dataset.level;
        startBattleLevel(level);
    });
});

window.onload = () => {
    updateMapLocks();
};

/* ==========================================
   OPTIONS / CREDITS / MODALS
   ========================================== */
function openOptions() {
    playSFX('button');
    document.getElementById('options-modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
}
function openCredits() {
    playSFX('button');
    document.getElementById('credits-modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
}

function closeModals() {
    playSFX('button');
    document.querySelectorAll('.modal-box').forEach(m => m.style.display = 'none');
    document.getElementById('modal-overlay').style.display = 'none';
}

function confirmLeave() {
    document.getElementById('leave-confirm-modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
}

function leaveBattle() {
    closeModals();
    switchScreen('vn-game-screen', 'path-selection-screen');
}

function closeLeaveConfirm() {
    closeModals();
}

function openTutorial() {
    playSFX('button');
    document.getElementById('tutorial-modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
}

/* ==========================================
   VOLUME SLIDERS
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('bgm-slider')?.addEventListener('input', e => {
        Object.values(GameAudio.music.tracks).forEach(t => t.volume = e.target.value);
    });
    document.getElementById('sfx-slider')?.addEventListener('input', e => {
        GameAudio.sfx.volume = e.target.value;
    });

    // Quest tile click handlers
    document.querySelectorAll('.quest-tile').forEach(tile => {
        tile.addEventListener('click', async () => {
            if (tile.classList.contains('locked')) return;
            const file  = tile.dataset.file;
            const start = tile.dataset.start;
            if (!file || !start) return;
            await startBattleLevel(file, start);
        });
    });
});

/* ==========================================
   LEVEL LOADING & BATTLE START
   ========================================== */

// Load chapter JSON (for narrative nodes between battles if needed)
async function loadChapter(file) {
    try {
        const res = await fetch(file);
        storyData = await res.json();
    } catch(e) {
        storyData = {};
        console.warn('Could not load chapter file:', file, e);
    }
}

async function startBattleLevel(levelId) {
    // Reset
    initDeck();
    hand = [];
    drawNewHand();
    player.hp = player.maxHp;
    player.mana = player.maxMana;
    player.resources = {forest:10, ocean:10, land:10};

    enemyQueue = [
        {name: "Wraith", hp: 70, maxHp: 70},
        {name: "Forest Guardian", hp: 95, maxHp: 95},
        {name: "Abyssal Horror", hp: 120, maxHp: 120}
    ];
    enemyIndex = 0;
    currentEnemy = {...enemyQueue[0]};

    document.getElementById('level-label').textContent = levelId;
    switchScreen('path-selection-screen', 'vn-game-screen');
    
    renderHand();
    updateResourcesUI();
    updatePlayerUI();
    updateEnemyUI();
    renderTrackerDots();
    setBattleLog(`Battle started: ${currentEnemy.name}`);
}

/* ==========================================
   ENEMY MANAGEMENT
   ========================================== */
function loadNextEnemy() {
    enemyIndex++;
    if (enemyIndex >= enemyQueue.length) {
        onLevelComplete();
        return;
    }
    currentEnemy = {...enemyQueue[enemyIndex]};
    updateEnemyUI();
    renderTrackerDots();
}

// ===================== VICTORY / PROGRESSION =====================
function onLevelComplete() {
    const level = document.getElementById('level-label').textContent;
    if (level === '1-1') unlockedLevels['1-2'] = true;
    if (level === '1-2') unlockedLevels['1-3'] = true;
    
    document.getElementById('level-complete-popup').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
}

function returnToMap() {
    closeModals();
    switchScreen('vn-game-screen', 'path-selection-screen');
    updateMapLocks();
}

function updateMapLocks() {
    if (unlockedLevels['1-2']) document.getElementById('q-2').classList.remove('locked');
    if (unlockedLevels['1-3']) document.getElementById('q-3').classList.remove('locked');
}

function onPlayerDeath() {
    setBattleLog('You have been defeated...');
    setTimeout(() => {
        // Return to quest select on death (could add game-over screen later)
        switchScreen('vn-game-screen', 'path-selection-screen');
        playMusic('menu');
        updateMapUI();
    }, 2000);
}

/* ==========================================
   BATTLE LOG
   ========================================== */
function setBattleLog(text) {
    document.getElementById('battle-log-text').textContent = text;
    gameHistory.push({name: 'SYSTEM', text});
}
function appendBattleLog(text) {
    const el = document.getElementById('battle-log-text');
    if (el) el.textContent = text;
    addToLog('BATTLE', text);
}

/* ==========================================
   CARD RENDERING
   ========================================== */
function renderCards() {
    renderCombatCards();
    renderUtilityCards();
}

function renderHand() {
    // Combat (Wrath)
    const combatContainer = document.getElementById('combat-cards');
    combatContainer.innerHTML = '';
    hand.filter(c => c.type === 'wrath').forEach(card => {
        const el = createCardElement(card);
        combatContainer.appendChild(el);
    });

    // Harmony
    const utilContainer = document.getElementById('utility-cards');
    utilContainer.innerHTML = '';
    hand.filter(c => c.type === 'harmony').forEach(card => {
        const el = createCardElement(card);
        utilContainer.appendChild(el);
    });
}

function renderUtilityCards() {
    const container = document.getElementById('utility-cards');
    if (!container) return;
    container.innerHTML = '';
    utilityCards.forEach(card => {
        const el = buildCardElement(card, 'utility');
        if (usedUtility.has(card.id)) el.classList.add('used');
        container.appendChild(el);
    });
}

function buildCardElement(card, type) {
    const el = document.createElement('div');
    el.className = `spell-card ${type}`;
    el.title = card.desc || '';

    // Mana pips (combat cards only)
    let pipsHtml = '';
    if (type === 'combat') {
        const totalPips = 5;
        const filled = Math.min(Math.ceil(card.manaCost / 10), totalPips);
        pipsHtml = `<div class="card-mana-pips">` +
            Array.from({length: totalPips}, (_,i) =>
                `<div class="pip${i < filled ? '' : ' empty'}"></div>`
            ).join('') +
        `</div>`;
    }

    const costLabel = card.manaCost === 0
        ? `<span class="card-cost zero">FREE</span>`
        : `<span class="card-cost">${card.manaCost} MP</span>`;

    el.innerHTML = `
        <div class="card-icon">${card.icon}</div>
        <div class="card-name">${card.name}</div>
        ${type === 'combat' ? pipsHtml : ''}
        ${type === 'combat' ? costLabel : '<span class="card-cost zero">1× USE</span>'}
    `;

    el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (type === 'combat')  useCombatCard(card);
        if (type === 'utility') useUtilityCard(card, el);
    });
    return el;
}

function createCardElement(card) {
    const el = document.createElement('div');
    el.className = `spell-card ${card.type}`;
    el.innerHTML = `
        <div class="card-icon">${card.icon}</div>
        <div class="card-name">${card.name}</div>
        ${card.manaCost ? `<div class="card-cost">${card.manaCost} MP</div>` : ''}
    `;
    el.onclick = () => selectCardForDisplay(card, el);
    return el;
}

/* ==========================================
   CARD USAGE
   ========================================== */
function useCombatCard(card) {
    if (!currentEnemy) return;
    if (player.mana < card.manaCost) {
        setBattleLog(`Not enough mana for ${card.name}!`);
        playSFX('tap');
        return;
    }
    playSFX('card');

    player.mana = Math.max(0, player.mana - card.manaCost);

    const totalDmg = card.damage + dmgBuff;
    dmgBuff = 0; // Empower consumed

    currentEnemy.hp = Math.max(0, currentEnemy.hp - totalDmg);
    appendBattleLog(`${card.name} deals ${totalDmg} damage to ${currentEnemy.name}!`);

    updatePlayerUI();
    updateEnemyUI();

    if (currentEnemy.hp <= 0) {
        onEnemyDefeated();
        return;
    }

    // Enemy counter-attack (simple)
    setTimeout(enemyAttack, 600);
}

function useUtilityCard(card, el) {
    if (usedUtility.has(card.id)) {
        setBattleLog(`${card.name} already used!`);
        playSFX('tap');
        return;
    }
    playSFX('card');
    usedUtility.add(card.id);
    el.classList.add('used');

    if (card.healHp) {
        player.hp = Math.min(player.maxHp, player.hp + card.healHp);
        appendBattleLog(`${card.name}: Restored ${card.healHp} HP!`);
    }
    if (card.healMana) {
        player.mana = Math.min(player.maxMana, player.mana + card.healMana);
        appendBattleLog(`${card.name}: Restored ${card.healMana} Mana!`);
    }
    if (card.buffDmg) {
        dmgBuff += card.buffDmg;
        appendBattleLog(`${card.name}: Next attack deals +${card.buffDmg} damage!`);
    }

    updatePlayerUI();
}

function onEnemyDefeated() {
    setBattleLog(`${currentEnemy.name} defeated!`);
    const dot = document.querySelectorAll('.tracker-dot')[enemyIndex];
    if (dot) dot.classList.add('dead');

    // Partial mana restore between fights
    player.mana = Math.min(player.maxMana, player.mana + 15);
    // Restore utility cards for next enemy
    usedUtility.clear();
    dmgBuff = 0;

    enemyIndex++;
    setTimeout(loadNextEnemy, 900);
}

// ===================== MERGING =====================
function performMerge() {
    const [a, b] = selectedCards;
    let newElement = '';
    
    if ((a.element === 'ocean' && b.element === 'forest') || (a.element === 'forest' && b.element === 'ocean')) {
        newElement = 'forest_ocean';
    } else if ((a.element === 'forest' && b.element === 'land') || (a.element === 'land' && b.element === 'forest')) {
        newElement = 'forest_land';
    } else if ((a.element === 'land' && b.element === 'ocean') || (a.element === 'ocean' && b.element === 'land')) {
        newElement = 'land_ocean';
    }

    // Create merged card
    const merged = {
        id: 'merge_'+Date.now(),
        type: 'wrath',
        name: `${a.element} + ${b.element} Fusion`,
        icon: '✨',
        damage: Math.floor((a.damage + b.damage) / 1.5),
        manaCost: Math.max(a.manaCost, b.manaCost) + 5,
        element: newElement
    };

    hand = hand.filter(c => c.uid !== a.uid && c.uid !== b.uid);
    hand.push(merged);
    
    selectedCards = [];
    document.getElementById('card-display-zone').classList.add('hidden');
    renderHand();
    setBattleLog(`Created ${merged.name}!`);
}

// ===================== CARD SELECTION & DISPLAY =====================
function selectCardForDisplay(card, originalEl) {
    if (selectedCards.length >= 2) return;
    
    selectedCards.push(card);
    renderCardDisplay();
    
    // Remove from hand visually
    originalEl.style.opacity = '0.3';
    originalEl.style.pointerEvents = 'none';
}

function renderCardDisplay() {
    const zone = document.getElementById('card-display-zone');
    const slots = document.getElementById('card-display-slots');
    slots.innerHTML = '';
    
    selectedCards.forEach((card, i) => {
        const staged = document.createElement('div');
        staged.className = 'staged-card';
        staged.innerHTML = `<div class="card-icon">${card.icon}</div><div class="card-name">${card.name}</div>`;
        staged.onclick = () => removeFromDisplay(i);
        slots.appendChild(staged);
    });

    const actions = document.getElementById('card-display-actions');
    actions.innerHTML = '';

    if (selectedCards.length === 1) {
        const attackBtn = document.createElement('button');
        attackBtn.className = 'game-btn attack-btn';
        attackBtn.textContent = 'ATTACK';
        attackBtn.onclick = performAttack;
        actions.appendChild(attackBtn);
    } else if (selectedCards.length === 2) {
        const mergeBtn = document.createElement('button');
        mergeBtn.className = 'game-btn merge-btn';
        mergeBtn.textContent = 'MERGE';
        mergeBtn.onclick = performMerge;
        actions.appendChild(mergeBtn);
    }

    zone.classList.remove('hidden');
}

function removeFromDisplay(index) {
    selectedCards.splice(index, 1);
    renderCardDisplay();
    if (selectedCards.length === 0) {
        document.getElementById('card-display-zone').classList.add('hidden');
    }
    renderHand(); // restore hand visuals
}

// ===================== END TURN =====================
function endTurn() {
    // Move used cards to discard
    discardPile.push(...hand);
    hand = [];
    
    // Enemy turn
    if (currentEnemy) {
        const dmg = 12 + Math.floor(Math.random() * 9);
        player.hp = Math.max(0, player.hp - dmg);
        setBattleLog(`${currentEnemy.name} attacks for ${dmg}!`);
        updatePlayerUI();
    }

    // Draw new hand
    drawNewHand();

    if (player.hp <= 0) {
        // game over
        setTimeout(() => alert("You were defeated..."), 600);
    }
}

function drawNewHand() {
    while (hand.length < 4 && deck.length > 0) {
        hand.push(deck.pop());
    }
    if (deck.length === 0 && discardPile.length > 0) {
        deck = discardPile;
        discardPile = [];
        // shuffle would go here
    }
    renderHand();
    updateDeckUI();
}

/* ==========================================
   ENEMY AI (basic)
   ========================================== */
function enemyAttack() {
    if (!currentEnemy || currentEnemy.hp <= 0) return;

    const dmg = Math.floor(Math.random() * 10) + 8; // 8-17
    player.hp = Math.max(0, player.hp - dmg);
    appendBattleLog(`${currentEnemy.name} strikes for ${dmg} damage!`);
    updatePlayerUI();

    if (player.hp <= 0) {
        onPlayerDeath();
    }
}

// ===================== DECK / ADD CARDS =====================
function updateDeckUI() {
    document.getElementById('deck-count-label').textContent = `Deck: ${deck.length}`;
    document.getElementById('discard-count-label').textContent = `Discard: ${discardPile.length}`;
}

function addCardsFromDeck() {
    if (player.mana < 25) return;
    player.mana -= 25;
    for (let i = 0; i < 4; i++) {
        if (deck.length) hand.push(deck.pop());
    }
    updatePlayerUI();
    renderHand();
    updateDeckUI();
}

/* ==========================================
   UI UPDATERS
   ========================================== */
function updatePlayerUI() {
    // HP + Mana
    const hpPct = (player.hp / player.maxHp) * 100;
    document.getElementById('player-hp-bar').style.width = `${hpPct}%`;
    document.getElementById('player-hp-label').textContent = `${player.hp} / ${player.maxHp}`;
    
    const manaPct = (player.mana / player.maxMana) * 100;
    document.getElementById('player-mana-bar').style.width = `${manaPct}%`;
    document.getElementById('player-mana-label').textContent = `Mana: ${player.mana} / ${player.maxMana}`;
}

function updateEnemyUI() {
    if (!currentEnemy) return;
    const pct = (currentEnemy.hp / currentEnemy.maxHp) * 100;

    const bar  = document.getElementById('enemy-hp-bar');
    const lbl  = document.getElementById('enemy-hp-label');
    const name = document.getElementById('enemy-name-label');

    if (bar)  bar.style.width   = `${pct}%`;
    if (lbl)  lbl.textContent   = `${currentEnemy.hp} / ${currentEnemy.maxHp}`;
    if (name) name.textContent  = currentEnemy.name.toUpperCase();

    // Swap sprite if defined
    const sprite = document.querySelector('.enemy-sprite');
    if (sprite && currentEnemy.sprite) sprite.src = currentEnemy.sprite;
}

function updateResourcesUI() {
    ['forest','ocean','land'].forEach(res => {
        const pct = (player.resources[res] / 10) * 100;
        const bar = document.getElementById(`res-${res}-bar`);
        const count = document.getElementById(`res-${res}`);
        if (bar) bar.style.width = `${pct}%`;
        if (count) count.textContent = player.resources[res];
    });
}

function renderTrackerDots() {
    const tracker = document.getElementById('enemy-tracker');
    if (!tracker) return;
    tracker.innerHTML = '';
    enemyQueue.forEach((enemy, i) => {
        if (i > 0) {
            const line = document.createElement('div');
            line.className = 'tracker-line';
            tracker.appendChild(line);
        }
        const dot = document.createElement('div');
        dot.className = 'tracker-dot';
        if (i < enemyIndex)   dot.classList.add('dead');
        if (i === enemyIndex) dot.classList.add('current');
        dot.title = enemy.name;
        tracker.appendChild(dot);
    });
}

/* ==========================================
   QUEST MAP UNLOCK LOGIC
   ========================================== */
function updateMapUI() {
    const unlockMap = {
        'ch1_start_done':     { id: 'q-2',   show: true },
        'ch1_level2_done':    { id: 'q-2-1', show: true },
        'ch1_defense_done':   { id: 'q-3',   show: true },
        'stage3_1_unlocked':  { id: 'q-3-1', show: true },
        'stage4_unlocked':    { id: 'q-4',   show: true },
        'stage5_unlocked':    { id: 'q-5',   show: true }
    };
    unlockedNodes.forEach(tag => {
        const entry = unlockMap[tag];
        if (!entry) return;
        const el = document.getElementById(entry.id);
        if (!el) return;
        if (entry.show) el.classList.remove('hidden');
        el.classList.remove('locked');
        const tag_ = el.querySelector('.quest-tag');
        if (tag_) { tag_.textContent = '▶ ENTER'; }
    });
}

function unlockNode(tag) {
    if (!unlockedNodes.includes(tag)) unlockedNodes.push(tag);
}

/* ==========================================
   LOG
   ========================================== */
function addToLog(name, text) {
    gameHistory.push({ name, text });
}

function toggleLog(e) {
    if (e) e.stopPropagation();
    const log  = document.getElementById('history-log');
    const cont = document.getElementById('log-content');

    if (log.style.display === 'none' || !log.style.display) {
        cont.innerHTML = gameHistory.map(entry =>
            `<div class="log-entry">
                <span class="log-name">${entry.name}</span>
                <span class="log-text">${entry.text}</span>
            </div>`
        ).join('');
        log.style.display = 'flex';
        document.getElementById('modal-overlay').style.display = 'block';
    } else {
        log.style.display = 'none';
        document.getElementById('modal-overlay').style.display = 'none';
    }
}

/* ==========================================
   DEV TOOLS
   ========================================== */
if (isDev) {
    document.addEventListener('keydown', e => {
        if (e.key === 'K') { // Kill current enemy instantly
            if (currentEnemy) { currentEnemy.hp = 0; onEnemyDefeated(); }
        }
        if (e.key === 'H') { // Full heal player
            player.hp = player.maxHp;
            player.mana = player.maxMana;
            updatePlayerUI();
        }
    });
}
