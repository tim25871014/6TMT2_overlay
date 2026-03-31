
let stageInfo, mappool, players, schedule, upcoming;

(async () => {
    $.ajaxSetup({ cache: false });
    stageInfo = await $.getJSON('../_data/beatmaps.json');
    players = await $.getJSON('../_data/players.json');
    schedule = await $.getJSON('../_data/schedule.json');

    getUpcoming();
    getPlayerInfo();
    getStageInfo();
    getTimeInfo();
})();

// Listen for page visibility changes
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) prevDigits = "";    // When tab becomes visible, reset old digits to force full re-render
});

function getUpcoming() {
    const now = Math.floor(Date.now() / 1000);
    // Find the next upcoming match
    upcoming = schedule.games.find(event => event.time > now);
    // If no future match exists, use the last scheduled match
    if (!upcoming) {
        upcoming = schedule.games[schedule.games.length - 1];
    }
}

function nextMatch(offset) {
    const currentIndex = schedule.games.indexOf(upcoming);
    if (currentIndex < schedule.games.length - offset && currentIndex + offset >= 0) {
        upcoming = schedule.games[currentIndex + offset];
        prevDigits = "";
        getPlayerInfo();
        getStageInfo();
        getTimeInfo();
    }
}

function getTimeInfo() {
    // update match time display
    const matchTime = document.querySelector('#match-time');
    const matchDate = new Date(upcoming.time * 1000);
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Taipei',
        hour12: false,
    };
    const timeString = matchDate.toLocaleTimeString('en-US', options);
    matchTime.innerHTML = `${timeString} (UTC+8)`;
}

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
    // Update stage
    const stageText = document.querySelector('#stage');
    stageText.innerHTML = stageInfo.stage;

    const timer = document.querySelector("#timer");
    

    function renderDigits(str) {
        // Digit length changed -> rebuild DOM
        if (prevDigits.length !== str.length) {
            timer.innerHTML = "";
            [...str].forEach(char => {
                if (/\d/.test(char)) { // Digit
                    const box = document.createElement("div");
                    const inner = document.createElement("div");
                    const span = document.createElement("span");

                    box.className = "digit";
                    inner.className = "digit-inner";
                    span.textContent = char;

                    inner.appendChild(span);
                    box.appendChild(inner);
                    timer.appendChild(box);

                } else { // Non-digit (colon)
                    const span = document.createElement("span");
                    span.textContent = char;
                    span.style.width = "80px";
                    timer.appendChild(span);
                }
            });
            prevDigits = str;
            return;
        }

        // Same digit length -> update in place
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

            // Force animation on latest digit only
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

