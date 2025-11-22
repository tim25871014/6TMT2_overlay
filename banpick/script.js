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

// CHAT
let chat_container = document.getElementById('chat-container');
let chat = document.getElementById('chat');
let loadedChatLen = 0;

// 處理來自tosu的訊息
socket.onmessage = async (event) => {
    let data = JSON.parse(event.data);

    // 更新聊天室
    const chatLen = data.tourney.manager.chat.length;
    if (loadedChatLen != chatLen) {

        if (loadedChatLen == 0 || (loadedChatLen > 0 && loadedChatLen > chatLen)) {
            chat.innerHTML = '';
            loadedChatLen = 0;
        }

        for (let i = loadedChatLen; i < chatLen; i++) {
            const chatMsg = data.tourney.manager.chat[i];

            if (chatMsg.name == 'BanchoBot' && chatMsg.messageBody.startsWith('Match history')) continue;

            let chatLine = document.createElement('div');
            chatLine.setAttribute('class', 'chat');

            let chatTime = document.createElement('div');
            chatTime.setAttribute('class', 'chatTime');

            let chatName = document.createElement('div');
            chatName.setAttribute('class', 'chatName');

            let chatText = document.createElement('div');
            chatText.setAttribute('class', 'chatText');

            chatTime.innerText = chatMsg.time;
            chatName.innerText = chatMsg.name + ': \xa0';
            chatText.innerText = chatMsg.messageBody;

            chatName.classList.add(chatMsg.team);

            chatLine.append(chatTime);
            chatLine.append(chatName);
            chatLine.append(chatText);
            chat.append(chatLine);

        }

        loadedChatLen = data.tourney.manager.chat.length;
        chat.scrollTop = chat.scrollHeight;
    }
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
            if (sequence === 0) { // ban
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
            console.log("Map Info:", mapId);
            bg2 = `url('https://assets.ppy.sh/beatmaps/${mapSetId}/covers/cover.jpg'),`
            bg3 = isBlue ? "url(\"../_data/img/blue_hexagon.png\")," :
                           "url(\"../_data/img/red_hexagon.png\"),"
        }

        picks.textContent = content;
        hex.style.backgroundImage = bg5 + bg4 + bg3 + bg2 + bg1;
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
