/* =============================================
   MAGES & CARDS  —  script.js  v1.2
   ============================================= */

const isDev = false;

/* =============================================
   AUDIO
   ============================================= */
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
            card:   new Audio('audio/sfx_button.mp3'),
            hit:    new Audio('audio/sfx_tap.mp3')
        }
    }
};
GameAudio.music.tracks.menu.loop   = true;
GameAudio.music.tracks.battle.loop = true;

function playMusic(name) {
    const t = GameAudio.music.tracks[name];
    if (!t || GameAudio.music.current === t) return;
    if (GameAudio.music.current) {
        GameAudio.music.current.pause();
        GameAudio.music.current.currentTime = 0;
    }
    GameAudio.music.current = t;
    t.play().catch(() => {});
}
function playSFX(name) {
    const src = GameAudio.sfx.tracks[name];
    if (!src) return;
    const s = src.cloneNode();
    s.volume = GameAudio.sfx.volume;
    s.play().catch(() => {});
}
window.addEventListener('click', () => playMusic('menu'), { once: true });

/* =============================================
   CARD DEFINITIONS
   ============================================= */

// MAIN DECK — 12 cards, shuffled together: 9 Wrath + 3 Harmony.
// These fill the top 4 hand slots. They cycle through draw → hand → discard → reshuffle.
const MAIN_DECK_POOL = [
    // Wrath cards (red border) — cost resources, deal damage
    { id:'w1', name:'Flame Burst',  icon:'🔥', type:'wrath', element:'forest', manaCost:0, resCost:{forest:2}, damage:16 },
    { id:'w2', name:'Tidal Wave',   icon:'🌊', type:'wrath', element:'ocean',  manaCost:0, resCost:{ocean:2},  damage:18 },
    { id:'w3', name:'Stone Crush',  icon:'🪨', type:'wrath', element:'land',   manaCost:0, resCost:{land:2},   damage:15 },
    { id:'w4', name:'Arcane Bolt',  icon:'⚡', type:'wrath', element:'forest', manaCost:6, resCost:{forest:1}, damage:22 },
    { id:'w5', name:'Frost Lance',  icon:'❄️', type:'wrath', element:'ocean',  manaCost:8, resCost:{ocean:1},  damage:24 },
    { id:'w6', name:'Quake Spike',  icon:'🌋', type:'wrath', element:'land',   manaCost:6, resCost:{land:1},   damage:20 },
    { id:'w7', name:'Wildfire',     icon:'🌿', type:'wrath', element:'forest', manaCost:4, resCost:{forest:3}, damage:30 },
    { id:'w8', name:'Riptide',      icon:'💧', type:'wrath', element:'ocean',  manaCost:4, resCost:{ocean:3},  damage:28 },
    { id:'w9', name:'Landslide',    icon:'🏔️', type:'wrath', element:'land',   manaCost:4, resCost:{land:3},   damage:26 },
    // Harmony cards (gold border) — restore mana or resources; mixed into the same deck
    { id:'h1', name:'Mana Bloom',  icon:'💎', type:'harmony', element:'none', manaCost:0,  resCost:{forest:3,ocean:2,land:2}, effect:'mana',      healMana:30 },
    { id:'h2', name:'Earth Pulse', icon:'🌱', type:'harmony', element:'none', manaCost:20, resCost:{},                        effect:'resource',   healRes:4   },
    { id:'h3', name:'Free Weave',  icon:'✨', type:'harmony', element:'none', manaCost:0,  resCost:{},                        effect:'freemerge'               }
];

// UTILITY CARDS — fixed, always present in the bottom 3 slots.
// Never shuffle, never go to discard, never used up (one-time per battle resets each enemy).
const UTILITY_CARDS = [
    { id:'u1', name:'Heal Rune',   icon:'💚', type:'utility', manaCost:0,  resCost:{}, effect:'healHp',   healHp:25,  desc:'Restore 25 HP. One use per enemy.' },
    { id:'u2', name:'Mana Surge',  icon:'🔷', type:'utility', manaCost:0,  resCost:{}, effect:'healMana', healMana:20, desc:'Restore 20 MP. One use per enemy.' },
    { id:'u3', name:'Ward Stone',  icon:'🛡️', type:'utility', manaCost:10, resCost:{}, effect:'shield',   shieldAmt:15, desc:'Block 15 dmg next enemy hit. Costs 10 MP.' }
];

// Merge result table: element combos → new card stats
// key: sorted elements joined by '_'
const MERGE_TABLE = {
    'forest_ocean': { name:'Mist Surge',    icon:'🌫️', damage:38, resCost:{forest:1,ocean:1}, manaCost:5 },
    'forest_land':  { name:'Verdant Slam',  icon:'🌳', damage:35, resCost:{forest:1,land:1},  manaCost:5 },
    'land_ocean':   { name:'Tidal Stone',   icon:'⛰️', damage:40, resCost:{ocean:1,land:1},   manaCost:5 },
    'forest_forest':{ name:'Twin Blaze',    icon:'🔥', damage:44, resCost:{forest:2},          manaCost:6 },
    'ocean_ocean':  { name:'Twin Tide',     icon:'🌊', damage:46, resCost:{ocean:2},            manaCost:6 },
    'land_land':    { name:'Twin Quake',    icon:'🪨', damage:48, resCost:{land:2},             manaCost:6 }
};

/* =============================================
   GAME STATE
   ============================================= */
let player = { hp:100, maxHp:100, mana:50, maxMana:50 };
let resources = { forest:10, ocean:10, land:10 };
const MAX_RES = 10;

// Deck system
// drawPile: remaining cards from the shuffled 12-card main deck
// hand:     the 4 cards currently showing in the top row (drawn from drawPile)
// discardPile: used main-deck cards waiting for reshuffle
// utilityUsed: tracks which utility card ids were used this enemy fight
let drawPile     = [];
let hand         = [];   // top 4 slots — from main deck
let discardPile  = [];
let utilityUsed  = new Set(); // resets each enemy
let stagedCards  = [];
let freeMerge    = false;
let shield       = 0;

// Enemies
let enemyQueue   = [];
let currentEnemy = null;
let enemyIndex   = 0;

// Level tracking
let currentLevelId   = '1-1';
let unlockedLevels   = ['q-1']; // element IDs
let gameHistory      = [];
let currentLevelFile = '';

/* =============================================
   DOMContentLoaded — wire up map nodes
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
    // Volume sliders
    document.getElementById('bgm-slider')?.addEventListener('input', e => {
        Object.values(GameAudio.music.tracks).forEach(t => t.volume = e.target.value);
    });
    document.getElementById('sfx-slider')?.addEventListener('input', e => {
        GameAudio.sfx.volume = e.target.value;
    });

    // Map node click handlers
    document.querySelectorAll('.map-node').forEach(node => {
        node.addEventListener('click', async () => {
            if (node.classList.contains('locked')) return;
            const file  = node.dataset.file;
            const start = node.dataset.start;
            const level = node.dataset.level;
            if (!file) return;
            currentLevelId   = level || '1-1';
            currentLevelFile = file;
            await startBattle(file, start);
        });
    });
});

/* =============================================
   SCREEN NAVIGATION
   ============================================= */
function switchScreen(fromId, toId) {
    const f = document.getElementById(fromId);
    const t = document.getElementById(toId);
    if (f) { f.classList.add('hidden'); f.style.display = ''; }
    if (t) { t.classList.remove('hidden'); t.style.display = 'flex'; }
}
function showCampaign() {
    playSFX('button');
    switchScreen('main-menu-screen', 'campaign-screen');
}
function showPathSelection(chapterId) {
    playSFX('button');
    switchScreen('campaign-screen', 'path-selection-screen');
    updateMapUI();
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

/* =============================================
   MODALS
   ============================================= */
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
function openTutorial() {
    playSFX('button');
    document.getElementById('tutorial-modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
}
function closeTutorial() {
    playSFX('button');
    document.getElementById('tutorial-modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
}
function closeModals() {
    ['options-modal','credits-modal','tutorial-modal',
     'level-complete-popup','leave-confirm-modal'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    document.getElementById('modal-overlay').style.display = 'none';
}
function confirmLeave() {
    playSFX('button');
    document.getElementById('leave-confirm-modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
}
function closeLeaveConfirm() {
    playSFX('button');
    document.getElementById('leave-confirm-modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
}
function leaveBattle() {
    playSFX('button');
    closeModals();
    playMusic('menu');
    switchScreen('vn-game-screen', 'path-selection-screen');
    updateMapUI();
}
function closeVictoryPopup() {
    playSFX('button');
    closeModals();
    switchScreen('vn-game-screen', 'path-selection-screen');
    playMusic('menu');
    updateMapUI();
}

/* =============================================
   MAP UI
   ============================================= */
function updateMapUI() {
    // Which levels are unlocked
    unlockedLevels.forEach(id => {
        const node = document.getElementById(id);
        if (!node) return;
        node.classList.remove('locked');
        node.classList.add('unlocked');
        // Update dot symbol
        const dot = node.querySelector('.map-dot');
        if (dot) dot.innerHTML = '&#10022;';
    });
    // Connector lines
    if (unlockedLevels.includes('q-2')) {
        document.getElementById('line-1-2')?.classList.add('unlocked');
    }
    if (unlockedLevels.includes('q-3')) {
        document.getElementById('line-2-3')?.classList.add('unlocked');
    }
}

function unlockNextLevel(currentNodeId) {
    const order = ['q-1', 'q-2', 'q-3'];
    const idx = order.indexOf(currentNodeId);
    if (idx !== -1 && idx + 1 < order.length) {
        const nextId = order[idx + 1];
        if (!unlockedLevels.includes(nextId)) {
            unlockedLevels.push(nextId);
        }
    }
}

/* =============================================
   BATTLE INIT
   ============================================= */
async function startBattle(file, startNode) {
    playSFX('button');
    playMusic('battle');

    // Load chapter JSON if provided (for enemy list etc.)
    let chapterData = {};
    try {
        const res = await fetch(file);
        chapterData = await res.json();
    } catch(e) {
        // fallback demo data if file missing
    }

    // Enemy queue from chapter JSON or demo fallback
    if (chapterData.__enemies) {
        enemyQueue = chapterData.__enemies.map(e => ({ ...e }));
    } else {
        enemyQueue = getDemoEnemies(currentLevelId);
    }

    // Reset player
    player.hp   = player.maxHp;
    player.mana = player.maxMana;
    resources   = { forest:10, ocean:10, land:10 };

    // Build and shuffle deck
    buildDeck();

    // Reset state
    stagedCards  = [];
    freeMerge    = false;
    gameHistory  = [];
    enemyIndex   = 0;

    // Set level label
    const lbl = document.getElementById('level-label');
    if (lbl) lbl.textContent = currentLevelId;

    // Show battle screen
    switchScreen('path-selection-screen', 'vn-game-screen');

    renderTrackerDots();
    loadNextEnemy();
}

function getDemoEnemies(levelId) {
    const sets = {
        '1-1': [
            { name:'Shade',   hp:55,  maxHp:55,  sprite:'assets/enemy_1.png',    atk:8  },
            { name:'Wraith',  hp:70,  maxHp:70,  sprite:'assets/enemy_1.png',    atk:10 }
        ],
        '1-2': [
            { name:'Golem',   hp:80,  maxHp:80,  sprite:'assets/enemy_2.png',    atk:12 },
            { name:'Golem',   hp:80,  maxHp:80,  sprite:'assets/enemy_2.png',    atk:12 },
            { name:'Brute',   hp:100, maxHp:100, sprite:'assets/enemy_2.png',    atk:14 }
        ],
        '1-3': [
            { name:'Revenant',hp:90,  maxHp:90,  sprite:'assets/enemy_boss.png', atk:13 },
            { name:'Dark Mage',hp:110,maxHp:110, sprite:'assets/enemy_boss.png', atk:16 }
        ]
    };
    return (sets[levelId] || sets['1-1']).map(e => ({ ...e }));
}

/* =============================================
   DECK SYSTEM
   ============================================= */
function buildDeck() {
    // Shuffle all 12 main deck cards together (9 wrath + 3 harmony)
    const shuffled = [...MAIN_DECK_POOL]
        .sort(() => Math.random() - 0.5)
        .map(c => ({ ...c, uid: c.id + '_' + Math.random().toString(36).slice(2) }));

    drawPile    = shuffled;   // all 12 start in draw pile
    hand        = [];
    discardPile = [];

    // Draw initial 4 into hand
    hand = drawPile.splice(0, 4);

    updateDeckCountUI();
    renderHand();
    renderUtility();
}

function dealFromDrawPile() {
    // Reshuffle discard back in if draw pile empty
    if (drawPile.length === 0) {
        if (discardPile.length === 0) return null;
        drawPile = [...discardPile].sort(() => Math.random() - 0.5);
        discardPile = [];
        setBattleLog('Deck reshuffled!');
    }
    return drawPile.splice(0, 1)[0] || null;
}

function refreshHandAfterTurn() {
    // Fill empty hand slots from draw pile (hand should always have up to 4)
    while (hand.length < 4) {
        const drawn = dealFromDrawPile();
        if (!drawn) break;
        hand.push(drawn);
    }
    updateDeckCountUI();
    renderHand();
}

function updateDeckCountUI() {
    const deckEl    = document.getElementById('deck-count-label');
    const discardEl = document.getElementById('discard-count-label');
    if (deckEl)    deckEl.textContent    = `Deck: ${drawPile.length}`;
    if (discardEl) discardEl.textContent = `Discard: ${discardPile.length}`;
}

/* =============================================
   RENDER HAND (top 4 — from deck)
   ============================================= */
function renderHand() {
    const row = document.getElementById('wrath-row');
    if (!row) return;
    row.innerHTML = '';

    hand.forEach(card => {
        const el = buildCardEl(card);
        row.appendChild(el);
    });

    // Show draw button only if hand is empty and deck/discard has cards
    const drawBtn = document.getElementById('btn-draw');
    if (drawBtn) {
        const hasDrawable = drawPile.length > 0 || discardPile.length > 0;
        drawBtn.style.display = (hand.length === 0 && hasDrawable) ? 'flex' : 'none';
    }
}

/* =============================================
   RENDER UTILITY (bottom 3 — always fixed)
   ============================================= */
function renderUtility() {
    const row = document.getElementById('utility-row');
    if (!row) return;
    row.innerHTML = '';

    UTILITY_CARDS.forEach(card => {
        const el = buildCardEl(card);
        if (utilityUsed.has(card.id)) el.classList.add('used');
        row.appendChild(el);
    });
}

function buildCardEl(card) {
    const el = document.createElement('div');
    el.className  = `spell-card ${card.type === 'merge-hand' ? 'merge-hand' : card.type}`;
    el.dataset.uid = card.uid;

    if (stagedCards.find(s => s.uid === card.uid)) {
        el.classList.add('selected');
    }

    // Resource cost label
    let resCostStr = '';
    if (card.resCost && Object.keys(card.resCost).length > 0) {
        resCostStr = Object.entries(card.resCost)
            .map(([r, v]) => `${v}${r[0].toUpperCase()}`)
            .join('+');
    }
    // Mana pips (wrath)
    let pipsHtml = '';
    if (card.type === 'wrath' || card.type === 'merge-hand') {
        const maxPips = 5;
        const filled  = Math.min(Math.ceil((card.manaCost || 0) / 10), maxPips);
        pipsHtml = `<div class="card-pips">` +
            Array.from({length: maxPips}, (_,i) =>
                `<div class="pip${i < filled ? '' : ' empty'}"></div>`
            ).join('') + `</div>`;
    }

    // --- NEW: Handle Damage or Description displays ---
    let extraDescHtml = '';
    if (card.damage) {
        // If the card deals damage (Wrath & Merged cards)
        extraDescHtml = `<div class="card-damage-text">💥 ${card.damage} DMG</div>`;
    } else if (card.desc) {
        // Fallback for Utility cards or custom entries that already have a description text
        extraDescHtml = `<div class="card-desc-text">${card.desc}</div>`;
    }

    el.innerHTML = `
        <div class="card-icon">${card.icon}</div>
        <div class="card-name">${card.name}</div>
        ${pipsHtml}
        ${extraDescHtml} 
        <div class="card-costs">
            ${card.manaCost > 0 ? `<span class="card-mana-cost">${card.manaCost} MP</span>` : ''}
            ${resCostStr    ? `<span class="card-res-cost">${resCostStr}</span>` : ''}
            ${!card.manaCost && !resCostStr ? `<span class="card-free">Free</span>` : ''}
        </div>`;

    el.addEventListener('click', () => stageCard(card));
    return el;
}

/* =============================================
   STAGING CARDS (display zone)
   ============================================= */
function stageCard(card) {
    playSFX('tap');

    // Utility cards: bypass staging, execute immediately
    if (card.type === 'utility') {
        if (utilityUsed.has(card.id)) {
            setBattleLog(`${card.name} already used this fight!`);
            return;
        }
        executeUtilityCard(card);
        return;
    }

    // Already staged — remove it
    const existingIdx = stagedCards.findIndex(s => s.uid === card.uid);
    if (existingIdx !== -1) {
        stagedCards.splice(existingIdx, 1);
        renderHand();
        renderDisplayZone();
        return;
    }
    // Max 2 staged
    if (stagedCards.length >= 2) {
        setBattleLog('You can only stage up to 2 cards at a time.');
        return;
    }
    stagedCards.push(card);
    renderHand();
    renderDisplayZone();
}

function renderDisplayZone() {
    const zone    = document.getElementById('card-display-zone');
    const slots   = document.getElementById('staged-slots');
    const actions = document.getElementById('display-actions');
    if (!zone || !slots || !actions) return;

    if (stagedCards.length === 0) {
        zone.classList.add('hidden');
        return;
    }
    zone.classList.remove('hidden');

    // Render staged cards
    slots.innerHTML = '';
    stagedCards.forEach(card => {
        const el = document.createElement('div');
        el.className = `staged-card ${card.type === 'merge-hand' ? 'merge-card' : card.type}`;

        let resCostStr = '';
        if (card.resCost && Object.keys(card.resCost).length > 0) {
            resCostStr = Object.entries(card.resCost).map(([r,v]) => `${v}${r[0].toUpperCase()}`).join('+');
        }

        el.innerHTML = `
            <span class="s-dismiss">✕ click to remove</span>
            <span class="s-icon">${card.icon}</span>
            <span class="s-name">${card.name}</span>
            <span class="s-cost">${card.manaCost > 0 ? card.manaCost + ' MP' : ''}${resCostStr ? ' ' + resCostStr : ''}${!card.manaCost && !resCostStr ? 'Free' : ''}</span>`;
        el.addEventListener('click', () => stageCard(card));
        slots.appendChild(el);
    });

    // Action buttons
    actions.innerHTML = '';
    if (stagedCards.length === 1) {
        const btn = document.createElement('button');
        btn.className = 'game-btn attack-btn';
        btn.textContent = 'USE CARD';
        btn.addEventListener('click', executeAttack);
        actions.appendChild(btn);
    } else if (stagedCards.length === 2) {
        const btn = document.createElement('button');
        btn.className = 'game-btn merge-btn';
        btn.textContent = '✦ MERGE';
        btn.addEventListener('click', executeMerge);
        actions.appendChild(btn);
    }
}

/* =============================================
   EXECUTE ATTACK
   ============================================= */
function executeAttack() {
    if (stagedCards.length !== 1) return;
    const card = stagedCards[0];
    if (!currentEnemy) return;

    // Harmony card used from hand — apply effect
    if (card.type === 'harmony') {
        if (!executeHarmonyCard(card)) return;
        hand = hand.filter(c => c.uid !== card.uid);
        discardPile.push(card);
        stagedCards = [];
        updateDeckCountUI();
        renderHand();
        renderDisplayZone();
        return;
    }

    // Check resources
    if (card.resCost) {
        for (const [res, amt] of Object.entries(card.resCost)) {
            if ((resources[res] || 0) < amt) {
                setBattleLog(`Not enough ${res} to use ${card.name}!`);
                playSFX('tap');
                return;
            }
        }
    }
    // Check mana
    if ((card.manaCost || 0) > player.mana) {
        setBattleLog(`Not enough mana for ${card.name}!`);
        playSFX('tap');
        return;
    }

    playSFX('card');

    // Deduct costs
    if (card.resCost) {
        for (const [res, amt] of Object.entries(card.resCost)) {
            resources[res] = Math.max(0, (resources[res] || 0) - amt);
        }
    }
    player.mana = Math.max(0, player.mana - (card.manaCost || 0));

    // Deal damage
    const dmg = card.damage || 0;
    currentEnemy.hp = Math.max(0, currentEnemy.hp - dmg);
    setBattleLog(`${card.name} hits ${currentEnemy.name} for ${dmg} damage!`);

    // Merge cards disappear; regular deck cards go to discard
    hand = hand.filter(c => c.uid !== card.uid);
    if (card.type !== 'merge-hand') discardPile.push(card);

    stagedCards = [];
    updatePlayerUI();
    updateEnemyUI();
    updateResourceUI();
    updateDeckCountUI();

    if (currentEnemy.hp <= 0) {
        onEnemyDefeated();
        return;
    }

    renderHand();
    renderDisplayZone();
}

/* =============================================
   UTILITY CARD EFFECTS (fixed bottom row)
   ============================================= */
function executeUtilityCard(card) {
    playSFX('card');

    if (card.effect === 'healHp') {
        player.hp = Math.min(player.maxHp, player.hp + (card.healHp || 0));
        setBattleLog(`${card.name}: Restored ${card.healHp} HP!`);
    } else if (card.effect === 'healMana') {
        player.mana = Math.min(player.maxMana, player.mana + (card.healMana || 0));
        setBattleLog(`${card.name}: Restored ${card.healMana} MP!`);
    } else if (card.effect === 'shield') {
        if (player.mana < (card.manaCost || 0)) {
            setBattleLog(`Not enough mana for ${card.name}! Need ${card.manaCost} MP.`);
            playSFX('tap');
            return;
        }
        player.mana -= card.manaCost || 0;
        shield += card.shieldAmt || 0;
        setBattleLog(`${card.name}: Blocking ${card.shieldAmt} damage next hit!`);
    }

    utilityUsed.add(card.id);
    updatePlayerUI();
    updateResourceUI();
    renderUtility();
}

/* =============================================
   HARMONY CARD EFFECTS
   ============================================= */
function executeHarmonyCard(card) {
    playSFX('card');

    if (card.effect === 'mana') {
        // Check resource cost
        if (card.resCost) {
            for (const [res, amt] of Object.entries(card.resCost)) {
                if (resources[res] < amt) {
                    setBattleLog(`Not enough ${res} for ${card.name}!`);
                    playSFX('tap');
                    return false;
                }
            }
            for (const [res, amt] of Object.entries(card.resCost)) {
                resources[res] = Math.max(0, resources[res] - amt);
            }
        }
        player.mana = Math.min(player.maxMana, player.mana + (card.healMana || 0));
        setBattleLog(`${card.name}: Restored ${card.healMana} MP!`);
    } else if (card.effect === 'resource') {
        if (player.mana < (card.manaCost || 0)) {
            setBattleLog(`Not enough mana for ${card.name}!`);
            playSFX('tap');
            return false;
        }
        player.mana -= card.manaCost || 0;
        // Simple: restore to all resources equally
        const gain = card.healRes || 4;
        resources.forest = Math.min(MAX_RES, resources.forest + gain);
        resources.ocean  = Math.min(MAX_RES, resources.ocean  + gain);
        resources.land   = Math.min(MAX_RES, resources.land   + gain);
        setBattleLog(`${card.name}: +${gain} to all resources!`);
    } else if (card.effect === 'freemerge') {
        freeMerge = true;
        setBattleLog(`${card.name}: Next merge is FREE!`);
    }

    updatePlayerUI();
    updateResourceUI();
    return true;
}

/* =============================================
   EXECUTE MERGE
   ============================================= */
function executeMerge() {
    if (stagedCards.length !== 2) return;
    const [a, b] = stagedCards;

    // If either staged card is a harmony card, apply its effect and discard it
    let handled = false;
    for (const card of [a, b]) {
        if (card.type === 'harmony') {
            if (!executeHarmonyCard(card)) return;
            hand = hand.filter(c => c.uid !== card.uid);
            discardPile.push(card);
            handled = true;
        }
    }
    if (handled) {
        stagedCards = [];
        updateDeckCountUI();
        renderHand();
        renderDisplayZone();
        return;
    }

    // Both are wrath/merge-hand — create a merge card
    const elements = [a.element, b.element].sort();
    const key      = elements.join('_');
    const template = MERGE_TABLE[key] || MERGE_TABLE['forest_forest'];

    const mergeCost = freeMerge ? 0 : (template.manaCost || 5);
    if (player.mana < mergeCost) {
        setBattleLog(`Not enough mana to merge! Need ${mergeCost} MP.`);
        playSFX('tap');
        return;
    }
    player.mana -= mergeCost;
    freeMerge = false;

    // Both source cards go to discard
    hand = hand.filter(c => c.uid !== a.uid && c.uid !== b.uid);
    if (a.type !== 'merge-hand') discardPile.push(a);
    if (b.type !== 'merge-hand') discardPile.push(b);

    // Merge card lands back in hand
    const mergeCard = {
        ...template,
        id:  'merge_' + Date.now(),
        uid: 'merge_' + Math.random().toString(36).slice(2),
        type: 'merge-hand',
        element: elements[0]
    };
    hand.push(mergeCard);
    setBattleLog(`Merged into ${mergeCard.name}!`);

    stagedCards = [];
    updatePlayerUI();
    updateDeckCountUI();
    renderHand();
    renderDisplayZone();
}

/* =============================================
   END TURN — enemy attacks
   ============================================= */
function endTurn() {
    if (!currentEnemy || currentEnemy.hp <= 0) return;
    playSFX('tap');

    const dmg = Math.floor(Math.random() * (currentEnemy.atk || 10)) + (Math.floor((currentEnemy.atk || 10) / 2));
    player.hp = Math.max(0, player.hp - dmg);
    setBattleLog(`${currentEnemy.name} strikes back for ${dmg} damage!`);

    updatePlayerUI();

    if (player.hp <= 0) {
        onPlayerDeath();
        return;
    }

    // Refresh hand wrath slots after enemy turn
    refreshHandAfterTurn();
}

/* =============================================
   DRAW BUTTON
   ============================================= */
function addCardsFromDeck() {
    if (player.mana < 25) {
        setBattleLog('Not enough mana to draw! Need 25 MP.');
        playSFX('tap');
        return;
    }
    if (drawPile.length === 0 && discardPile.length === 0) {
        setBattleLog('No cards left to draw!');
        return;
    }
    playSFX('card');
    player.mana -= 25;
    for (let i = 0; i < 4; i++) {
        const drawn = dealFromDrawPile();
        if (drawn) hand.push(drawn);
    }
    updatePlayerUI();
    updateDeckCountUI();
    renderHand();
    document.getElementById('btn-draw').style.display = 'none';
}

/* =============================================
   ENEMY MANAGEMENT
   ============================================= */
function loadNextEnemy() {
    if (enemyIndex >= enemyQueue.length) {
        onLevelComplete();
        return;
    }
    currentEnemy = { ...enemyQueue[enemyIndex] };
    renderTrackerDots();
    updateEnemyUI();
    updatePlayerUI();
    updateResourceUI();
    renderHand();
    renderDisplayZone();
    setBattleLog(`${currentEnemy.name} steps forward!`);
}

function onEnemyDefeated() {
    setBattleLog(`${currentEnemy.name} is defeated!`);

    // Mark dot dead
    const dots = document.querySelectorAll('.tracker-dot');
    if (dots[enemyIndex]) dots[enemyIndex].classList.add('dead');

    // Partial mana/resource restore between enemies
    player.mana = Math.min(player.maxMana, player.mana + 12);
    resources.forest = Math.min(MAX_RES, resources.forest + 2);
    resources.ocean  = Math.min(MAX_RES, resources.ocean  + 2);
    resources.land   = Math.min(MAX_RES, resources.land   + 2);

    // Clear staged
    stagedCards = [];
    renderDisplayZone();

    enemyIndex++;
    setTimeout(loadNextEnemy, 900);
}

function onLevelComplete() {
    // Unlock next level
    const nodeId = `q-${currentLevelId.split('-')[1]}`;
    unlockNextLevel(nodeId);

    const victMsg = document.getElementById('victory-msg');
    if (currentLevelId === '1-3') {
        if (victMsg) victMsg.textContent = 'You have conquered Chapter 1! More to come...';
    } else {
        if (victMsg) victMsg.textContent = 'Level cleared! The path ahead opens...';
    }

    document.getElementById('level-complete-popup').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
}

function onPlayerDeath() {
    setBattleLog('You have been defeated...');
    setTimeout(() => {
        leaveBattle();
    }, 1800);
}

/* =============================================
   UI UPDATERS
   ============================================= */
function updatePlayerUI() {
    const hpPct   = (player.hp   / player.maxHp)   * 100;
    const manaPct = (player.mana / player.maxMana)  * 100;

    const hpBar   = document.getElementById('player-hp-bar');
    const manaBar = document.getElementById('player-mana-bar');
    const hpLbl   = document.getElementById('player-hp-label');
    const manaLbl = document.getElementById('player-mana-label');

    if (hpBar)   hpBar.style.width   = hpPct   + '%';
    if (manaBar) manaBar.style.width = manaPct + '%';
    if (hpLbl)   hpLbl.textContent   = `${player.hp}/${player.maxHp}`;
    if (manaLbl) manaLbl.textContent = `${player.mana}/${player.maxMana}`;
}

function updateEnemyUI() {
    if (!currentEnemy) return;
    const pct = (currentEnemy.hp / currentEnemy.maxHp) * 100;

    const bar    = document.getElementById('enemy-hp-bar');
    const lbl    = document.getElementById('enemy-hp-label');
    const nameLbl= document.getElementById('enemy-name-label');

    if (bar)     bar.style.width   = pct + '%';
    if (lbl)     lbl.textContent   = `${currentEnemy.hp}/${currentEnemy.maxHp}`;
    if (nameLbl) nameLbl.textContent = currentEnemy.name.toUpperCase();

    // Swap sprite
    const sprite = document.querySelector('.enemy-sprite');
    if (sprite && currentEnemy.sprite) sprite.src = currentEnemy.sprite;
}

function updateResourceUI() {
    const maxRes = MAX_RES;

    ['forest','ocean','land'].forEach(res => {
        const bar  = document.getElementById(`res-${res}-bar`);
        const num  = document.getElementById(`res-${res}`);
        const pct  = (resources[res] / maxRes) * 100;
        if (bar) bar.style.width = pct + '%';
        if (num) num.textContent = resources[res];
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

/* =============================================
   BATTLE LOG
   ============================================= */
function setBattleLog(text) {
    const el = document.getElementById('battle-log-text');
    if (el) el.textContent = text;
    addToLog('BATTLE', text);
}

function addToLog(name, text) {
    gameHistory.push({ name, text });
}

function toggleLog(e) {
    if (e) e.stopPropagation();
    const log  = document.getElementById('history-log');
    const cont = document.getElementById('log-content');
    if (!log) return;

    if (log.style.display === 'none' || !log.style.display) {
        if (cont) {
            cont.innerHTML = gameHistory.map(entry =>
                `<div class="log-entry">
                    <span class="log-name">${entry.name}</span>
                    <span class="log-text">${entry.text}</span>
                </div>`
            ).join('');
        }
        log.style.display = 'flex';
        document.getElementById('modal-overlay').style.display = 'block';
    } else {
        log.style.display = 'none';
        document.getElementById('modal-overlay').style.display = 'none';
    }
}

/* =============================================
   DEV SHORTCUTS
   ============================================= */
if (isDev) {
    document.addEventListener('keydown', e => {
        if (e.key === 'K') { if (currentEnemy) { currentEnemy.hp = 0; onEnemyDefeated(); } }
        if (e.key === 'H') { player.hp = player.maxHp; player.mana = player.maxMana; updatePlayerUI(); }
        if (e.key === 'R') { resources = {forest:10,ocean:10,land:10}; updateResourceUI(); }
    });
}