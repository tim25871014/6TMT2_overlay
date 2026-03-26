let stageInfo, mappool, players;
let socket = ConnectSocket();

(async () => {
    $.ajaxSetup({ cache: false });
    stageInfo = await $.getJSON('../_data/beatmaps.json');
    players = await $.getJSON('../_data/players.json');
    mappool = stageInfo.beatmaps;

    // 初始化比賽資訊
    updateStageInfo(stageInfo);
    updateMappool(mappool);
    generateButtons();
})();

// 處理來自tosu的訊息
socket.onmessage = async (event) => {
    let data = JSON.parse(event.data);
    let tourneyMng = data.tourney.manager;
    let gameplayMng = data.gameplay;
    let beatmapMng = data.menu.bm;
    let strainMng = data.menu.pp;
    let modMng = data.menu.mods;
    let ipcMng = data.tourney.ipcClients;
    if (!tourneyMng) return;

    // 這些函數都寫在 _data/deps/headerHandler.js 裡
    // 必須先載入那個檔案才能用
    updateNowPlaying(beatmapMng, strainMng, gameplayMng);
    setupStrainChart(strainMng);
    updateProgressBar(beatmapMng);
    updateMapInfo(beatmapMng, gameplayMng);
};


// 更新正在進行的譜面資訊
let np_id = null;
const np_identifier = document.getElementById("np-identifier");
const np_artist = document.getElementById("np-artist");
const np_title = document.getElementById("np-title");
const np_difficulty = document.getElementById("np-difficulty");
const np_container = document.getElementById("now-playing");
const map_id = document.getElementById("map-id");
const map_replay = document.getElementById("replay-by");
const map_drain = document.getElementById("map-drain");
const map_combo = document.getElementById("map-combo");
const map_bpm = document.getElementById("map-bpm");
const map_sr = document.getElementById("map-sr");
const map_cs = document.getElementById("map-cs");
const map_ar = document.getElementById("map-ar");
const map_od = document.getElementById("map-od");
let coolDownTimer = 0;

function updateMapInfo(beatmapMng, gameplayMng) {
    const now = Date.now();
    if (now - coolDownTimer < 1000) return;
    coolDownTimer = now;

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds) % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    map_replay.innerText = `${gameplayMng.name || "Unknown"}`;
    map_drain.innerText = `${formatTime(beatmapMng.time.full / 1000)}`;
    map_combo.innerText = `${beatmapMng.stats.maxCombo}x`;
    map_bpm.innerText = `${Math.round(beatmapMng.stats.BPM.common)}`;
    map_sr.innerText = `★${beatmapMng.stats.fullSR.toFixed(2)}`;
    map_cs.innerText = `${beatmapMng.stats.CS.toFixed(1)}`;
    map_ar.innerText = `${beatmapMng.stats.AR.toFixed(1)}`;
    map_od.innerText = `${beatmapMng.stats.OD.toFixed(1)}`;
}

function updateNowPlaying(beatmapMng, strainMng) {
    if (!beatmapMng) return;
    if (np_id === beatmapMng.id) return;
    np_id = beatmapMng.id; 

    np_title.innerText = beatmapMng.metadata.title;
    np_artist.innerText = beatmapMng.metadata.artist;
    np_difficulty.innerText = "[" + beatmapMng.metadata.difficulty + "] by " + beatmapMng.metadata.mapper;

    if (beatmapMng.id === 0) map_id.innerText = `Custom`; 
    else map_id.innerText = `${beatmapMng.id}`;

    // find identifier from mappool
    if(mappool) {
        const mapInfo = mappool.find(map => map.beatmap_id === np_id);
        if(!mapInfo) {
            // find by song name if not found by id
            const mapInfoByName = mappool.find(map => map.title === beatmapMng.metadata.title);
            np_identifier.innerText = mapInfoByName ? mapInfoByName.identifier : "";
        } else {
            np_identifier.innerText = mapInfo.identifier;
        }
    }

    // 
    if (beatmapMng && beatmapMng.set) {
        const setId = beatmapMng.set;
        np_container.style.backgroundImage = `url('https://assets.ppy.sh/beatmaps/${setId}/covers/cover.jpg')`;
        np_container.style.backgroundPosition = 'center';
        np_container.style.backgroundSize = 'cover';
        np_container.style.backgroundRepeat = 'no-repeat';

        np_container.style.maskImage = 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 95%)';
        np_container.style.maskRepeat = 'no-repeat';
        np_container.style.maskPosition = 'center';
        np_container.style.maskSize = 'cover';
    }

    updatePanelPicked();
    setTimeout(() => { queryUpdateChart = true; }, 200);
}

// 更新難度圖表
queryUpdateChart = false;
function setupStrainChart(strainMng) {
    if (!strainMng || !queryUpdateChart) return;
    queryUpdateChart = false;
    updateStrainChart(strainMng);
}

let lastUpdateProgress = 0;
const progressBar = document.getElementById("progress-bar");
const timeEllapse = document.getElementById("time-ellapse");
const timePercentage = document.getElementById("time-percentage");
function updateProgressBar(beatmapMng) {
    if (!beatmapMng || !beatmapMng.time) return;
    const now = Date.now();
    if (now - lastUpdateProgress < 50) return;
    lastUpdateProgress = now;

    const progress = beatmapMng.time.current / beatmapMng.time.mp3;
    progressBar.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;

    // 時間顯示
    const elapsedSeconds = Math.floor(beatmapMng.time.current / 1000);
    const totalSeconds = Math.floor(beatmapMng.time.mp3 / 1000);
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    timeEllapse.innerText = `${formatTime(elapsedSeconds)} / ${formatTime(totalSeconds)}`;
    timePercentage.innerText = `${Math.min(100, Math.max(0, progress * 100)).toFixed(0)}%`;
}


const div = document.getElementById("myChart");
let strainChart = null;
function updateStrainChart(strainMng) {
    const canvas = document.getElementById("myChart");

    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        existingChart.destroy();
    }

    function groupAndAverage(arr, size = 10) {
        const result = [];
        for (let i = 0; i < arr.length; i += size) {
            const group = arr.slice(i, i + size);
            const avg = group.reduce((sum, num) => sum + num, 0) / group.length;
            result.push(...Array(group.length).fill(avg));
        }
        return result;
    }

    const dataArray = strainMng.strains;
    const K = Math.ceil(dataArray.length / 100);
    const averages = groupAndAverage(dataArray, K);
    const maxValue = Math.max(...averages);
    const bgColors = averages.map(v => `rgba(255,255,255,${v / maxValue})`);

    strainChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: averages.map((_, i) => i),
            datasets: [{
                data: averages,
                backgroundColor: bgColors
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });
}



// 偵測圖譜數量
let rows = [];
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
            container.appendChild(btn);
        });
    });
}

// 更新mappool已選取的圖譜
function updatePanelPicked() {

    // 取得np_identifier內的文字
    const identifier = np_identifier.innerText.trim();
    if (!identifier) return;

    const panel = document.getElementById("panel");
    if (!panel) return;

    // allList 取得 mappool中所有元素的identifier
    const allLists = mappool.map(map => map.identifier);

    // prevlist 取得 allList 中所有在 identifier 之前的元素
    const prevlist = [];
    for (const id of allLists) {
        if (id === identifier) break;
        prevlist.push(id);
    }

    const items = panel.querySelectorAll("*");
    items.forEach(item => {
        const text = item.innerText.trim();
        item.classList.remove("picked");
        if (prevlist.includes(text)) item.classList.add("picked");
    });
}

