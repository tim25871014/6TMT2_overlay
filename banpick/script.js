let stageInfo, mappool;

(async () => {
    $.ajaxSetup({ cache: false });
    stageInfo = await $.getJSON('../_data/beatmaps.json');
    mappool = stageInfo.beatmaps;
    generateHexPicks("blue_picks", "Blue");
    generateHexPicks("red_picks", "Red");
    updateHexContent("blue_picks", "Blue");
    updateHexContent("red_picks", "Red");
})();

// 防止右鍵選單彈出
window.addEventListener('contextmenu', (e) => e.preventDefault());


//let socket = new ReconnectingWebSocket('ws://127.0.0.1:24050/ws');
let socket = new ReconnectingWebSocket('ws://127.0.0.1:3000/ws');

socket.onmessage = async (event) => {
    let data = JSON.parse(event.data);
    console.log("Received data:", data);
};

///////////////////////////

function generateHexPicks(containerId, prefix) {
    const container = document.getElementById(containerId);
    let K = 10;
    const grayIndexes = [2, 5, 8];

    for (let i = 1; i <= K; i++) {
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
}

// 更新bp顯示
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
        let background = `
            url("../_data/img/transparent_hexagon.png"),
            url("../_data/img/black_hexagon.png")`;

        if (hex.classList.contains("gray")) {
            console.log("Gray hexagon at index", idx);
            background = `
            url("../_data/img/transparent_hexagon.png"),
            url("../_data/img/gray_hexagon.png")`;
        }
        

        if (idx === 0) { // protect
            if (protect_list[0]) content = protect_list[0];
        } else {
            const sequence = (idx - 1) % 3;
            const group = Math.floor((idx - 1) / 3);
            if (sequence === 0) { // ban
                if (ban_list[group]) content = ban_list[group];
            } else {  // pick
                const pickIndex = group * 2 + (sequence === 1 ? 0 : 1);
                if (pick_list[pickIndex]) content = pick_list[pickIndex];
            }
        }

        const mapInfo = mappool.find(map => map.identifier === content);
        const mapId = mapInfo ? mapInfo.beatmap_id : "Unknown ID";
        const mapSetId = mapInfo ? mapInfo.beatmapset_id : "Unknown Set ID";
        
        if (mapId !== "Unknown ID") {
            console.log("Map Info:", mapId);
            
            if (isBlue) {
                background = `
                url("../_data/img/transparent_hexagon.png"),
                url("../_data/img/blue_hexagon.png"),
                url('https://assets.ppy.sh/beatmaps/${mapSetId}/covers/cover.jpg'),
                url("../_data/img/black_hexagon.png")`;
            } else {
                background = `
                url("../_data/img/transparent_hexagon.png"),
                url("../_data/img/red_hexagon.png"),
                url('https://assets.ppy.sh/beatmaps/${mapSetId}/covers/cover.jpg'),
                url("../_data/img/black_hexagon.png")`;
            }
        }

        picks.textContent = content;
        hex.style.backgroundImage = background;
    });
}



///////////////////////////

let blue_pick_list = [], red_pick_list = [];
let blue_ban_list = [], red_ban_list = [];
let blue_protect_list = [], red_protect_list = [];

const rows = [
    { containerId: "NM1", names: ["NM1", "NM2", "NM3", "NM4", "NM5"] },
    { containerId: "NM2", names: ["NM6", "NM7"] },
    { containerId: "HD",  names: ["HD1", "HD2", "HD3", "HD4"] },
    { containerId: "HR",  names: ["HR1", "HR2", "HR3", "HR4"] },
    { containerId: "DT",  names: ["DT1", "DT2", "DT3", "DT4", "DT5"] }
];

rows.forEach(row => {
    const container = document.getElementById(row.containerId);

    row.names.forEach(name => {
        const btn = document.createElement("div");
        btn.className = "mode-btn default";
        btn.innerText = name;

        // 左鍵按下或右鍵按下會執行這個
        btn.addEventListener("mousedown", (e) => {
            handleButtonClick(e, name);
            updateButtonColor(btn, name);
            updateHexContent("blue_picks", "Blue");
            updateHexContent("red_picks", "Red");
        });

        container.appendChild(btn);
    });
});
    
function updateButtonColor(btn, id) {
    btn.classList.remove("picked");
    if (blue_pick_list.includes(id) || red_pick_list.includes(id) || 
        blue_ban_list.includes(id)  || red_ban_list.includes(id)) {
            btn.classList.add("picked");
    }
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

    console.log("Pick:", name);
    printLists();
}


function printLists() {
    console.log("===== 狀態更新 =====");
    console.log("blue_pick_list:", blue_pick_list);
    console.log("red_pick_list:", red_pick_list);
    console.log("blue_ban_list:", blue_ban_list);
    console.log("red_ban_list:", red_ban_list);
    console.log("blue_protect_list:", blue_protect_list);
    console.log("red_protect_list:", red_protect_list);
}
