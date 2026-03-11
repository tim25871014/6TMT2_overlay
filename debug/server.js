const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'example.json');
let exampleData = {};

try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    exampleData = JSON.parse(raw);
    console.log(`Loaded JSON object with keys:`, Object.keys(exampleData));
} catch (err) {
    console.error('Failed to load JSON file:', err);
    process.exit(1);
}

function readFileSync() {
    const raw = fs.readFileSync(dataFile, 'utf8');
    exampleData = JSON.parse(raw);
}

const wss = new WebSocket.Server({ port: 3000 });
console.log('WebSocket server running at ws://127.0.0.1:3000');

wss.on('connection', (ws) => {
    console.log('Client connected');

    const sendData = () => {
        if (ws.readyState === WebSocket.OPEN) {
            readFileSync();
            ws.send(JSON.stringify(exampleData));
        }
    };

    const interval = setInterval(sendData, 1000);

    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(interval);
    });
});
