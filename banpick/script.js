let stageInfo, mappool, players;
let socket = ConnectSocket();

(async () => {
    $.ajaxSetup({ cache: false });
    stageInfo = await $.getJSON('../_data/beatmaps.json');
    players = await $.getJSON('../_data/players.json');
    mappool = stageInfo.beatmaps;

    // Initialize match information
    updateStageInfo(stageInfo);
    updateMappool(mappool);
    generateButtons();
    initializeControls();
    setupScroll();
})();

// Disable the right-click context menu
window.addEventListener('contextmenu', (e) => e.preventDefault());

// Create the marquee scrolling effect
const box = document.getElementById("scrollBox");
const content = document.getElementById("scrollContent");
function setupScroll() {
    const boxWidth = box.clientWidth;
    const contentWidth = content.scrollWidth;

    if (contentWidth <= boxWidth) { // Stop animation
        content.style.animation = '';
        content.style.transform = 'translateX(0)';
        return;
    }
    const scrollDistance = contentWidth - boxWidth;
    const pauseTime = 3; 
    const scrollTime = scrollDistance / 20;
    const totalTime = scrollTime + 2 * pauseTime;
    const startPercent = (pauseTime / totalTime) * 100;
    const endPercent = ((pauseTime + scrollTime) / totalTime) * 100;

    const style = document.createElement("style");
    style.innerHTML = `
    @keyframes jumpScroll {
        0% {transform: translateX(0);}
        ${startPercent}% {transform: translateX(0);}
        ${endPercent}% {transform: translateX(-${scrollDistance}px);}
        100% {transform: translateX(-${scrollDistance}px);}
    }`;
    document.head.appendChild(style);
    content.style.animation = `jumpScroll ${totalTime}s linear infinite`;
}

// Update currently playing beatmap information
let np_id = null;
const np_text = document.getElementById("np-text");
const np_scroll = document.getElementById("scrollContent");
const np_identifier = document.getElementById("np-identifier");
const np_container = document.getElementById("now-playing");
function updateNowPlaying(beatmapMng) {
    if (!beatmapMng) return;
    if (np_id === beatmapMng.id) return;
    np_id = beatmapMng.id;
    const title = beatmapMng.metadata.artist + " - " + beatmapMng.metadata.title;
    np_scroll.innerText = title;
    np_text.innerText = "♪ Now Playing";

    // find identifier from mappool
    const mapInfo = mappool.find(map => map.beatmap_id === np_id);
    np_identifier.innerText = mapInfo ? mapInfo.identifier : "";

    // 
    if (beatmapMng && beatmapMng.set) {
        const setId = beatmapMng.set;
        np_container.style.backgroundImage = `url('https://assets.ppy.sh/beatmaps/${setId}/covers/cover.jpg')`;
        np_container.style.backgroundPosition = 'center';
        np_container.style.backgroundSize = 'cover';
        np_container.style.backgroundRepeat = 'no-repeat';

        np_container.style.maskImage = 'linear-gradient(75deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 95%)';
        np_container.style.maskRepeat = 'no-repeat';
        np_container.style.maskPosition = 'center';
        np_container.style.maskSize = 'cover';

        if (mapInfo && autoPick) {
            console.log("Auto Pick:", mapInfo.identifier);
            if (mapInfo.identifier === 'TB') {
                tb_picked = true;
            }
            else if (blue_pick_list.length < red_pick_list.length) {
                blue_pick_list.push(mapInfo.identifier);
            }
            else if (red_pick_list.length < blue_pick_list.length) {
                red_pick_list.push(mapInfo.identifier);
            }
            else if (firstPick === 'Blue') {
                blue_pick_list.push(mapInfo.identifier);
            }
            else {
                red_pick_list.push(mapInfo.identifier);
            }
            updateHexContent("blue_picks", "Blue");
            updateHexContent("red_picks", "Red");
            updateTiebreakerContent();
            syncState();
        }
    }

    setupScroll();
}

// Handle messages from tosu
socket.onmessage = async (event) => {
    let data = JSON.parse(event.data);
    let tourneyMng = data.tourney.manager;
    let beatmapMng = data.menu.bm;
    if (!tourneyMng) return;
    
    // These helper functions are defined in _data/deps/headerHandler.js
    // The file must be loaded before using them
    updateScoreBars(tourneyMng);
    updateSeeding(tourneyMng, players);
    updateScore(tourneyMng);
    updateTeamInfo(tourneyMng);
    updateChat(tourneyMng);
    updateNowPlaying(beatmapMng, mappool);

    // Update BP display slot count in real time based on BO
    let targetNum = 0;
    if (tourneyMng.bestOF == 9) targetNum = 7;
    else if (tourneyMng.bestOF == 11) targetNum = 8;
    else targetNum = 10;
    if (hexNum !== targetNum) {
        hexNum = targetNum;
        generateHexPicks("blue_picks", "Blue");
        generateHexPicks("red_picks", "Red");
        updateHexContent("blue_picks", "Blue");
        updateHexContent("red_picks", "Red");
    }
};


///////////////////////////

// Generate BP display area
let hexNum = 0;
function generateHexPicks(containerId, prefix) {
    const container = document.getElementById(containerId);
    
    // Clear existing content
    while(container.firstChild) container.removeChild(container.firstChild);

    let grayIndexes = [];
    if (hexNum == 8) grayIndexes = [2, 5]; // BO11 uses a different pattern
    else grayIndexes = [2, 5, 8];

    if (prefix == 'Blue') {
        const info = document.createElement("div");
        info.className = "info blue";
        info.innerText = "Blue Side";
        container.appendChild(info);
    }

    for (let i = 1; i <= hexNum; i++) {
        const hex = document.createElement("div");
        const picks = document.createElement("div");
        picks.className = "picks";
        picks.textContent = `${prefix} ${i}`;
        picks.dataset.index = i;
        hex.appendChild(picks);
        hex.className = "hexagon";
        hex.dataset.index = i;
        if (grayIndexes.includes(i)) hex.classList.add("gray");
        container.appendChild(hex);
    }

    if (prefix == 'Red') {
        const info = document.createElement("div");
        info.className = "info red";
        info.innerText = "Red Side";
        container.appendChild(info);
    }
}

// Update BP display content
function updateHexContent(containerId, prefix) {
    const container = document.getElementById(containerId);
    const hexes = container.querySelectorAll(".hexagon");

    const isBlue = (containerId === "blue_picks");
    const pick_list = isBlue ? blue_pick_list : red_pick_list;
    const ban_list = isBlue ? blue_ban_list : red_ban_list;
    const protect_list = isBlue ? blue_protect_list : red_protect_list;

    hexes.forEach((hex, i) => {
        const picks = hex.querySelector(".picks");
        const idx = i; // 0-based index

        // Default text content
        let content = "";
        
        // Default background layers
        let bg1 = hex.classList.contains("gray") ?
            "url(\"../_data/img/gray_hexagon.png\")" :
            "url(\"../_data/img/black_hexagon.png\")";
        let bg2 = "";
        let bg3 = "";
        let bg4 = "";
        let bg5 = "url(\"../_data/img/transparent_hexagon.png\"),";
        
        // BP order: protect -> ban -> pick -> pick -> ban -> pick -> pick ...
        if (idx === 0) { // protect
            if (protect_list[0]) {
                content = protect_list[0];
                bg4 = "url(\"../_data/img/protected.png\"),"
            }
        } else {
            const sequence = (idx - 1) % 3;
            const group = Math.floor((idx - 1) / 3);
            if (hexNum == 8 && idx == 7) { // BO11 special case: the last slot is a pick
                const pickIndex = 4;
                if (pick_list[pickIndex]) {
                    content = pick_list[pickIndex];
                    bg4 = "url(\"../_data/img/picked.png\"),"
                }
            }
            else if (sequence === 0) { // ban
                if (ban_list[group]) {
                    content = ban_list[group];
                    bg4 = "url(\"../_data/img/banned.png\"),"
                }
            } else {  // pick
                const pickIndex = group * 2 + (sequence === 1 ? 0 : 1);
                if (pick_list[pickIndex]) {
                    content = pick_list[pickIndex];
                    bg4 = "url(\"../_data/img/picked.png\"),"
                }
            }
        }

        const mapInfo = mappool.find(map => map.identifier === content);
        const mapId = mapInfo ? mapInfo.beatmap_id : "Unknown ID";
        const mapSetId = mapInfo ? mapInfo.beatmapset_id : "Unknown Set ID";
        
        if (mapId !== "Unknown ID") {
            bg2 = `url('https://assets.ppy.sh/beatmaps/${mapSetId}/covers/cover.jpg'),`
            bg3 = isBlue ? "url(\"../_data/img/blue_hexagon.png\")," : "url(\"../_data/img/red_hexagon.png\"),";
        }

        picks.textContent = content;
        hex.style.backgroundImage = bg5 + bg4 + bg3 + bg2 + bg1;
    });
}

// Handle TB selection
function tiebreakerPick(event) {
    tb_picked = (event.shiftKey) ? false : true;
    updateTiebreakerContent();
    syncState();
}

// Update TB display content
function updateTiebreakerContent() {
    const tieBreaker = document.getElementById("tie-breaker");
    const tieTitle = tieBreaker.querySelector("#title");

    const mapInfo = mappool.find(map => map.identifier === 'TB');
    const mapSetId = mapInfo ? mapInfo.beatmapset_id : "Unknown Set ID";
    const artist = mapInfo ? mapInfo.artist : "Unknown Artist";
    const title = mapInfo ? mapInfo.title : "Unknown Title";

    tieBreaker.classList.remove("show");
    if (!tb_picked) return;

    // Replace background image
    tieBreaker.style.setProperty(
        "--before-bg",
        `url('https://assets.ppy.sh/beatmaps/${mapSetId}/covers/cover.jpg')`
    );

    tieTitle.innerText = `${artist} - ${title}`;

    void tieBreaker.offsetWidth;
    tieBreaker.classList.add("show");
}

///////////////////////////

let tb_picked = false;
let blue_pick_list = [], red_pick_list = [];
let blue_ban_list = [], red_ban_list = [];
let blue_protect_list = [], red_protect_list = [];
let rows = [];

// Detect available map count
function updateMappool(mappool) {

    const idSet = new Set(mappool.map(b => b.identifier));
    rows = [
        { containerId: "NM1", names: ["NM1", "NM2", "NM3", "NM4", "NM5"] },
        { containerId: "NM2", names: ["NM6", "NM7"] },
        { containerId: "HD", names: ["HD1", "HD2", "HD3", "HD4"] },
        { containerId: "HR", names: ["HR1", "HR2", "HR3", "HR4"] },
        { containerId: "DT", names: ["DT1", "DT2", "DT3", "DT4", "DT5"] }
    ];

    // Keep only maps that exist in beatmaps
    rows = rows.map(row => ({
        containerId: row.containerId,
        names: row.names.filter(name => idSet.has(name))
    }));
}


// Generate BP buttons and attach event listeners
function generateButtons() {
    rows.forEach(row => {
        const container = document.getElementById(row.containerId);

        row.names.forEach(name => {
            const btn = document.createElement("div");
            btn.className = "mode-btn default";
            btn.innerText = name;

            // Run this for both left-click and right-click
            btn.addEventListener("mousedown", (e) => {
                handleButtonClick(e, name);
                updatePanelPicked();
                updateHexContent("blue_picks", "Blue");
                updateHexContent("red_picks", "Red");
            });

            container.appendChild(btn);
        });
    });
}

// Update selected state of buttons
function updatePanelPicked() {
    const panel = document.getElementById("panel");
    if (!panel) return;

    const allLists = [blue_pick_list, red_pick_list, blue_ban_list, red_ban_list];
    const items = panel.querySelectorAll("*");
    items.forEach(item => {
        const text = item.innerText.trim();
        item.classList.remove("picked");
        if (allLists.some(list => list.includes(text))) {
            item.classList.add("picked");
        }
    });
}

function handleButtonClick(e, name) {
    // Prevent the browser context menu from opening
    e.preventDefault();
    e.stopPropagation();

    function addToList(list, value) {
        if (!list.includes(value)) list.push(value);
    }

    function removeFromAll(value) {
        const allLists = [blue_pick_list, red_pick_list, blue_ban_list, red_ban_list, blue_protect_list, red_protect_list];
        allLists.forEach(list => {
            const index = list.indexOf(value);
            if (index !== -1) list.splice(index, 1);
        });
    }
   
    const isLeft = (e.button === 0);
    if (e.shiftKey) removeFromAll(name); // Shift: remove from all lists
    else if (e.ctrlKey) addToList(isLeft ? blue_ban_list : red_ban_list, name); // ctrl：Ban
    else if (e.altKey) addToList(isLeft ? blue_protect_list : red_protect_list, name); // alt：Protect
    else addToList(isLeft ? blue_pick_list : red_pick_list, name); // Normal click: Pick

    syncState();
}

///////////////////////////

// Sync BP state to localStorage (write)
function syncState() {
    const state = {
        blue_pick_list, red_pick_list, blue_ban_list,
        red_ban_list, blue_protect_list, red_protect_list,
        autoPick, firstPick, tb_picked
    };
    localStorage.setItem("banpick_state", JSON.stringify(state));
    printLists();
}

// Listen for localStorage changes and refresh state (read)
window.addEventListener("storage", (event) => {
    if (event.key === "banpick_state") {
        const newState = JSON.parse(event.newValue);
        blue_pick_list = newState.blue_pick_list;
        red_pick_list = newState.red_pick_list;
        blue_ban_list = newState.blue_ban_list;
        red_ban_list = newState.red_ban_list;
        blue_protect_list = newState.blue_protect_list;
        red_protect_list = newState.red_protect_list;
        autoPick = newState.autoPick;
        firstPick = newState.firstPick;
        tb_picked = newState.tb_picked;
        initializeControls();
        updateHexContent("blue_picks", "Blue");
        updateHexContent("red_picks", "Red");
        updatePanelPicked();
        updateTiebreakerContent();
        printLists();
    }
    
});

window.addEventListener("storage", (event) => {
    if (event.key === "banpick_switch") {
        console.log("Received control switch event");
        const switchData = JSON.parse(event.newValue);
        if (switchData.switchAuto) switchAutoPick();
        if (switchData.switchNow) switchFirstPick();
    }
});

// Print current list states (for debugging)
function printLists() {
    /*
    console.log("===== 狀態更新 =====");
    console.log("blue_pick_list:", blue_pick_list);
    console.log("red_pick_list:", red_pick_list);
    console.log("blue_ban_list:", blue_ban_list);
    console.log("red_ban_list:", red_ban_list);
    console.log("blue_protect_list:", blue_protect_list);
    console.log("red_protect_list:", red_protect_list);
    console.log("autoPick:", autoPick);
    console.log("firstPick:", firstPick);
    console.log("tb_picked:", tb_picked);
    console.log("====================");
    */
}

// Control auto-pick and current first-pick side
let autoPick = false;
let firstPick = 'Blue';
function initializeControls() {
    document.getElementById("auto-pick").innerText = `Auto Pick: ${autoPick ? 'ON' : 'OFF'}`;
    document.getElementById("first-pick").innerText = `First Pick: ${firstPick}`;
}
function switchAutoPick() {
    autoPick = !autoPick;
    document.getElementById("auto-pick").innerText = `Auto Pick: ${autoPick ? 'ON' : 'OFF'}`;
    syncState();
}
function switchFirstPick() {
    firstPick = (firstPick === 'Blue') ? 'Red' : 'Blue';
    document.getElementById("first-pick").innerText = `First Pick: ${firstPick}`;
    syncState();
}

