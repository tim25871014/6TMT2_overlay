let comingup, teams, mappool;
(async () => {
	$.ajaxSetup({ cache: false });
	comingup = await $.getJSON('../_data/coming_up.json');
	teams = await $.getJSON('../_data/teams.json');
	mappool = await $.getJSON('../_data/beatmaps.json');
	// let stage = mappool.stage.toUpperCase();
	let stage = mappool.stage + '<br> Mappool Showcase';
	if (stage) document.getElementById('stage-name').innerHTML = stage;
	//let timer = document.getElementById('timer');

	let timer_end = comingup.time - 0 * 60 * 60 * 1000;
	if (timer_end > Date.now()) {
		let timer_int = setInterval(() => {
			if (timer_end < Date.now()) {
				clearInterval(timer_int);
				if (timer) timer.innerHTML = '00:00';
			}
			let remaining = Math.floor((timer_end - Date.now()) / 1000);
			let hours = Math.floor(remaining / 60 / 60);
			let date = new Date(null);
			date.setSeconds(remaining);
			let text = hours > 0 ? date.toISOString().slice(11, 19) : date.toISOString().slice(14, 19);
			if (timer && remaining > 0) timer.innerHTML = text;
		}, 1000);
	}

	console.log(comingup.red_team);
	let team_red = teams.find(t => t.team == comingup.red_team);
	console.log(team_red);
	if (team_red) {
		document.getElementById('red-team').innerHTML = team_red.team;
		document.getElementById('red-flag').src = `../_data/assets/flags/${team_red.flag}.png`;
        for (let i = 0; i < 2; i++) {
			let player = team_red.players[i]?.username || '';
			document.getElementById(`red-player-${i + 1}`).innerHTML = player;
		}
	}

	let team_blue = teams.find(t => t.team == comingup.blue_team);
	if (team_blue) {
		document.getElementById('blue-team').innerHTML = team_blue.team;
		document.getElementById('blue-flag').src = `../_data/assets/flags/${team_blue.flag}.png`;
		for (let i = 0; i < 2; i++) {
			let player = team_blue.players[i]?.username || '';
			document.getElementById(`blue-player-${i + 1}`).innerHTML = player;
		}
	}
})();

let socket = new ReconnectingWebSocket('ws://' + location.host + '/ws');

let title = document.getElementById('title');
let time = document.getElementById('time');

socket.onopen = () => { console.log('Successfully Connected'); };
socket.onclose = event => { console.log('Socket Closed Connection: ', event); socket.send('Client Closed!'); };
socket.onerror = error => { console.log('Socket Error: ', error); };

let tempTime, tempMapName;

socket.onmessage = event => {
	let data = JSON.parse(event.data);

	if (tempMapName !== `${data.menu.bm.metadata.artist} - <b>${data.menu.bm.metadata.title}</b>`) {
		tempMapName = `${data.menu.bm.metadata.artist} - <b>${data.menu.bm.metadata.title}</b>`;
		title.innerHTML = `<span id="note">♪</span> ${tempMapName}`;
	}
}
