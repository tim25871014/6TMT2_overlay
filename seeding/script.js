let allPlayersData = [];
let beatmapLookup = {};
let currentSeed = 1;
let isAnimating = false;

function calculateMean(numbers) {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

function calculateStdDev(numbers) {
    if (numbers.length === 0) return 0;
    const mean = calculateMean(numbers);
    const squareDiffs = numbers.map(n => Math.pow(n - mean, 2));
    const avgSquareDiff = calculateMean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
}

function formatScore(score) {
    return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getZPercent(z) {
    const minZ = -2.0;
    const maxZ = 2.0;
    let normalized = (z - minZ) / (maxZ - minZ);
    return Math.max(0.05, Math.min(1.0, normalized)) * 100;
}

function changeSeed(offset) {
    if (allPlayersData.length === 0 || isAnimating) return;

    let newSeed = currentSeed + offset;
    const maxSeed = allPlayersData.length;
    if (newSeed < 1) newSeed = 1;
    if (newSeed > maxSeed) newSeed = maxSeed;

    if (newSeed !== currentSeed) {
        isAnimating = true;
        const infoPanel = document.getElementById('leftInfoPanel');
        infoPanel.classList.add('switching');

        setTimeout(() => {
            currentSeed = newSeed;
            const targetPlayer = allPlayersData.find(p => p.seed === currentSeed);
            if (targetPlayer) updateUI(targetPlayer);
            infoPanel.classList.remove('switching');
            isAnimating = false;
        }, 300);
    }
}

async function initDashboard() {
    try {
        const [qualsRes, beatmapsRes] = await Promise.all([
            fetch('../_data/quals.json'),
            fetch('../_data/beatmaps.json')
        ]);

        if (!qualsRes.ok || !beatmapsRes.ok) throw new Error('無法讀取資料檔案');

        allPlayersData = await qualsRes.json();
        const beatmapsData = await beatmapsRes.json();

        beatmapsData.beatmaps.forEach(bm => {
            beatmapLookup[bm.identifier] = bm.beatmapset_id;
        });

        // --- 資料處理與排名計算 ---
        // 1. Z-score 計算 & 賦予 rank #1, #2...
        const allLabels = allPlayersData[0].maps.map(m => m.label);

        allLabels.forEach(label => {
            let mapEntries = [];
            allPlayersData.forEach(p => {
                const map = p.maps.find(m => m.label === label);
                if (map) mapEntries.push(map);
            });

            // 依分數排序
            mapEntries.sort((a, b) => b.score - a.score);
            mapEntries.forEach((map, index) => {
                map.calculatedRank = `#${index + 1}`;
            });

            // 計算 Z-score
            const scores = mapEntries.map(m => m.score);
            const mean = calculateMean(scores);
            const stdDev = calculateStdDev(scores);

            mapEntries.forEach(map => {
                map.zScore = stdDev === 0 ? 0 : (map.score - mean) / stdDev;
                const match = label.match(/([A-Z]+)(\d+)/);
                if (match) {
                    map.type = match[1].toLowerCase();
                    map.id = parseInt(match[2]);
                }
                map.percent = map.acc;
            });
        });

        // 2. Mod Average & Mod Rank 計算
        const categories = ['ALL', 'NM', 'HD', 'HR', 'DT'];

        // 先算出每位玩家的平均 Z
        allPlayersData.forEach(p => {
            p.modAverages = {}; // 儲存該玩家各 Mod 的平均 Z
            p.modRanks = {};    // 儲存該玩家各 Mod 的排名

            categories.forEach(cat => {
                let targetMaps = (cat === 'ALL') ? p.maps : p.maps.filter(m => m.type.toUpperCase() === cat);
                let avg = 0;
                if (targetMaps.length > 0) {
                    avg = targetMaps.reduce((sum, m) => sum + m.zScore, 0) / targetMaps.length;
                } else {
                    avg = -999; // 若沒打該 Mod，視為極低分
                }
                p.modAverages[cat] = avg;
            });
        });

        // 針對每個 Mod 類別，對所有玩家進行排序並給予排名
        categories.forEach(cat => {
            // 建立一個暫存陣列來排序: [{playerIndex: 0, avg: 1.2}, {playerIndex: 1, avg: 0.5}...]
            let rankedList = allPlayersData.map((p, idx) => ({
                index: idx,
                avg: p.modAverages[cat]
            }));

            rankedList.sort((a, b) => b.avg - a.avg);

            rankedList.forEach((item, rank) => {
                // 寫回原資料結構
                allPlayersData[item.index].modRanks[cat] = rank + 1;
            });
        });

        // 初始化 UI
        updateUI(allPlayersData.find(p => p.seed === 1));

    } catch (error) {
        console.error("初始化失敗:", error);
        document.getElementById('playerName').innerText = "Load Error";
    }
}

function updateUI(player) {
    document.getElementById('playerSeed').innerText = `Seed #${player.seed}`;
    document.getElementById('playerName').innerText = player.username;
    document.getElementById('playerAvatar').setAttribute('href', `http://s.ppy.sh/a/${player.osu_id}`);

    const totalZ = player.maps.reduce((sum, m) => sum + m.zScore, 0);
    const totalScore = player.maps.reduce((sum, m) => sum + m.score, 0);
    const avgScore = Math.round(totalScore / player.maps.length);

    document.getElementById('zSumVal').innerText = (totalZ > 0 ? '+' : '') + totalZ.toFixed(2);
    document.getElementById('avgScoreVal').innerText = formatScore(avgScore);

    // 修改：傳入完整 player 物件以讀取預計算的 modRanks
    renderModStats(player, 'leftStats');

    const centerMaps = player.maps.slice(0, 6);
    const rightMaps = player.maps.slice(6);

    document.getElementById('listCenter').innerHTML = '';
    document.getElementById('listRight').innerHTML = '';

    renderMapList(centerMaps, 'listCenter');
    renderMapList(rightMaps, 'listRight');
}

function renderModStats(player, elementId) {
    const container = document.getElementById(elementId);
    const categories = ['ALL', 'NM', 'HD', 'HR', 'DT'];
    let html = '';

    categories.forEach(cat => {
        const avgZ = player.modAverages[cat];
        // 若 avgZ 為 -999 (沒打)，顯示空條
        const widthPercent = (avgZ === -999) ? 5 : getZPercent(avgZ);
        const fillClass = `fill-${cat.toLowerCase()}`;
        const rank = player.modRanks[cat];

        html += `
                    <div class="mod-stat-row">
                        <span class="mod-label">${cat}</span>
                        <div class="mod-bar-bg">
                            <div class="mod-bar-fill ${fillClass}" style="width: ${widthPercent}%"></div>
                        </div>
                        <span class="mod-rank">#${rank}</span>
                    </div>
                `;
    });
    container.innerHTML = html;
}

function renderMapList(maps, elementId) {
    const container = document.getElementById(elementId);
    let html = '';
    maps.forEach((map, index) => {
        const label = map.type.toUpperCase() + map.id;
        const setId = beatmapLookup[label];
        const imgUrl = setId
            ? `https://assets.ppy.sh/beatmaps/${setId}/covers/cover.jpg`
            : `https://picsum.photos/110/72?random=${index}`;

        const barWidth = getZPercent(map.zScore);
        const scoreText = formatScore(map.score);
        const rankText = map.calculatedRank || "-";

        html += `
                    <div class="score-row" style="animation-delay: ${index * 0.08}s">
                        <div class="row-left">
                            <div class="song-thumb"><img src="${imgUrl}"></div>
                            <div class="badge-group">
                                <div class="diff-badge ${map.type}">
                                    <span class="diff-name">${label}</span>
                                </div>
                                <span class="diff-rank">${rankText}</span>
                            </div>
                        </div>
                        <div class="score-data">
                            <div class="score-val">${scoreText}</div>
                            <div class="score-sub">
                                <div class="mini-bar"><div class="mini-bar-fill" style="width: ${barWidth}%"></div></div>
                                <div class="percent">${map.percent}</div>
                            </div>
                        </div>
                    </div>
                `;
    });
    container.innerHTML = html;
}

initDashboard();