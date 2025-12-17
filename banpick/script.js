let stageInfo, mappool, players;
//let socket = new ReconnectingWebSocket('ws://127.0.0.1:24050/ws');
let socket = new ReconnectingWebSocket('ws://127.0.0.1:3000/ws');

(async () => {
    $.ajaxSetup({ cache: false });
    stageInfo = await $.getJSON('../_data/beatmaps.json');
    players = await $.getJSON('../_data/players.json');
    mappool = stageInfo.beatmaps;

    // 初始化比賽資訊
    updateStageInfo(stageInfo);
    updateMappool(mappool);
    generateButtons();
    initializeControls();
    setupScroll();
})();

// 禁用右鍵選單
window.addEventListener('contextmenu', (e) => e.preventDefault());

// 建立跑馬燈效果
const box = document.getElementById("scrollBox");
const content = document.getElementById("scrollContent");
function setupScroll() {
    const boxWidth = box.clientWidth;
    const contentWidth = content.scrollWidth;

    if (contentWidth <= boxWidth) { // 停止動畫
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

// 更新正在進行的譜面資訊
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

// 處理來自tosu的訊息
socket.onmessage = async (event) => {
    let data = JSON.parse(event.data);
    let tourneyMng = data.tourney.manager;
    let beatmapMng = data.menu.bm;
    if (!tourneyMng) return;
    
    // 這些函數都寫在 _data/deps/headerHandler.js 裡
    // 必須先載入那個檔案才能用
    updateScoreBars(tourneyMng);
    updateSeeding(tourneyMng, players);
    updateScore(tourneyMng);
    updateTeamInfo(tourneyMng);
    updateChat(tourneyMng);
    updateNowPlaying(beatmapMng, mappool);

    // 即時根據bo數更新bp顯示區數量
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

// 生成bp顯示區
let hexNum = 0;
function generateHexPicks(containerId, prefix) {
    const container = document.getElementById(containerId);
    
    // 清空現有內容
    while(container.firstChild) container.removeChild(container.firstChild);

    let grayIndexes = [];
    if (hexNum == 8) grayIndexes = [2, 5]; // BO11時規律不一樣
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

// 更新bp顯示內容
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

        // 預設內容
        let content = "";
        
        // 預設背景
        let bg1 = hex.classList.contains("gray") ?
            "url(\"../_data/img/gray_hexagon.png\")" :
            "url(\"../_data/img/black_hexagon.png\")";
        let bg2 = "";
        let bg3 = "";
        let bg4 = "";
        let bg5 = "url(\"../_data/img/transparent_hexagon.png\"),";
        
        // bp順序: protect -> ban -> pick -> pick -> ban -> pick -> pick ...
        if (idx === 0) { // protect
            if (protect_list[0]) {
                content = protect_list[0];
                bg4 = "url(\"../_data/img/protected.png\"),"
            }
        } else {
            const sequence = (idx - 1) % 3;
            const group = Math.floor((idx - 1) / 3);
            if (hexNum == 8 && idx == 7) { // BO11特例：最後一個是pick
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

// TB選圖
function tiebreakerPick(event) {
    tb_picked = (event.shiftKey) ? false : true;
    updateTiebreakerContent();
    syncState();
}

// 更新TB顯示內容
function updateTiebreakerContent() {
    const tieBreaker = document.getElementById("tie-breaker");
    const tieTitle = tieBreaker.querySelector("#title");

    const mapInfo = mappool.find(map => map.identifier === 'TB');
    const mapSetId = mapInfo ? mapInfo.beatmapset_id : "Unknown Set ID";
    const artist = mapInfo ? mapInfo.artist : "Unknown Artist";
    const title = mapInfo ? mapInfo.title : "Unknown Title";

    tieBreaker.classList.remove("show");
    if (!tb_picked) return;

    // 替換背景
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

// 偵測圖譜數量
function updateMappool(mappool) {

    const idSet = new Set(mappool.map(b => b.identifier));
    rows = [
        { containerId: "NM1", names: ["NM1", "NM2", "NM3", "NM4", "NM5"] },
        { containerId: "NM2", names: ["NM6", "NM7"] },
        { containerId: "HD", names: ["HD1", "HD2", "HD3", "HD4"] },
        { containerId: "HR", names: ["HR1", "HR2", "HR3", "HR4"] },
        { containerId: "DT", names: ["DT1", "DT2", "DT3", "DT4", "DT5"] }
    ];

    // 只留下存在於beatmaps的圖譜
    rows = rows.map(row => ({
        containerId: row.containerId,
        names: row.names.filter(name => idSet.has(name))
    }));
}


// 生成bp按鈕並加入事件監聽
function generateButtons() {
    rows.forEach(row => {
        const container = document.getElementById(row.containerId);

        row.names.forEach(name => {
            const btn = document.createElement("div");
            btn.className = "mode-btn default";
            btn.innerText = name;

            // 左鍵按下或右鍵按下會執行這個
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

// 更新按鈕被選取狀態
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
    // 阻止右鍵選單彈出
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
    if (e.shiftKey) removeFromAll(name); // shift：從全部 list 移除
    else if (e.ctrlKey) addToList(isLeft ? blue_ban_list : red_ban_list, name); // ctrl：Ban
    else if (e.altKey) addToList(isLeft ? blue_protect_list : red_protect_list, name); // alt：Protect
    else addToList(isLeft ? blue_pick_list : red_pick_list, name); // 一般點擊：Pick

    syncState();
}

///////////////////////////

// 同步bp狀態到 localStorage (寫入)
function syncState() {
    const state = {
        blue_pick_list, red_pick_list, blue_ban_list,
        red_ban_list, blue_protect_list, red_protect_list,
        autoPick, firstPick, tb_picked
    };
    localStorage.setItem("banpick_state", JSON.stringify(state));
    printLists();
}

// 監聽 localStorage 變更以更新狀態 (讀取)
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

// 印出目前各 list 狀態（除錯用）
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

// 控制自動選圖與當前選圖隊伍
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