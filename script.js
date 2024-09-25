const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");

// Підключення до WebSocket-сервера
const socket = new WebSocket('ws://localhost:8080');

// Відправка нового завдання на сервер
function sendTask(task) {
    socket.send(JSON.stringify(task));
}

// Додати завдання
function addTask() {
    if (inputBox.value.trim() === '') {
        alert("You must write something!");
    } else {
        let li = document.createElement("li");
        li.textContent = inputBox.value;

        // Присвоюємо унікальний id для кожного елемента li
        li.id = `task-${Date.now()}`;
        li.draggable = true;

        listContainer.appendChild(li);

        let span = document.createElement("span");
        span.innerHTML = `\u00d7`;
        li.appendChild(span);

        addDragAndDropHandlers(li);

        // Відправити нове завдання на сервер
        sendTask({ action: 'add', id: li.id, text: inputBox.value, checked: false });
    }
    inputBox.value = "";
    saveData();
}

// Обробка повідомлень від сервера
socket.onmessage = function(event) {
    try {
        const task = JSON.parse(event.data);

        if (task.action === 'add') {
            // Додавання нового завдання
            addTaskToList(task);
        } else if (task.action === 'update') {
            updateTaskStatus(task);
        } else if (task.action === 'delete') {
            deleteTaskFromList(task);
        } else if (task.action === 'reorder') {
            reorderTasks(task.order);
        }
    } catch (e) {
        console.error("Failed to parse message from server:", e);
    }
};

// Додавання завдання до списку
function addTaskToList(task) {
    const existingTask = document.getElementById(task.id);
    if (existingTask) return;

    let li = document.createElement("li");
    li.textContent = task.text;
    li.id = task.id;
    li.draggable = true;

    if (task.checked) {
        li.classList.add("checked");
    }

    listContainer.appendChild(li);

    let span = document.createElement("span");
    span.innerHTML = `\u00d7`;
    li.appendChild(span);

    addDragAndDropHandlers(li);
}

// Оновлення стану завдання
function updateTaskStatus(task) {
    const li = document.getElementById(task.id);
    if (li) {
        li.classList.toggle("checked", task.checked);
    }
}

// Видалення завдання
function deleteTaskFromList(task) {
    const li = document.getElementById(task.id);
    if (li) {
        li.remove();
    }
}

// Перетягування
function reorderTasks(order) {
    order.forEach(id => {
        const li = document.getElementById(id);
        listContainer.appendChild(li);
    });
}

listContainer.addEventListener("click", function (e) {
    if (e.target.tagName === "LI") {
        e.target.classList.toggle("checked");
        const checked = e.target.classList.contains("checked");
        sendTask({ action: 'update', id: e.target.id, checked });
        saveData();
    } else if (e.target.tagName === "SPAN") {
        const taskId = e.target.parentElement.id;
        sendTask({ action: 'delete', id: taskId });
        e.target.parentElement.remove();
        saveData();
    }
}, false);

// Збереження даних в localStorage
function saveData() {
    let tasks = [];
    listContainer.querySelectorAll("li").forEach(li => {
        tasks.push({
            id: li.id,
            text: li.firstChild.textContent,
            checked: li.classList.contains("checked")
        });
    });
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function showTask() {
    let tasks = JSON.parse(localStorage.getItem("tasks"));
    if (tasks) {
        tasks.forEach(task => {
            addTaskToList(task);
        });
    }
}
showTask();

function addDragAndDropHandlers(item) {
    item.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/plain', e.target.id);
        setTimeout(() => {
            e.target.classList.add('hide');
        }, 0);
    });

    item.addEventListener('dragend', function (e) {
        e.target.classList.remove('hide');
    });

    item.addEventListener('dragover', function (e) {
        e.preventDefault();
    });

    item.addEventListener('drop', function (e) {
        e.preventDefault();
        const id = e.dataTransfer.getData('text');
        const draggableElement = document.getElementById(id);
        const dropzone = e.target;

        const mouseY = e.clientY;
        const boundingRect = dropzone.getBoundingClientRect();
        const offsetY = boundingRect.top + (boundingRect.height / 2);

        if (mouseY < offsetY) {
            listContainer.insertBefore(draggableElement, dropzone);
        } else {
            listContainer.insertBefore(draggableElement, dropzone.nextSibling);
        }

        // Відправлення нового порядку на сервер
        let order = [...listContainer.querySelectorAll("li")].map(li => li.id);
        sendTask({ action: 'reorder', order });

        saveData();
    });
}
