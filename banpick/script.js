let mappool, teqms, coming_up;

// Fetch data
(async () => {
    $.ajaxSetup({ cache: false });
    mappool = await $.getJSON('../_data/beatmaps.json');
    teams = await $.getJSON('../_data/teams.json');
    coming_up = await $.getJSON('../_data/coming_up.json');
    console.log(mappool);
})();

// Setup WebSocket
let socket = new ReconnectingWebSocket('ws://' + location.host + '/ws');
socket.onopen = () => { console.log('Successfully Connected'); };
socket.onclose = event => { console.log('Socket Closed Connection: ', event); socket.send('Client Closed!'); };

// Handle incoming messages
socket.onmessage = event => {
    let data = JSON.parse(event.data);
}