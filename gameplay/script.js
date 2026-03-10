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
    setupScroll();
})();

// 分數動畫物件 (參照 https://inorganik.github.io/countUp.js/)
let scoreAnimation = {
    blue_score: new CountUp('score-blue', 0, 0, 0, .3, { useEasing: true, useGrouping: true, separator: ',', decimal: '.', suffix: '' }),
    red_score: new CountUp('score-red', 0, 0, 0, .3, { useEasing: true, useGrouping: true, separator: ',', decimal: '.', suffix: '' }),
    score_diff: new CountUp('score-diff', 0, 0, 0, .3, { useEasing: true, useGrouping: true, separator: ',', decimal: '.', suffix: '' }),
}

// 處理來自tosu的訊息
socket.onmessage = async (event) => {
    let data = JSON.parse(event.data);
    let tourneyMng = data.tourney.manager;
    let beatmapMng = data.menu.bm;
    let strainMng = data.menu.pp;
    let modMng = data.menu.mods;
    let ipcMng = data.tourney.ipcClients;
    if (!tourneyMng) return;

    // 這些函數都寫在 _data/deps/headerHandler.js 裡
    // 必須先載入那個檔案才能用
    updateScoreBars(tourneyMng);
    updateSeeding(tourneyMng, players);
    updateScore(tourneyMng);
    updateTeamInfo(tourneyMng);
    updateChat(tourneyMng);
    updateChatVisibility(tourneyMng);
    updateGameplayScore(tourneyMng, ipcMng);
    updateNowPlaying(beatmapMng, strainMng);
    setupStrainChart(strainMng);
    updateProgressBar(beatmapMng);
    updateMapInfo(beatmapMng, modMng, ipcMng);
};

// 切換分數顯示與聊天視窗
let scoreVisible;
let top_footer = document.getElementById("top-footer");
let progress_container = document.getElementById("progress-container");
function updateChatVisibility(tourneyMng) {
    if (scoreVisible === tourneyMng.bools.scoreVisible) return;
    const chatContainer = document.getElementById("chat-container");
    scoreVisible = tourneyMng.bools.scoreVisible;

    if (scoreVisible) {
        chatContainer.style.display = "none";
        chatContainer.style.opacity = 0;
        top_footer.style.opacity = 1;
        score_diff.style.opacity = 1;
        progress_container.style.opacity = 1;
    } else {
        chatContainer.style.display = "block";
        chatContainer.style.opacity = 1;
        top_footer.style.opacity = 0;
        score_diff.style.opacity = 0;
        progress_container.style.opacity = 0;
    }
}

// 更新雙方及時分數
let blue_score = document.getElementById('score-blue');
let red_score = document.getElementById('score-red');
let score_diff = document.getElementById('score-diff');
let lead_bar = document.getElementById('lead-bar');
let last_score_update = 0;
function updateGameplayScore(tourneyMng, ipcMng) {
    if (!tourneyMng || !scoreVisible) return;
    let now = Date.now();

    scoreRed = tourneyMng.gameplay.score.right;
    scoreBlue = tourneyMng.gameplay.score.left;

    if (ipcMng[0] && ipcMng[0].gameplay.mods.str.includes('EZ')) scoreBlue *= 1.8;
    if (ipcMng[1] && ipcMng[1].gameplay.mods.str.includes('EZ')) scoreRed *= 1.8;

    let scorediff = Math.abs(scoreBlue - scoreRed);

    scoreAnimation.blue_score.update(scoreBlue);
    scoreAnimation.red_score.update(scoreRed);
    scoreAnimation.score_diff.update(scorediff);

    if (scoreBlue > scoreRed) {
        blue_score.style.fontSize = '1.1em';
        red_score.style.fontSize = '0.8em';

        if (now - last_score_update > 300) {
            last_score_update = now;
            score_diff.style.opacity = 1;
            lead_bar.style.width = 400 * (Math.min(0.5, Math.pow(scorediff / 1000000, 0.65)) * 2) + 'px';
            lead_bar.style.right = '960px';
            lead_bar.style.left = 'unset';
            score_diff.setAttribute('data-before', '+');
            score_diff.style.left = '47.6%';
            score_diff.style.color = '#9eb4dd';
            lead_bar.style.borderRight = 'unset';
            lead_bar.style.borderLeft = '5px solid #9eb4dd';
        }
    }
    else if (scoreRed > scoreBlue) {
        red_score.style.fontSize = '1.1em';
        blue_score.style.fontSize = '0.8em';

        if (now - last_score_update > 300) {
            last_score_update = now;
            score_diff.style.opacity = 1;
            lead_bar.style.width = 400 * (Math.min(0.5, Math.pow(scorediff / 1000000, 0.65)) * 2) + 'px';
            lead_bar.style.right = 'unset';
            lead_bar.style.left = '960px';
            score_diff.setAttribute('data-before', '+');
            score_diff.style.left = '52.4%';
            score_diff.style.color = '#f2a1a1';
            lead_bar.style.borderRight = '5px solid #f2a1a1';
            lead_bar.style.borderLeft = 'unset';
        }
    }
    else {
        score_diff.style.opacity = 0;
        blue_score.style.fontSize = '1em';
        red_score.style.fontSize = '1em';
        lead_bar.style.width = '0px';
    }

}

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
function updateNowPlaying(beatmapMng, strainMng) {
    if (!beatmapMng) return;
    if (np_id === beatmapMng.id) return;
    np_id = beatmapMng.id;
    const title = beatmapMng.metadata.artist + " - " + beatmapMng.metadata.title;

    np_scroll.innerText = title;
    np_text.innerText = "♪ Now Playing";

    // find identifier from mappool
    if (mappool) {
        const mapInfo = mappool.find(map => map.beatmap_id === np_id);
        np_identifier.innerText = mapInfo ? mapInfo.identifier : "";
    }

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

    setTimeout(() => {queryUpdateChart = true;}, 200);
    setupScroll();
}

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


// 更新譜面資訊區域
const mapDrain = document.getElementById('map-drain');
const mapBPM = document.getElementById('map-bpm');
const mapSR = document.getElementById('map-sr');
const mapCS = document.getElementById('map-cs');
const mapAR = document.getElementById('map-ar');
const mapOD = document.getElementById('map-od');
const mapMod = document.getElementById('map-mod');
let mapAndMods;
function updateMapInfo(beatmapMng, modMng, ipcMng) {

    const currentMapAndMods = beatmapMng ? `${beatmapMng.id}-${modMng.num}` : null;
    if (mapAndMods === currentMapAndMods) return;
    mapAndMods = currentMapAndMods;

    if (ipcMng.length == 0) { // 本機端
        
        mapMod.innerText = modMng.str == "" ? "NM stats" : `${modMng.str} stats`;

        if (!beatmapMng || !beatmapMng.stats) return;

        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds) % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        mapDrain.innerText = `Drain ${formatTime(beatmapMng.time.full / 1000)}`;
        mapBPM.innerText = `BPM ${beatmapMng.stats.BPM.common}`;
        mapSR.innerText = `SR ${beatmapMng.stats.fullSR.toFixed(2)}`;
        mapCS.innerText = `CS ${beatmapMng.stats.CS.toFixed(1)}`;
        mapAR.innerText = `AR ${beatmapMng.stats.AR.toFixed(1)}`;
        mapOD.innerText = `OD ${beatmapMng.stats.OD.toFixed(1)}`;
    }
    else { // tourney client 端

        // 從mappool裡找map.beatmap_id = beatmapMng.id的元素
        const mapInfo = mappool.find(map => map.beatmap_id === beatmapMng.id);
        const applyMod = mapInfo ? mapInfo.mods : null;
        
        let sr_after = mapInfo ? mapInfo.sr : beatmapMng.stats.fullSR;
        let cs_after = beatmapMng.stats.CS;
        let ar_after = beatmapMng.stats.AR;
        let od_after = beatmapMng.stats.OD;
        let bpm_after = beatmapMng.stats.BPM.common;
        let drain_after = beatmapMng.time.full;

        if (applyMod) {
            if (applyMod.includes('HR')) {
                cs_after = Math.min(10, cs_after * 1.3);
                ar_after = Math.min(10, ar_after * 1.4);
                od_after = Math.min(10, od_after * 1.4);
            }
            if (applyMod.includes('DT')) {
                ar_after = (2 * ar_after + 13) / 3;
                od_after = (2 * od_after + 13) / 3 + 1 / 9;
                bpm_after = Math.round(bpm_after * 1.5);
                drain_after = Math.round(drain_after / 1.5);
            }
        }

        mapMod.innerText = applyMod == "" ? "NM stats" : `${applyMod} stats`;

        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds) % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        mapDrain.innerText = `Drain ${formatTime(drain_after / 1000)}`;
        mapBPM.innerText = `BPM ${bpm_after}`;
        mapSR.innerText = `SR ★${sr_after.toFixed(2)}`;
        mapCS.innerText = `CS ${cs_after.toFixed(1)}`;
        mapAR.innerText = `AR ${ar_after.toFixed(1)}`;
        mapOD.innerText = `OD ${od_after.toFixed(1)}`;
    }

    enlargeNumbersInMapInfo();
}

// 放大 #map-info 裡的數字
function enlargeNumbersInMapInfo() {
    const container = document.querySelector('#map-info');
    if (!container) return;

    function processNode(node) {
        // 只處理文字節點
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            const regex = /\d+(\.\d+)?/g;  // 數字與小數
            if (!regex.test(text)) return; // 沒數字就略過

            const frag = document.createDocumentFragment();
            let lastIndex = 0;

            text.replace(regex, (match, _, index) => {
                // 加入前面不是數字的部分
                if (index > lastIndex) {
                    frag.appendChild(document.createTextNode(text.slice(lastIndex, index)));
                }

                // 包數字
                const span = document.createElement('span');
                span.textContent = match;
                span.style.fontSize = '24px';
                frag.appendChild(span);

                lastIndex = index + match.length;
            });
            // 加入最後面不是數字的部分
            if (lastIndex < text.length) frag.appendChild(document.createTextNode(text.slice(lastIndex)));
            node.replaceWith(frag);
        }

        // 如果是元素節點，繼續往下處理子節點
        else if (node.nodeType === Node.ELEMENT_NODE) {
            [...node.childNodes].forEach(processNode);
        }
    }

    processNode(container);
}