// 更新種子序
let seedAdded = false;
let red_points = document.getElementById('red-points');
let blue_points = document.getElementById('blue-points');
function updateSeeding(tourneyMng, players) {
    if (seedAdded) return;
    seedAdded = true;
    let blue_seed = document.createElement('div');
    let red_seed = document.createElement('div');

    let seedBlue = players.find(p => p.username === tourneyMng.teamName.left)?.seed || 'N/A';
    let seedRed = players.find(p => p.username === tourneyMng.teamName.right)?.seed || 'N/A';

    blue_seed.className = 'seed';
    red_seed.className = 'seed';
    blue_seed.innerText = seedBlue;
    red_seed.innerText = seedRed;
    document.getElementById('blue-points').appendChild(blue_seed);
    document.getElementById('red-points').appendChild(red_seed);
}

// 更新分數條顯示
let bestOf, firstTo;
function updateScoreBars(tourneyMng) {
    if (bestOf === tourneyMng.bestOF) return;
    let newmax = Math.ceil(tourneyMng.bestOF / 2);
    if (bestOf === undefined || bestOf < tourneyMng.bestOF) {
        let start = (bestOf === undefined) ? 0 : firstTo;
        for (let i = start + 1; i <= newmax; i++) {
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

    bestOf = tourneyMng.bestOF;
    firstTo = newmax;
}

// 計算雙方分數
let starsRed, scoreRed, flagRed;
let starsBlue, scoreBlue, flagBlue;
function updateScore(tourneyMng) {
    if (starsBlue !== tourneyMng.stars.left) {
        starsBlue = tourneyMng.stars.left;
        for (let i = 1; i <= starsBlue; i++) {
            document.getElementById(`blue${i}`).style.backgroundImage = 'url("../_data/img/star_white.png")';
        }
        for (let i = starsBlue + 1; i <= firstTo; i++) {
            document.getElementById(`blue${i}`).style.backgroundImage = 'url("../_data/img/star_transparent.png")';
        }
    }
    if (starsRed !== tourneyMng.stars.right) {
        starsRed = tourneyMng.stars.right;
        for (let i = 1; i <= starsRed; i++) {
            document.getElementById(`red${i}`).style.backgroundImage = 'url("../_data/img/star_white.png")';
        }
        for (let i = starsRed + 1; i <= firstTo; i++) {
            document.getElementById(`red${i}`).style.backgroundImage = 'url("../_data/img/star_transparent.png")';
        }
    }
}

// 更新隊名與隊旗資訊
let red_name = document.getElementById('red-name');
let blue_name = document.getElementById('blue-name');
let nameRed = 'Red Team', nameBlue = '藍隊';
let red_flag = document.getElementById('red-flag');
let blue_flag = document.getElementById('blue-flag');
function updateTeamInfo(tourneyMng) {
    if (!red_flag || !blue_flag) return;
    if (players && nameRed !== tourneyMng.teamName.left && tourneyMng.teamName.left) {
        nameRed = tourneyMng.teamName.left || 'Red Team';
        red_name.innerHTML = nameRed;
        let player = players.find(t => t.username == nameRed);
        flagRed = player?.id || null;
        if (flagRed) red_flag.src = `https://a.ppy.sh/${player.id}`;
        else red_flag.src = `https://assets.ppy.sh/old-flags/XX.png`;
    }
    if (players && nameBlue !== tourneyMng.teamName.right && tourneyMng.teamName.right) {
        nameBlue = tourneyMng.teamName.right || 'Blue Team';
        blue_name.innerHTML = nameBlue;
        let player = players.find(t => t.username == nameBlue);
        flagBlue = player?.id || null;
        if (flagBlue) blue_flag.src = `https://a.ppy.sh/${player.id}`;
        else blue_flag.src = `https://assets.ppy.sh/old-flags/XX.png`;
    }
}

// 更新及生成聊天室內容
let chat_container = document.getElementById('chat-container');
let chat = document.getElementById('chat');
let chatLen = 0;
function updateChat(tourneyMng) {
    if (!chat_container || !chat) return;
    if (chatLen == tourneyMng.chat.length) return;
    if (chatLen == 0 || (chatLen > 0 && chatLen > tourneyMng.chat.length)) {
        chat.innerHTML = '';
        chatLen = 0;
    }
    for (let i = chatLen; i < tourneyMng.chat.length; i++) {
        const chatMsg = tourneyMng.chat[i];

        if (chatMsg.name == 'BanchoBot' && chatMsg.messageBody.startsWith('Match history')) continue;

        let chatLine = document.createElement('div');
        let chatTime = document.createElement('div');
        let chatName = document.createElement('div');
        let chatText = document.createElement('div');

        chatLine.setAttribute('class', 'chat');
        chatTime.setAttribute('class', 'chatTime');
        chatName.setAttribute('class', 'chatName');
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
    chatLen = tourneyMng.chat.length;
    chat.scrollTop = chat.scrollHeight;
}