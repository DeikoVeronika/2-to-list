const WebSocket = require('ws');

// Створення WebSocket-сервера на порту 8080
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('New client connected');

    // Обробка отриманих повідомлень від клієнтів
    ws.on('message', (message) => {
        console.log(`Received message: ${message}`);
        try {
            const task = JSON.parse(message); // Перетворення в об'єкт
            // Відправка повідомлення всім клієнтам
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(task)); // Відправка JSON-формату
                    console.log(`Sent message to client: ${message}`); // Логування для налагодження
                }
            });
        } catch (e) {
            console.error("Failed to parse message from client:", e);
        }
    });

    // Виведення в консоль, коли клієнт відключається
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
