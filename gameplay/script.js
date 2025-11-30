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

let scoreAnimation = {
    red_score: new CountUp('score-red', 0, 0, 0, .3, { useEasing: true, useGrouping: true, separator: ',', decimal: '.', suffix: '' }),
    blue_score: new CountUp('score-blue', 0, 0, 0, .3, { useEasing: true, useGrouping: true, separator: ',', decimal: '.', suffix: '' }),
    score_diff: new CountUp('score-diff', 0, 0, 0, .3, { useEasing: true, useGrouping: true, separator: ',', decimal: '.', suffix: '' }),
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
    updateChatVisibility(tourneyMng);
    updateGameplayScore(tourneyMng);
    updateNowPlaying(beatmapMng, mappool);

};

// 切換分數顯示與聊天視窗
let scoreVisible;
function updateChatVisibility(tourneyMng) {
    if (scoreVisible === tourneyMng.bools.scoreVisible) return;
    const chatContainer = document.getElementById("chat-container");
    scoreVisible = tourneyMng.bools.scoreVisible;

    if (scoreVisible) {
        //chatContainer.style.display = "none";
        chatContainer.style.opacity = 0;
        top_footer.style.opacity = 1;
        score_diff.style.opacity = 1;
    } else {
        //chatContainer.style.display = "block";
        chatContainer.style.opacity = 1;
        top_footer.style.opacity = 0;
        score_diff.style.opacity = 0;
    }
}

// 更新雙方及時分數
let red_score = document.getElementById('score-red');
let blue_score = document.getElementById('score-blue');
let score_diff = document.getElementById('score-diff');
let lead_bar = document.getElementById('lead-bar');
let last_score_update = 0;
function updateGameplayScore(tourneyMng) {
    if (!tourneyMng || !scoreVisible) return;
    let now = Date.now();

    scoreBlue = tourneyMng.gameplay.score.left;
    scoreRed = tourneyMng.gameplay.score.right;
    let scorediff = Math.abs(scoreRed - scoreBlue);

    scoreAnimation.red_score.update(scoreRed);
    scoreAnimation.blue_score.update(scoreBlue);
    scoreAnimation.score_diff.update(scorediff);

    if (scoreRed > scoreBlue) {
        red_score.style.fontWeight = '700';
        red_score.style.fontSize = '1em';
        blue_score.style.fontWeight = '500';
        blue_score.style.fontSize = '0.85em';

        if (now - last_score_update > 300) {
            last_score_update = now;
            score_diff.setAttribute('data-before', '◀');
            score_diff.setAttribute('data-after', '');
            score_diff.style.opacity = 1;
            lead_bar.style.width = 360 * (Math.min(0.5, Math.pow((scoreRed - scoreBlue) / 1000000, 0.7)) * 2) + 'px';
            lead_bar.style.right = '960px';
            lead_bar.style.left = 'unset';
            lead_bar.style.borderRight = 'unset';
            lead_bar.style.borderLeft = '10px solid red';
        }
    }
    else if (scoreBlue > scoreRed) {
        blue_score.style.fontWeight = '700';
        blue_score.style.fontSize = '1em';
        red_score.style.fontWeight = '500';
        red_score.style.fontSize = '0.85em';

        if (now - last_score_update > 300) {
            last_score_update = now;
            score_diff.setAttribute('data-before', '');
            score_diff.setAttribute('data-after', '▶');
            score_diff.style.opacity = 1;
            lead_bar.style.width = 360 * (Math.min(0.5, Math.pow((scoreBlue - scoreRed) / 1000000, 0.7)) * 2) + 'px';
            lead_bar.style.right = 'unset';
            lead_bar.style.left = '960px';
            lead_bar.style.borderRight = '10px solid blue';
            lead_bar.style.borderLeft = 'unset';
        }
    }
    else {
        score_diff.setAttribute('data-before', '');
        score_diff.setAttribute('data-after', '');
        score_diff.style.opacity = 0;
        red_score.style.fontWeight = '500';
        red_score.style.fontSize = '0.85em';
        blue_score.style.fontWeight = '700';
        blue_score.style.fontSize = '1em';

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