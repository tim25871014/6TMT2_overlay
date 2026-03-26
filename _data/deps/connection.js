function Connection() {
    let socket = new ReconnectingWebSocket('ws://127.0.0.1:24050/ws');
    //let socket = new ReconnectingWebSocket('ws://127.0.0.1:3000/ws');
    return socket;
}