function ConnectSocket() {
    // Connect to tosu WebSocket server
    let socket = new ReconnectingWebSocket('ws://127.0.0.1:24050/ws');

    // Connect to debug server (if needed)
    // let socket = new ReconnectingWebSocket('ws://127.0.0.1:3000/ws');
    return socket;
}

