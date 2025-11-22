// 更新隊伍名稱
let red_name = document.getElementById('red-name');
let blue_name = document.getElementById('blue-name');
let nameRed = 'Red Team', nameBlue = '藍隊';
function updateTeamNames(tourneyMng) {
    if (nameBlue !== tourneyMng.teamName.left && tourneyMng.teamName.left) {
        nameBlue = tourneyMng.teamName.left || 'Blue';
    }
    if (nameRed !== tourneyMng.teamName.right && tourneyMng.teamName.right) {
        nameRed = tourneyMng.teamName.right || 'Red';
    }
}

// 更新種子序
let seedAdded = false;
let red_points = document.getElementById('red-points');
let blue_points = document.getElementById('blue-points');
function updateSeeding(tourneyMng) {
    if (seedAdded) return;
    seedAdded = true;
    let seedBlue = document.createElement('div');
    let seedRed = document.createElement('div');
    seedBlue.className = 'seed';
    seedRed.className = 'seed';
    seedBlue.innerText = 'Blue Seed';
    seedRed.innerText = 'Red Seed';
    document.getElementById('blue-points').appendChild(seedBlue);
    document.getElementById('red-points').appendChild(seedRed);
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
            document.getElementById(`blue${i}`).style.backgroundColor = 'blue';
        }
        for (let i = starsBlue + 1; i <= firstTo; i++) {
            document.getElementById(`blue${i}`).style.backgroundColor = 'unset';
        }
    }
    if (starsRed !== tourneyMng.stars.right) {
        starsRed = tourneyMng.stars.right;
        for (let i = 1; i <= starsRed; i++) {
            document.getElementById(`red${i}`).style.backgroundColor = 'red';
        }
        for (let i = starsRed + 1; i <= firstTo; i++) {
            document.getElementById(`red${i}`).style.backgroundColor = 'unset';
        }
    }
}

// 更新隊名與隊旗資訊
let red_flag = document.getElementById('red-flag');
let blue_flag = document.getElementById('blue-flag');
function updateTeamInfo(tourneyMng) {
    if (!red_flag || !blue_flag) return;
    if (teams && nameBlue !== tourneyMng.teamName.left && tourneyMng.teamName.left) {
        console.log("test");
        nameBlue = tourneyMng.teamName.left || 'Blue Team';
        console.log(nameBlue);
        blue_name.innerHTML = nameBlue;
        let team = teams.find(t => t.team == nameBlue);
        console.log(team);
        flagBlue = team?.flag || null;
        if (flagBlue) blue_flag.src = `../_data/assets/flags/${flagBlue}.png`;
        else blue_flag.src = `https://assets.ppy.sh/old-flags/XX.png`;
    }
    if (teams && nameRed !== tourneyMng.teamName.right && tourneyMng.teamName.right) {
        nameRed = tourneyMng.teamName.right || 'Red Team';
        red_name.innerHTML = nameRed;
        let team = teams.find(t => t.team == nameRed);
        flagRed = team?.flag || null;
        if (flagRed) red_flag.src = `../_data/assets/flags/${flagRed}.png`;
        else red_flag.src = `https://assets.ppy.sh/old-flags/XX.png`;
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