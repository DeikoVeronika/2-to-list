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

            console.log(`Parsed task: ${JSON.stringify(task)}`);

            // Логування різних типів дій
            if (task.action === 'add') {
                console.log(`Adding new task: ${task.text}`);
            } else if (task.action === 'update') {
                console.log(`Updating task state: ${task.id}, checked: ${task.checked}`);
            } else if (task.action === 'delete') {
                console.log(`Deleting task: ${task.id}`);
            } else if (task.action === 'reorder') {
                console.log(`Reordering task: ${task.id}`);
            }

            // Відправка повідомлення всім клієнтам
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(task)); // Відправка JSON-формату
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
