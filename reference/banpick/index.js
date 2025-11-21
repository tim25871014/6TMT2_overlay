let mappool, teams, coming_up, mappool_detail;
const delay = async time => new Promise(resolve => setTimeout(resolve, time));
(async () => {
    $.ajaxSetup({ cache: false });
    mappool = await $.getJSON('../_data/beatmaps.json');
    mappool_detail = await $.getJSON('../_data/beatmap_data.json');
    teams = await $.getJSON('../_data/teams.json');
    coming_up = await $.getJSON('../_data/coming_up.json');
    // let stage = mappool.stage.toUpperCase();
    let stage = mappool.stage;
    if (stage) document.getElementById('stage-name').innerHTML = stage;
})();

window.addEventListener('contextmenu', (e) => e.preventDefault());

// BP
let bp = {red: [], blue: [], redBans: [], blueBans: []};

// HEADER
let red_name = document.getElementById('red-name');
let red_points = document.getElementById('red-points');
let red_flag = document.getElementById('red-flag');

let blue_name = document.getElementById('blue-name');
let blue_points = document.getElementById('blue-points');
let blue_flag = document.getElementById('blue-flag');

// CHAT
let chat_container = document.getElementById('chat-container');
let chat = document.getElementById('chat');
let chatLen = 0;


/* ########### */
let modid = document.getElementById('modid');
/* ########### */

// START
let socket = new ReconnectingWebSocket('ws://127.0.0.1:24050/ws');
let user = {};

// NOW PLAYING
let mapContainer = document.getElementById('mapContainer');
let mapArtist = document.getElementById('mapName');
let mapInfo = document.getElementById('mapInfo');
let mapper = document.getElementById('mapper');
let stars = document.getElementById('stars');
let stats = document.getElementById('stats');
let pick_button = document.getElementById('pickButton');
let autopick_button = document.getElementById('autoPickButton');

const beatmaps = new Set();
const load_maps = async () => await $.getJSON('../_data/beatmap_data.json');

socket.onopen = () => { console.log('Successfully Connected'); };
socket.onclose = event => { console.log('Socket Closed Connection: ', event); socket.send('Client Closed!'); };
socket.onerror = error => { console.log('Socket Error: ', error); };

let gameState;
let hasSetup = false;
let lastPicked = null;
let redName = 'Red Team', blueName = '藍隊';
let tempMapID = 0;
let currentPicker = 'Red';
let enableAutoPick = false;
let selectedMaps = [];

class Beatmap {
    constructor(mods, modID, beatmapID, layerName) {
        this.mods = mods;
        this.modID = modID;
        this.beatmapID = beatmapID;
        this.layerName = layerName;
    }
    generate() {
        let mappoolContainer = document.getElementById(`${this.mods}`);

        this.clicker = document.createElement('div');
        this.clicker.id = `${this.layerName}Clicker`;

        mappoolContainer.appendChild(this.clicker);
        let clickerObj = document.getElementById(this.clicker.id);

        this.bg = document.createElement('div');
        this.map = document.createElement('div');
        this.overlay = document.createElement('div');
        this.blinkoverlay = document.createElement('div');
        this.artist = document.createElement('div');
        this.title = document.createElement('div');
        this.difficulty = document.createElement('div');
        this.stats = document.createElement('div');
        this.modIcon = document.createElement('div');
        this.pickedStatus = document.createElement('div');

        this.bg.id = this.layerName;
        this.map.id = `${this.layerName}BG`;
        this.overlay.id = `${this.layerName}Overlay`;
        this.blinkoverlay.id = `${this.layerName}BlinkOverlay`;
        this.artist.id = `${this.layerName}ARTIST`;
        this.title.id = `${this.layerName}TITLE`;
        this.difficulty.id = `${this.layerName}DIFF`;
        this.stats.id = `${this.layerName}Stats`;
        this.modIcon.id = `${this.layerName}ModIcon`;
        this.pickedStatus.id = `${this.layerName}STATUS`;

        this.artist.setAttribute('class', 'mapInfo artist');
        this.title.setAttribute('class', 'mapInfo title');
        this.difficulty.setAttribute('class', 'mapInfo diff');
        this.map.setAttribute('class', 'map');
        this.pickedStatus.setAttribute('class', 'pickingStatus');
        this.overlay.setAttribute('class', 'overlay');
        this.blinkoverlay.setAttribute('class', 'blinkoverlay');
        this.bg.setAttribute('class', 'statBG');
        this.modIcon.setAttribute('class', `modIcon icon-${this.mods.toLowerCase()}`);
        this.modIcon.innerHTML = `${this.modID}`;
        this.clicker.setAttribute('class', 'clicker');
        clickerObj.appendChild(this.map);
        document.getElementById(this.map.id).appendChild(this.overlay);
        document.getElementById(this.map.id).appendChild(this.blinkoverlay);
        document.getElementById(this.map.id).appendChild(this.artist);
        document.getElementById(this.map.id).appendChild(this.title);
        document.getElementById(this.map.id).appendChild(this.difficulty);
        clickerObj.appendChild(this.pickedStatus);
        clickerObj.appendChild(this.bg);
        clickerObj.appendChild(this.modIcon);

        this.clicker.style.transform = 'translateY(0)';
    }
    grayedOut() {
        this.overlay.style.opacity = '1';
    }
}

let bestOf, firstTo, md5;
let starsRed, scoreRed, nameRed, flagRed;
let starsBlue, scoreBlue, nameBlue, flagBlue;

socket.onmessage = async (event) => {
    let data = JSON.parse(event.data);

    if (!hasSetup) setupBeatmaps();

    if (blueName !== data.tourney.manager.teamName.right && data.tourney.manager.teamName.right) {
        blueName = data.tourney.manager.teamName.right || 'Blue';
    }
    if (redName !== data.tourney.manager.teamName.left && data.tourney.manager.teamName.left) {
        redName = data.tourney.manager.teamName.left || 'Red';
    }

    if (tempMapID !== data.menu.bm.id && data.menu.bm.id != 0) {
        if (tempMapID == 0) tempMapID = data.menu.bm.id;
        else {
            tempMapID = data.menu.bm.id;
            let pickedMap = Array.from(beatmaps).find(b => b.beatmapID == tempMapID);
            if (pickedMap && enableAutoPick && !selectedMaps.includes(tempMapID)) pickMap(Array.from(beatmaps).find(b => b.beatmapID == tempMapID), currentPicker == 'Red' ? redName : blueName, currentPicker);
        }
    }

    ///////

    if (bestOf !== data.tourney.manager.bestOF) {
        let newmax = Math.ceil(data.tourney.manager.bestOF / 2);
        if (bestOf === undefined) {
            for (let i = 1; i <= newmax; i++) {
                let nodeBlue = document.createElement('div');
                let nodeRed = document.createElement('div');
                nodeBlue.className = 'star-b';
                nodeRed.className = 'star-r';
                nodeBlue.id = `blue${i}`;
                nodeRed.id = `red${i}`;
                document.getElementById('blue-points').appendChild(nodeBlue);
                document.getElementById('red-points').appendChild(nodeRed);
            }

        }
        if (bestOf < data.tourney.manager.bestOF) {
            for (let i = firstTo + 1; i <= newmax; i++) {
                let nodeBlue = document.createElement('div');
                let nodeRed = document.createElement('div');
                nodeBlue.className = 'star-b';
                nodeRed.className = 'star-r';
                nodeBlue.id = `blue${i}`;
                nodeRed.id = `red${i}`;
                document.getElementById('blue-points').appendChild(nodeBlue);
                document.getElementById('red-points').appendChild(nodeRed);
            }
        } else {
            for (let i = firstTo; i > newmax; i--) {
                let nodeBlue = document.getElementById('blue' + i.toString());
                let nodeRed = document.getElementById('red' + i.toString());
                document.getElementById('blue-points').removeChild(nodeBlue);
                document.getElementById('red-points').removeChild(nodeRed);
            }
        }
        bestOf = data.tourney.manager.bestOF;
        firstTo = newmax;

        ///
        const containers = document.querySelectorAll('.pickContainer');
        const newidth = (576 / (firstTo-1)); // 576px is the width of the container, -2 for the border
        containers.forEach(el => {
            if(firstTo != 0 && Number(el.id.slice(-1)) >= firstTo) {
                el.style.width = '0px'
            }
            else {
                el.style.width = newidth + 'px';
            }
        });
    }

    if (starsRed !== data.tourney.manager.stars.left) {
        starsRed = data.tourney.manager.stars.left;
        for (let i = 1; i <= starsRed; i++) {
            document.getElementById(`red${i}`).style.backgroundColor = 'var(--red)';
        }
        for (let i = starsRed + 1; i <= firstTo; i++) {
            document.getElementById(`red${i}`).style.backgroundColor = 'unset';
        }
    }
    if (starsBlue !== data.tourney.manager.stars.right) {
        starsBlue = data.tourney.manager.stars.right;
        for (let i = 1; i <= starsBlue; i++) {
            document.getElementById(`blue${i}`).style.backgroundColor = 'var(--blue)';
        }
        for (let i = starsBlue + 1; i <= firstTo; i++) {
            document.getElementById(`blue${i}`).style.backgroundColor = 'unset';
        }
    }

    if (teams && nameRed !== data.tourney.manager.teamName.left && data.tourney.manager.teamName.left) {
        console.log("test");
        nameRed = data.tourney.manager.teamName.left || 'Red Team';
        console.log(nameRed);
        red_name.innerHTML = nameRed;
        let team = teams.find(t => t.team == nameRed);
        console.log(team);
        flagRed = team?.flag || null;
        if (flagRed) red_flag.src = `../_data/assets/flags/${flagRed}.png`;
        else red_flag.src = `https://assets.ppy.sh/old-flags/XX.png`;
    }
    if (teams && nameBlue !== data.tourney.manager.teamName.right && data.tourney.manager.teamName.right) {
        nameBlue = data.tourney.manager.teamName.right || 'Blue Team';
        blue_name.innerHTML = nameBlue;
        let team = teams.find(t => t.team == nameBlue);
        flagBlue = team?.flag || null;
        if (flagBlue) blue_flag.src = `../_data/assets/flags/${flagBlue}.png`;
        else blue_flag.src = `https://assets.ppy.sh/old-flags/XX.png`;
    }

    
    if (chatLen != data.tourney.manager.chat.length) {

        if (chatLen == 0 || (chatLen > 0 && chatLen > data.tourney.manager.chat.length)) { chat.innerHTML = ''; chatLen = 0; }

        for (let i = chatLen; i < data.tourney.manager.chat.length; i++) {
            tempClass = data.tourney.manager.chat[i].team;

            let text = data.tourney.manager.chat[i].messageBody;
            if (data.tourney.manager.chat[i].name == 'BanchoBot' && text.startsWith('Match history')) continue;

            let chatParent = document.createElement('div');
            chatParent.setAttribute('class', 'chat');

            let chatTime = document.createElement('div');
            chatTime.setAttribute('class', 'chatTime');

            let chatName = document.createElement('div');
            chatName.setAttribute('class', 'chatName');

            let chatText = document.createElement('div');
            chatText.setAttribute('class', 'chatText');

            chatTime.innerText = data.tourney.manager.chat[i].time;
            chatName.innerText = data.tourney.manager.chat[i].name + ': \xa0';
            chatText.innerText = text;

            chatName.classList.add(tempClass);

            chatParent.append(chatTime);
            chatParent.append(chatName);
            chatParent.append(chatText);
            chat.append(chatParent);

        }

        chatLen = data.tourney.manager.chat.length;
        chat.scrollTop = chat.scrollHeight;
    }
};

async function setupBeatmaps() {
    hasSetup = true;

    const bms = [];
    try {
        $.ajaxSetup({ cache: false });
        const jsonData = await $.getJSON(`../_data/beatmaps.json`);
        jsonData.beatmaps.map((beatmap) => { bms.push(beatmap); });
    } catch (error) { console.error('Could not read JSON file', error); }

    let row = -1;
    let preMod = 0;
    let colIndex = 0;

    bms.map(async (beatmap, index) => {
        if (beatmap.mods !== preMod || colIndex % 3 === 0) {
            preMod = beatmap.mods;
            colIndex = 0;
            row++;
        }
        const bm = new Beatmap(beatmap.mods, beatmap.identifier, beatmap.beatmap_id, `map${index}`);
        bm.generate();
        bm.clicker.addEventListener('mousedown', () => {
            bm.clicker.addEventListener('click', event => {
                if (!event.shiftKey) event.ctrlKey ? banMap(bm, redName, 'Red') : event.altKey ? protectMap(bm, redName, 'Red') : pickMap(bm, redName, 'Red');
                else resetMap(bm);
            });
            bm.clicker.addEventListener('contextmenu', event => {
                if (!event.shiftKey) event.ctrlKey ? banMap(bm, blueName, 'Blue') : pickMap(bm, blueName, 'Blue');
                else resetMap(bm);
            });
        });
        const stored_beatmaps = await load_maps();
        const mapData = await getDataSet(stored_beatmaps, beatmap.beatmap_id);
        bm.map.style.backgroundImage = `url('https://assets.ppy.sh/beatmaps/${mapData.beatmapset_id}/covers/cover.jpg')`;
        bm.artist.innerHTML = `${mapData.artist}`;
        bm.title.innerHTML = `${mapData.title}`;
        bm.difficulty.innerHTML = `[${mapData.version}] by ${mapData.creator}`;
        beatmaps.add(bm);
    });
}

const getDataSet = (stored_beatmaps, beatmap_id) => stored_beatmaps.find(b => b.beatmap_id == beatmap_id) || null;

const pickMap = (bm, teamName, color) => {
    if (lastPicked !== null) lastPicked.blinkoverlay.style.animation = 'none';
    lastPicked = bm;
    switchPick(color);
    document.cookie = `lastPick=${bm.beatmapID}-${color.toLowerCase()};path=/`;

    bm.pickedStatus.style.color = '#f5f5f5';
    bm.overlay.style.opacity = '0.7';
    bm.blinkoverlay.style.animation = 'blinker 1s cubic-bezier(.36,.06,.01,.57) 300ms 5, slowPulse 5000ms ease-in-out 8000ms 18';
    bm.artist.style.opacity = '0.3';
    bm.title.style.opacity = '0.3';
    bm.difficulty.style.opacity = '0.3';
    bm.modIcon.style.opacity = '0.3';
    bm.bg.style.opacity = '0';
    selectedMaps.push(bm.beatmapID);
    updateBP(bm.modID, teamName, 'pick');

    setTimeout(() => {
        bm.pickedStatus.style.opacity = 1;
        bm.pickedStatus.style.backdropFilter = 'blur(4px)';
        bm.pickedStatus.style.outline = bm.mods.includes('TB') ? '3px solid #ffffff' : `3px solid ${color == 'Red' ? 'var(--red)' : 'var(--blue)'}`;
        bm.pickedStatus.innerHTML = bm.mods.includes('TB') ? 'Tiebreaker' : `<b class="pick${color}">${teamName}</b> pick`;
    }, 300);
}

const banMap = (bm, teamName, color) => {
    if (bm.mods.includes('TB')) return;
    bm.pickedStatus.style.color = '#f5f5f5';
    bm.overlay.style.opacity = '0.9';
    bm.blinkoverlay.style.animation = 'none';
    bm.artist.style.opacity = '0.3';
    bm.title.style.opacity = '0.3';
    bm.difficulty.style.opacity = '0.3';
    bm.modIcon.style.opacity = '0.3';
    bm.bg.style.opacity = '0';
    selectedMaps.push(bm.beatmapID);
    updateBP(bm.modID, teamName, 'ban');

    setTimeout(() => {
        bm.pickedStatus.style.opacity = 1;
        bm.pickedStatus.style.backdropFilter = 'blur(4px)';
        bm.pickedStatus.style.outline = 'none';
        bm.pickedStatus.innerHTML = `<b class="pick${color}">${teamName}</b> ban`;
    }, 300);
}

const protectMap = bm => {
    if (bm.mods.includes('TB')) return;
    setTimeout(() => {
        bm.pickedStatus.style.opacity = '1';
        bm.pickedStatus.style.backdropFilter = 'none';
        bm.pickedStatus.innerHTML = '🔒';
        bm.pickedStatus.style.outline = '3px solid rgba(183, 234, 153, 1)';
        bm.pickedStatus.style.backgroundColor = 'rgba(183, 234, 153, 0.2)';
    }, 300);
}

const resetMap = bm => {
    document.cookie = `lastPick=;path=/`;

    bm.overlay.style.opacity = '0.5';
    bm.blinkoverlay.style.animation = 'none';
    bm.artist.style.opacity = '1';
    bm.title.style.opacity = '1';
    bm.difficulty.style.opacity = '1';
    bm.modIcon.style.opacity = '1';
    bm.bg.style.opacity = '1';
    bm.pickedStatus.style.opacity = '0';
    bm.pickedStatus.style.boxShadow = 'none';
    bm.pickedStatus.style.outline = 'none';
    selectedMaps = selectedMaps.filter(e => e !== bm.beatmapID);
    updateBP(bm.modID, 'RES', 'reset');

    setTimeout(() => {
        bm.pickedStatus.style.opacity = 0;
        bm.pickedStatus.style.outline = 'none';
        bm.pickedStatus.innerHTML = '';
    }, 100);
}

const switchPick = color => {
    if (!color) currentPicker = currentPicker == 'Red' ? 'Blue' : 'Red';
    else currentPicker = color == 'Red' ? 'Blue' : 'Red';
    if (currentPicker == 'Red') {
        pick_button.style.color = 'var(--red)';
        pick_button.innerHTML = 'RED PICK';
    }
    else {
        pick_button.style.color = 'var(--blue)';
        pick_button.innerHTML = 'BLUE PICK';
    }
}

const switchAutoPick = () => {
    if (enableAutoPick) {
        enableAutoPick = false;
        autopick_button.innerHTML = 'AUTOPICK: OFF';
        autopick_button.style.backgroundColor = '#fc9f9f';
    }
    else {
        enableAutoPick = true;
        autopick_button.innerHTML = 'AUTOPICK: ON';
        autopick_button.style.backgroundColor = '#9ffcb3';
    }
}

// bp display
const updateBP = (modID, teamName, action) => {
    // update the bp object (data structure)
    if(action === 'reset') {
        bp['red'] = bp['red'].filter(id => id !== modID);
        bp['blue'] = bp['blue'].filter(id => id !== modID);
        bp['redBans'] = bp['redBans'].filter(id => id !== modID);
        bp['blueBans'] = bp['blueBans'].filter(id => id !== modID);
    }
    else if(teamName == redName || teamName == blueName) {
        teamName = (teamName === redName) ? 'red' : 'blue';
        if (action === 'pick') {
            bp[teamName.toLowerCase()].push(modID);
        }
        else if (action === 'ban') {
            bp[`${teamName.toLowerCase()}Bans`].push(modID);
        }
    }
    // unique the arrays
    bp['red'] = [...new Set(bp['red'])];
    bp['blue'] = [...new Set(bp['blue'])];
    bp['redBans'] = [...new Set(bp['redBans'])];
    bp['blueBans'] = [...new Set(bp['blueBans'])];

    // update the display
    const red_pick_containers = document.querySelectorAll('.pickContainer.red');
    red_pick_containers.forEach(el => {
        const idx = Number(el.id.slice(-1)) - 1;
        const p = el.querySelector('p');
        const cov = el.querySelector('.cov');
        if (bp['red'].length > idx) {    
            p.textContent = bp['red'][idx];
            const beatmapset_id = findSetID(bp['red'][idx]);
            el.style.background = `url('https://assets.ppy.sh/beatmaps/${beatmapset_id}/covers/cover.jpg')`;
            el.style.backgroundPosition = 'center';
            el.style.backgroundSize = 'cover';
            cov.style.background = 'linear-gradient(to bottom, rgba(139, 0, 0, 0.5), rgba(0, 0, 0, 0))';
            cov.style.opacity = 1;
            cov.style.animation = 'blinker 1s cubic-bezier(.36,.06,.01,.57) 300ms 5';
        }
        else {
            p.textContent = '';
            el.style.background = 'linear-gradient(30deg, black, darkred)';
            cov.style.opacity = 0;
        }
    });
    const blue_pick_containers = document.querySelectorAll('.pickContainer.blue');
    blue_pick_containers.forEach(el => {
        const idx = Number(el.id.slice(-1)) - 1;
        const p = el.querySelector('p');
        const cov = el.querySelector('.cov');
        if (bp['blue'].length > idx) {
            p.textContent = bp['blue'][idx];
            const beatmapset_id = findSetID(bp['blue'][idx]);
            el.style.background = `url('https://assets.ppy.sh/beatmaps/${beatmapset_id}/covers/cover.jpg')`;
            el.style.backgroundPosition = 'center';
            el.style.backgroundSize = 'cover';
            cov.style.background = 'linear-gradient(to bottom, rgba(0, 0, 209, 0.5), rgba(0, 0, 0, 0))';
            cov.style.opacity = 1;
            cov.style.animation = 'blinker 1s cubic-bezier(.36,.06,.01,.57) 300ms 5';
        }
        else {
            p.textContent = '';
            el.style.background = 'linear-gradient(30deg, black, rgb(0, 0, 209))';
            cov.style.opacity = 0;
        }
    });

    const red_ban_containers = document.querySelectorAll('.banContainer.red');
    red_ban_containers.forEach(el => {
        const idx = Number(el.id.slice(-1)) - 1;
        const p = el.querySelector('p');
        const cov = el.querySelector('.bcov');
        if (bp['redBans'].length > idx) {    
            p.textContent = bp['redBans'][idx];
            const beatmapset_id = findSetID(bp['redBans'][idx]);
            el.style.background = `url('https://assets.ppy.sh/beatmaps/${beatmapset_id}/covers/cover.jpg')`;
            el.style.backgroundPosition = 'center';
            el.style.backgroundSize = 'cover';
            cov.style.background = 'rgba(0, 0, 0, 0.7)';
            cov.style.opacity = 1;
        }
        else {
            p.textContent = '';
            el.style.background = 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.5))';
            cov.style.opacity = 0;
        }
    });
    const blue_ban_containers = document.querySelectorAll('.banContainer.blue');
    blue_ban_containers.forEach(el => {
        const idx = Number(el.id.slice(-1)) - 1;
        const p = el.querySelector('p');
        const cov = el.querySelector('.bcov');
        if (bp['blueBans'].length > idx) {
            p.textContent = bp['blueBans'][idx];
            const beatmapset_id = findSetID(bp['blueBans'][idx]);
            el.style.background = `url('https://assets.ppy.sh/beatmaps/${beatmapset_id}/covers/cover.jpg')`;
            el.style.backgroundPosition = 'center';
            el.style.backgroundSize = 'cover';
            cov.style.background = 'rgba(0, 0, 0, 0.7)';
            cov.style.opacity = 1;
        }
        else {
            p.textContent = '';
            el.style.background = 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.5))';
            cov.style.opacity = 0;
        }
    });
};

const findSetID = modID => {
    const bm = Array.from(mappool_detail).find(b => b.identifier == modID);
    if (bm) return bm.beatmapset_id;
    return null;
};