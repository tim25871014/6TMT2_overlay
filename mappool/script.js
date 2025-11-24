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
let np_id = 0;
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

};




///////////////////////////

let blue_pick_list = [], red_pick_list = [];
let blue_ban_list = [], red_ban_list = [];
let blue_protect_list = [], red_protect_list = [];
let rows = [];

// 偵測圖譜數量
function updateMappool(mappool) {

    const idSet = new Set(mappool.map(b => b.identifier));
    rows = [
        { containerId: "NM", names: ["NM1", "NM2", "NM3", "NM4", "NM5", "NM6", "NM7"] },
        { containerId: "HD", names: ["HD1", "HD2", "HD3", "HD4"] },
        { containerId: "HR", names: ["HR1", "HR2", "HR3", "HR4"] },
        { containerId: "DT", names: ["DT1", "DT2", "DT3", "DT4", "DT5"] },
        { containerId: "TB", names: ["TB"] }
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
            const btnId = document.createElement("div");
            const btnBP = document.createElement("div");

            btn.className = "mode-btn default";
            btnId.className = "btn-id";
            btnBP.className = "btn-bp";

            btn.appendChild(btnId);
            console.log("btnBP");
            btn.appendChild(btnBP);

            // 在mappool尋找identifier=name的圖譜
            const mapInfo = mappool.find(map => map.identifier === name);
            const setId = mapInfo ? mapInfo.beatmapset_id : null;
            let color, color2;
            if (name.startsWith("NM")) color = "#a5c6e9", color2 = "#20487d";
            else if (name.startsWith("HD")) color = "#f1eba1", color2 = "#8b7f29";
            else if (name.startsWith("HR")) color = "#eda3a3", color2 = "#942d2d";
            else if (name.startsWith("DT")) color = "#c0a2c8", color2 = "#582b87";
            else color = "#999999", color2 = "#252525";

            if (setId) {
                if (name.startsWith("TB")) {
                    btn.style.backgroundImage = `
                    linear-gradient(to bottom, ${color} 0%, ${color} 15%, transparent 15%, transparent 50%, black 100%),
                    url("https://assets.ppy.sh/beatmaps/${setId}/covers/cover.jpg")`;
                }
                else {
                    btn.style.backgroundImage = `
                    linear-gradient(to bottom, ${color} 0%, ${color} 25%, transparent 25%, transparent 50%, black 100%),
                    url("https://assets.ppy.sh/beatmaps/${setId}/covers/cover.jpg")`;
                }
            }
            
            if (name.startsWith("TB")) btnId.innerText = "Tiebreaker";
            else btnId.innerText = name;
            btnId.style.color = color2;

            // 左鍵按下或右鍵按下會執行這個
            btn.addEventListener("mousedown", (e) => {
                handleButtonClick(e, name);
                updatePanelPicked();
            });

            container.appendChild(btn);
        });
    });
}

// 更新按鈕被選取狀態
function updatePanelPicked() {
    const panel = document.getElementById("panel");
    if (!panel) return;

    const pickLists = [blue_pick_list, red_pick_list];
    const banLists = [blue_ban_list, red_ban_list];
    const protectLists = [blue_protect_list, red_protect_list];
    const redList = [red_pick_list, red_ban_list, red_protect_list];
    const blueList = [blue_pick_list, blue_ban_list, blue_protect_list];

    const items = panel.querySelectorAll(".btn-id");
    items.forEach(item => {
        const parent = item.parentElement;
        const text = item.innerText.trim();
        parent.classList.remove("picked", "banned", "protected", "red-team", "blue-team");
        if (pickLists.some(list => list.includes(text))) parent.classList.add("picked");
        if (banLists.some(list => list.includes(text))) parent.classList.add("banned");
        if (protectLists.some(list => list.includes(text))) parent.classList.add("protected");
        if (redList.some(list => list.includes(text))) parent.classList.add("red-team");
        if (blueList.some(list => list.includes(text))) parent.classList.add("blue-team");
    });

    const bps = panel.querySelectorAll(".btn-bp");
    bps.forEach(bp => {
        const parent = bp.parentElement;
        let text = "";

        if (parent.classList.contains("picked")) text += "pick";
        else if (parent.classList.contains("banned")) text += "ban";
        else if (parent.classList.contains("protected")) text += "protect";

        bp.style.backgroundColor = parent.classList.contains("red-team") ? "#9b0c13" :
            parent.classList.contains("blue-team") ? "#314996" :
                             "transparent";
        bp.innerText = text;
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
        red_ban_list, blue_protect_list, red_protect_list
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
        updatePanelPicked();
        printLists();
    }
});

// 印出目前各 list 狀態（除錯用）
function printLists() {
    console.log("===== 狀態更新 =====");
    console.log("blue_pick_list:", blue_pick_list);
    console.log("red_pick_list:", red_pick_list);
    console.log("blue_ban_list:", blue_ban_list);
    console.log("red_ban_list:", red_ban_list);
    console.log("blue_protect_list:", blue_protect_list);
    console.log("red_protect_list:", red_protect_list);
}


