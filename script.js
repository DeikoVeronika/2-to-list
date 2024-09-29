const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");

const socket = new WebSocket('ws://localhost:8080');
const clientId = Date.now();  // Унікальний ідентифікатор клієнта

// Відправка нового завдання на сервер
function sendTask(task) {
    task.clientId = clientId;  // Додаємо ідентифікатор клієнта
    socket.send(JSON.stringify(task));
}

// Додавання завдання
function addTask() {
    if (inputBox.value.trim() === '') {
        alert("You must write something!");
    } else {
        let li = document.createElement("li");
        li.textContent = inputBox.value;

        li.id = `task-${Date.now()}`;
        li.draggable = true;

        listContainer.appendChild(li);

        let span = document.createElement("span");
        span.innerHTML = `\u00d7`;
        li.appendChild(span);

        addDragAndDropHandlers(li);

        sendTask({ action: 'add', id: li.id, text: inputBox.value, checked: false });
        animateNewTask(li); // Анімація нового завдання для поточного клієнта
    }
    inputBox.value = "";
    saveData();
}

// Анімація нового завдання
function animateNewTask(taskElement) {
    taskElement.classList.add("highlight");
    setTimeout(() => {
        taskElement.classList.remove("highlight");
    }, 1000);
}

// Додавання завдання при натисканні Enter
inputBox.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addTask();
    }
});

// Обробка повідомлень від сервера
socket.onmessage = function(event) {
    try {
        const task = JSON.parse(event.data);

        // Якщо повідомлення надійшло від іншого клієнта, тільки тоді показуємо анімацію
        if (task.clientId !== clientId) {
            if (task.action === 'add') {
                addTaskToList(task, true);  // true для анімації
            } else if (task.action === 'update') {
                updateTaskStatus(task, true);  // true для анімації
            } else if (task.action === 'delete') {
                deleteTaskFromList(task);
            } else if (task.action === 'reorder') {
                reorderTasks(task.order, true);  // true для анімації
            }
        } else {
            if (task.action === 'add') {
                addTaskToList(task, false);  // false, бо не потрібна анімація для ініціатора
            } else if (task.action === 'update') {
                updateTaskStatus(task, false);  // false для ініціатора
            } else if (task.action === 'delete') {
                deleteTaskFromList(task);
            } else if (task.action === 'reorder') {
                reorderTasks(task.order, false);  // false для ініціатора
            }
        }
    } catch (e) {
        console.error("Failed to parse message from server:", e);
    }
};

// Додавання завдання до списку
function addTaskToList(task, animate) {
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

    if (animate) {
        animateNewTask(li);  // Анімація, тільки якщо це інший клієнт
    }
}

// Оновлення стану завдання
function updateTaskStatus(task, animate) {
    const li = document.getElementById(task.id);
    if (li) {
        li.classList.toggle("checked", task.checked);
        if (animate) {
            animateHighlightTask(li);  // Анімація тільки для інших клієнтів
        }
    }
}

// Видалення завдання
function deleteTaskFromList(task) {
    const li = document.getElementById(task.id);
    if (li) {
        li.classList.add("fade-out");  // Анімація видалення
        setTimeout(() => {
            li.remove();
        }, 500);
    }
}

// Перетягування і зміна порядку
function reorderTasks(order, animate) {
    order.forEach((id, index) => {
        const li = document.getElementById(id);
        listContainer.appendChild(li);
        if (animate && index === 0) {  // Підсвічуємо тільки перший переміщений елемент
            animateHighlightTask(li);  // Анімація тільки для інших клієнтів
        }
    });
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

// Підсвічування завдання
function animateHighlightTask(taskElement) {
    taskElement.classList.add("highlight");
    setTimeout(() => {
        taskElement.classList.remove("highlight");
    }, 1000);
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

// Показування завдань з localStorage
function showTask() {
    let tasks = JSON.parse(localStorage.getItem("tasks"));
    if (tasks) {
        tasks.forEach(task => {
            addTaskToList(task, false);  // false для відображення без анімації при завантаженні
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
