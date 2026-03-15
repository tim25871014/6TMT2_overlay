let stageInfo, mappool, players, upcoming;
let socket = new ReconnectingWebSocket('ws://127.0.0.1:24050/ws');
//let socket = new ReconnectingWebSocket('ws://127.0.0.1:3000/ws');

(async () => {
    $.ajaxSetup({ cache: false });
    stageInfo = await $.getJSON('../_data/beatmaps.json');
    players = await $.getJSON('../_data/players.json');

    getStageInfo();
})();

// 處理來自tosu的訊息
socket.onmessage = async (event) => {
    let data = JSON.parse(event.data);
    let tourneyMng = data.tourney.manager;
    if (!tourneyMng) return;

    updateTeamInfo(tourneyMng);
    updateScore(tourneyMng);
};

let redScore = 0, blueScore = 0;
function updateScore(tourneyMng) {
    const blueScoreNow = tourneyMng.stars.left;
    const redScoreNow = tourneyMng.stars.right;

    if (blueScoreNow === blueScore && redScoreNow === redScore) return; // 分數沒變不更新

    blueScore = blueScoreNow;
    redScore = redScoreNow; 

    const bluePlayer = players.find(p => p.username === nameBlue);
    const redPlayer = players.find(p => p.username === nameRed);
    const PlayerHexImage = document.querySelector('.player.winner .hex-image');

    const scoreDiv = document.getElementById('score');
    scoreDiv.innerText = `${blueScore} - ${redScore}`;

    if (redScore > blueScore) {
        document.getElementsByClassName('name winner')[0].innerText = nameRed;
        document.getElementsByClassName('name winner')[0].style.color = '#f2a1a1';
        PlayerHexImage.setAttribute('href', `https://a.ppy.sh/${redPlayer.id}`);
        document.getElementsByClassName('seed winner')[0].innerText = `${seedRed}`;
        // 把hex-border.winner的顏色改成紅色
        document.querySelector('.hex-border.winner').style.stroke = '#f2a1a1';
    } else if (blueScore > redScore) {
        document.getElementsByClassName('name winner')[0].innerText = nameBlue;
        document.getElementsByClassName('name winner')[0].style.color = '#a1c4f2';
        PlayerHexImage.setAttribute('href', `https://a.ppy.sh/${bluePlayer.id}`);
        document.getElementsByClassName('seed winner')[0].innerText = `${seedBlue}`;
        // 把hex-border.winner的顏色改成藍色
        document.querySelector('.hex-border.winner').style.stroke = '#a1c4f2';
    } else {
        document.getElementsByClassName('name winner')[0].innerText = 'Draw';
        document.getElementsByClassName('name winner')[0].style.color = '#cccccc';
        PlayerHexImage.setAttribute('href', `../_data/img/background.png`);
        document.getElementsByClassName('seed winner')[0].innerText = `-`;
        // 把hex-border.winner的顏色改成灰色
        document.querySelector('.hex-border.winner').style.stroke = '#cccccc';
    }
}

// 更新隊名與隊旗資訊
let nameRed = 'Red Team', nameBlue = '藍隊';
let seedRed = 'N/A', seedBlue = 'N/A';
function updateTeamInfo(tourneyMng) {
    if (players && nameRed !== tourneyMng.teamName.right && tourneyMng.teamName.right) {
        nameRed = tourneyMng.teamName.right || 'Red Team';
        let player = players.find(t => t.username == nameRed);
        seedRed = players.find(p => p.username === tourneyMng.teamName.right)?.seed || 'N/A';
    }
    if (players && nameBlue !== tourneyMng.teamName.left && tourneyMng.teamName.left) {
        nameBlue = tourneyMng.teamName.left || 'Blue Team';
        let player = players.find(t => t.username == nameBlue);
        seedBlue = players.find(p => p.username === tourneyMng.teamName.left)?.seed || 'N/A';
    }
}

function getStageInfo() {
    // 更新stage
    const stageText = document.querySelector('#stage');
    stageText.innerHTML = stageInfo.stage;
}