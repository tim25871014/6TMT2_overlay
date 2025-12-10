
let stageInfo, mappool, players, upcoming;

(async () => {
    $.ajaxSetup({ cache: false });
    stageInfo = await $.getJSON('../_data/beatmaps.json');
    players = await $.getJSON('../_data/players.json');
    upcoming = await $.getJSON('../_data/coming_up.json');

    getPlayerInfo();
    getStageInfo();
})();

// 監聽分頁可見性改變事件
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) prevDigits = "";    // 使用者切回前景，清空舊數字，保證完整重渲染
});


function getPlayerInfo() {
    const bluePlayer = players.find(p => p.username === upcoming.player_blue);
    const redPlayer = players.find(p => p.username === upcoming.player_red);

    const bluePlayerHexImage = document.querySelector('.player.blue .hex-image');
    const bluePlayerName = document.querySelector('.player.blue .name');
    const bluePlayerSeed = document.querySelector('.player.blue .seed');
    bluePlayerHexImage.setAttribute('href', `https://a.ppy.sh/${bluePlayer.id}`);
    bluePlayerName.innerHTML = bluePlayer.username || 'Unknown';
    bluePlayerSeed.innerHTML = bluePlayer.seed || 'Unknown';

    const redPlayerHexImage = document.querySelector('.player.red .hex-image');
    const redPlayerName = document.querySelector('.player.red .name');
    const redPlayerSeed = document.querySelector('.player.red .seed');
    redPlayerHexImage.setAttribute('href', `https://a.ppy.sh/${redPlayer.id}`);
    redPlayerName.innerHTML = redPlayer.username || 'Unknown';
    redPlayerSeed.innerHTML = redPlayer.seed || 'Unknown';
}

let prevDigits = "";
function getStageInfo() {
    // 更新stage
    const stageText = document.querySelector('#stage');
    stageText.innerHTML = stageInfo.stage;

    const timer = document.querySelector("#timer");
    

    function renderDigits(str) {
        // 位數變化 → 重建 DOM
        if (prevDigits.length !== str.length) {
            timer.innerHTML = "";
            [...str].forEach(char => {
                if (/\d/.test(char)) { // 數字
                    const box = document.createElement("div");
                    const inner = document.createElement("div");
                    const span = document.createElement("span");

                    box.className = "digit";
                    inner.className = "digit-inner";
                    span.textContent = char;

                    inner.appendChild(span);
                    box.appendChild(inner);
                    timer.appendChild(box);

                } else { // 非數字(冒號)
                    const span = document.createElement("span");
                    span.textContent = char;
                    span.style.width = "80px";
                    timer.appendChild(span);
                }
            });
            prevDigits = str;
            return;
        }

        // 位數相同 → 更新
        [...str].forEach((char, i) => {
            if (!/\d/.test(char)) return;

            const prev = prevDigits[i];
            const el = timer.children[i];
            const inner = el.querySelector(".digit-inner");
            const oldSpan = inner.children[0];

            if (char === prev) return;

            const newSpan = document.createElement("span");
            newSpan.textContent = char;
            inner.appendChild(newSpan);

            // 強制只動畫最新數字
            requestAnimationFrame(() => {
                inner.style.transform = "translateY(-150px)";
            });

            inner.addEventListener(
                "transitionend",
                () => {
                    if (oldSpan.parentNode === inner) inner.removeChild(oldSpan);
                    inner.style.transition = "none";
                    inner.style.transform = "translateY(0)";
                    void inner.offsetWidth;
                    inner.style.transition = "transform 0.25s ease-out";
                },
                { once: true }
            );
        });

        prevDigits = str;
    }
    

    function updateTimer() {
        const now = Math.floor(Date.now() / 1000);
        const diff = upcoming.time - now;

        if (diff <= 0) {
            timer.innerHTML = "Go!";
            return;
        }

        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;

        if (hours > 0) {
            const totalMinutes = hours * 60 + minutes;
            timer.innerHTML = `${totalMinutes}<span class="small-unit"> min</span>`;
        } else {
            renderDigits(
                `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
            );
        }
    }
    setInterval(updateTimer, 1000);
}