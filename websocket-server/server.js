const WebSocket = require('ws');

// Створення WebSocket-сервера на порту 8080
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        try {
            const task = JSON.parse(message);
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(task));
                }
            });
        } catch (e) {
            console.error("Failed to parse message from client:", e);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
