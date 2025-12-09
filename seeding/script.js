let allPlayersData = [];
let beatmapLookup = {};
let currentSeed = 1;
let isAnimating = false;

// --- 數學計算函數 ---
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

// --- 導航切換 ---
function changeSeed(offset) {
    if (allPlayersData.length === 0 || isAnimating) return;

    let newIndex = currentIndex + offset;

    if (newIndex < 0) newIndex = allPlayersData.length - 1;
    if (newIndex >= allPlayersData.length) newIndex = 0;

    if (newIndex !== currentIndex) {
        isAnimating = true;
        const infoPanel = document.getElementById('leftInfoPanel');
        infoPanel.classList.add('switching');

        setTimeout(() => {
            currentIndex = newIndex;
            const targetData = allPlayersData[currentIndex];
            updateUI(targetData);

            infoPanel.classList.remove('switching');
            isAnimating = false;
        }, 300);
    }
}

// --- 初始化 ---
async function initDashboard() {
    try {
        const [qualsRes, beatmapsRes] = await Promise.all([
            fetch('../_data/quals.json'),
            fetch('../_data/beatmaps.json')
        ]);

        if (!qualsRes.ok || !beatmapsRes.ok) throw new Error('無法讀取資料檔案');

        const rawPlayers = await qualsRes.json();
        const beatmapsData = await beatmapsRes.json();

        // 建立 Beatmap ID 對照表
        beatmapsData.beatmaps.forEach(bm => {
            beatmapLookup[bm.identifier] = bm.beatmapset_id;
        });

        // --- 1. 計算真實玩家的數據 ---
        // 假設所有玩家打的圖都一樣，取第一位玩家的 map labels 作為基準
        const allLabels = rawPlayers[0].maps.map(m => m.label);

        allLabels.forEach(label => {
            let mapEntries = [];
            rawPlayers.forEach(p => {
                const map = p.maps.find(m => m.label === label);
                if (map) mapEntries.push(map);
            });

            // 排序並給予排名
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

        // 計算 Mod 平均與排名
        const categories = ['ALL', 'NM', 'HD', 'HR', 'DT'];
        rawPlayers.forEach(p => {
            p.modAverages = {};
            p.modRanks = {};
            categories.forEach(cat => {
                let targetMaps = (cat === 'ALL') ? p.maps : p.maps.filter(m => m.type.toUpperCase() === cat);
                let avg = 0;
                if (targetMaps.length > 0) {
                    avg = targetMaps.reduce((sum, m) => sum + m.zScore, 0) / targetMaps.length;
                } else {
                    avg = -999;
                }
                p.modAverages[cat] = avg;
            });
        });

        categories.forEach(cat => {
            let rankedList = rawPlayers.map((p, idx) => ({
                index: idx,
                avg: p.modAverages[cat]
            }));
            rankedList.sort((a, b) => b.avg - a.avg);
            rankedList.forEach((item, rank) => {
                rawPlayers[item.index].modRanks[cat] = rank + 1;
            });
        });

        // --- 2. 建立 Placeholder (封面) 物件 ---
        // 我們需要根據 allLabels 建立一組 "空殼" Maps，這樣 renderMapList 才能畫出列表結構
        const placeholderMaps = allLabels.map(label => {
            // 解析 Type 和 ID 供 CSS 使用 (顏色)
            const match = label.match(/([A-Z]+)(\d+)/);
            const type = match ? match[1].toLowerCase() : 'nm';
            const id = match ? parseInt(match[2]) : 1;

            return {
                label: label,
                type: type,
                id: id,
                score: null, // 標記為 null，表示這是 Placeholder 數據
                rank: '-',
                acc: '-',
                percent: '-',
                zScore: -999,
                calculatedRank: '-'
            };
        });

        const placeholderObj = {
            isPlaceholder: true,
            seed: 0,
            username: "Ready?",
            osu_id: null,
            maps: placeholderMaps, // 放入假地圖數據
            modAverages: { ALL: -999, NM: -999, HD: -999, HR: -999, DT: -999 },
            modRanks: { ALL: '-', NM: '-', HD: '-', HR: '-', DT: '-' }
        };

        // --- 3. 合併資料 ---
        rawPlayers.sort((a, b) => a.seed - b.seed);
        allPlayersData = [placeholderObj, ...rawPlayers];

        // --- 4. 初始顯示 (Index 0 = Placeholder) ---
        currentIndex = 0;
        updateUI(allPlayersData[currentIndex]);

    } catch (error) {
        console.error("初始化失敗:", error);
        document.getElementById('playerName').innerText = "Load Error";
    }
}

// --- UI 更新邏輯 ---
function updateUI(player) {
    const seedLabel = document.getElementById('playerSeed');
    const nameLabel = document.getElementById('playerName');
    const avatarImg = document.getElementById('playerAvatar');
    const zSumLabel = document.getElementById('zSumVal');
    const avgLabel = document.getElementById('avgScoreVal');

    if (player.isPlaceholder) {
        // --- 封面狀態 ---
        seedLabel.innerText = "6TMT 2026";
        nameLabel.innerText = "Seed Reveal";

        // 修改點 1: 使用透明像素作為圖片，讓六邊形中間留白
        avatarImg.setAttribute('href', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

        zSumLabel.innerText = "---";
        avgLabel.innerText = "---";
    } else {
        // --- 真實玩家狀態 ---
        seedLabel.innerText = `Seed #${player.seed}`;
        nameLabel.innerText = player.username;
        avatarImg.setAttribute('href', `http://s.ppy.sh/a/${player.osu_id}`);

        const totalZ = player.maps.reduce((sum, m) => sum + m.zScore, 0);
        const totalScore = player.maps.reduce((sum, m) => sum + m.score, 0);
        const avgScore = Math.round(totalScore / player.maps.length);

        zSumLabel.innerText = (totalZ > 0 ? '+' : '') + totalZ.toFixed(2);
        avgLabel.innerText = formatScore(avgScore);
    }

    // 渲染左側 Mod 統計
    renderModStats(player, 'leftStats');

    // 渲染中間與右側列表 (即使是 Placeholder 也要渲染，只是內容變為 "-")
    // 假設前6張是中，後5張是右
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
        const isHidden = (avgZ === -999);
        const widthPercent = isHidden ? 0 : getZPercent(avgZ);
        const fillClass = `fill-${cat.toLowerCase()}`;

        // 如果是 Placeholder，排名也顯示 "-"
        let rank = player.modRanks[cat];
        if (player.isPlaceholder) rank = '-';

        html += `
            <div class="mod-stat-row">
                <span class="mod-label">${cat}</span>
                <div class="mod-bar-bg">
                    <div class="mod-bar-fill ${fillClass}" style="width: ${widthPercent}%"></div>
                </div>
                <span class="mod-rank">${rank === undefined ? '-' : (rank === '-' ? '-' : '#' + rank)}</span>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderMapList(maps, elementId) {
    const container = document.getElementById(elementId);
    let html = '';

    maps.forEach((map, index) => {
        const label = map.label;
        // 取得封面圖 (即使是 Placeholder 也要顯示正確的圖)
        const setId = beatmapLookup[label];
        const imgUrl = setId
            ? `https://assets.ppy.sh/beatmaps/${setId}/covers/cover.jpg`
            : `https://picsum.photos/110/72?random=${index}`;

        // 修改點 2: 判斷是否為 Placeholder 數據 (score 為 null)
        const isPlaceholder = (map.score === null);

        const scoreText = isPlaceholder ? '-' : formatScore(map.score);
        const barWidth = isPlaceholder ? 0 : getZPercent(map.zScore); // 0寬度
        const rankText = isPlaceholder ? '-' : (map.calculatedRank || "-");
        const percentText = isPlaceholder ? '-' : map.percent;

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
                        <div class="percent">${percentText}</div>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// 啟動
initDashboard();