const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const socket = new WebSocket('ws://localhost:8080');
const clientId = Date.now();  // Унікальний ідентифікатор клієнта

// Відправка нового завдання на сервер
function sendTask(task) {
    task.clientId = clientId;  // Додаємо ідентифікатор клієнта
    socket.send(JSON.stringify(task));
}

function addTask() {
    const taskText = inputBox.value.trim();
    if (!taskText) {
        alert("You must write something!");
        return;
    }

    const taskId = `task-${Date.now()}`;
    const li = createTaskElement(taskId, taskText);

    listContainer.appendChild(li);
    addDragAndDropHandlers(li);
    sendTask({ action: 'add', id: taskId, text: taskText, checked: false });
    animateNewTask(li);

    inputBox.value = "";
    saveData();
}

function createTaskElement(id, text) {
    const li = document.createElement("li");
    li.id = id;
    li.textContent = text;
    li.draggable = true;

    const closeButton = document.createElement("span");
    closeButton.innerHTML = `\u00d7`;
    li.appendChild(closeButton);

    return li;
}

// Додавання завдання до списку
function addTaskToList(task, animate) {
    if (document.getElementById(task.id)) return;

    const li = createTaskElement(task.id, task.text);

    if (task.checked) {
        li.classList.add("checked");
    }

    listContainer.appendChild(li);
    addDragAndDropHandlers(li);

    if (animate) {
        animateNewTask(li);
    }
}

// Показування завдань з localStorage
function showTask() {
    let tasks = JSON.parse(localStorage.getItem("tasks"));
    if (tasks) {
        tasks.forEach(task => {
            addTaskToList(task, false);  // false для відображення без анімації при завантаженні
        });
    }
}

function updateTaskStatus(task, animate) {
    const li = document.getElementById(task.id);
    if (li) {
        li.classList.toggle("checked", task.checked);
        if (animate) {
            animateHighlightTask(li);  // Анімація тільки для інших клієнтів
        }
    }
}

function deleteTaskFromList(task) {
    const li = document.getElementById(task.id);
    if (li) {
        li.classList.add("fade-out");  // Анімація видалення
        setTimeout(() => {
            li.remove();
        }, 500);
    }
}

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

function addDragAndDropHandlers(item) {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.id);
    setTimeout(() => e.target.classList.add('hide'), 0);
}

function handleDragEnd(e) {
    e.target.classList.remove('hide');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text');
    const draggableElement = document.getElementById(id);
    const dropzone = e.target;

    const mouseY = e.clientY;
    const offsetY = dropzone.getBoundingClientRect().top + (dropzone.getBoundingClientRect().height / 2);

    listContainer.insertBefore(
        draggableElement,
        mouseY < offsetY ? dropzone : dropzone.nextSibling
    );

    const order = Array.from(listContainer.querySelectorAll("li")).map(li => li.id);
    sendTask({ action: 'reorder', order, draggedId: id });

    animateHighlightTask(draggableElement);
    saveData();
}

// Анімація нового завдання
function animateNewTask(taskElement) {
    taskElement.classList.add("highlight");
    setTimeout(() => {
        taskElement.classList.remove("highlight");
    }, 1000);
}

// Додавання підсвітки
function animateHighlightTask(taskElement) {
    taskElement.classList.add("highlight");
    setTimeout(() => {
        taskElement.classList.remove("highlight");
    }, 1000);
}

// Анімація переміщення завдання
function animateReorderTask(taskElement) {
    taskElement.classList.add("move");
    setTimeout(() => {
        taskElement.classList.remove("move");
    }, 500);
}

// Перетягування і зміна порядку
function reorderTasks(order, animate, draggedId) {
    order.forEach((id) => {
        const li = document.getElementById(id);
        listContainer.appendChild(li);
        if (animate && id === draggedId) {  // Підсвічуємо перетягнутий елемент
            animateHighlightTask(li);
        }
    });
}

// Додавання завдання при натисканні Enter
inputBox.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addTask();
    }
});

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

// Обробка повідомлень від сервера
socket.onmessage = function(event) {
    try {
        const task = JSON.parse(event.data);
        const isInitiator = task.clientId === clientId;
        const animate = !isInitiator;

        switch (task.action) {
            case 'add':
                addTaskToList(task, animate);
                break;
            case 'update':
                updateTaskStatus(task, animate);
                break;
            case 'delete':
                deleteTaskFromList(task);
                break;
            case 'reorder':
                reorderTasks(task.order, animate, task.draggedId);
                break;
            default:
                console.warn("Unknown task action:", task.action);
        }
    } catch (e) {
        console.error("Failed to parse message from server:", e);
    }
};

showTask();
