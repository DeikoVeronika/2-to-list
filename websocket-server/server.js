const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// Мапа для зберігання з'єднань
const clients = new Map();

wss.on('connection', (ws) => {
    const clientId = Date.now();
    clients.set(clientId, ws);

    console.log(`New client connected: ${clientId}`);

    ws.on('message', (message) => {
        console.log(`Received message from ${clientId}: ${message}`);
        
        // Парсимо повідомлення
        let task;
        try {
            task = JSON.parse(message);
        } catch (error) {
            console.error('Invalid JSON:', error);
            return;
        }

        // Відправляємо повідомлення всім клієнтам, окрім того, який відправив запит
        clients.forEach((client, id) => {
            if (id !== clientId && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        clients.delete(clientId);
    });

    ws.on('error', (error) => {
        console.error(`Client error: ${clientId}`, error);
        clients.delete(clientId);
    });
});
