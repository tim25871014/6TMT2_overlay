let socket = new ReconnectingWebSocket('ws://' + location.host + '/ws');

socket.onclose = event => {
    console.log('Socket Closed Connection: ', event);
    socket.send('Client Closed!');
};

socket.onerror = error => { console.log('Socket Error: ', error); };

socket.onmessage = async event => {
    await delay(2000);
    let data = JSON.parse(event.data);
    //console.log(data);
}

const delay = async time => new Promise(resolve => setTimeout(resolve, time));