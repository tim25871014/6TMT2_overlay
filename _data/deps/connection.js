function ConnectSocket() {
    // 連接到tosu的WebSocket伺服器
    let socket = new ReconnectingWebSocket('ws://127.0.0.1:24050/ws');

    // 連接到debug伺服器（如果需要的話）
    //let socket = new ReconnectingWebSocket('ws://127.0.0.1:3000/ws');
    return socket;
}