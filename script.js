const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");

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
    }
    inputBox.value = "";
    saveData();
}

inputBox.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        addTask();
    }
});

listContainer.addEventListener("click", function (e) {
    if (e.target.tagName === "LI") {
        e.target.classList.toggle("checked");
        saveData();
    } else if (e.target.tagName === "SPAN") {
        e.target.parentElement.remove();
        saveData();
    }
}, false);

function saveData() {
    let tasks = [];
    listContainer.querySelectorAll("li").forEach(li => {
        tasks.push({
            id: li.id,
            text: li.firstChild.textContent,
            checked: li.classList.contains("checked") // Зберігаємо стан "checked"
        });
    });
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function showTask() {
    let tasks = JSON.parse(localStorage.getItem("tasks"));
    if (tasks) {
        listContainer.innerHTML = '';
        tasks.forEach(task => {
            let li = document.createElement("li");
            li.textContent = task.text;
            li.id = task.id;
            li.draggable = true;

            if (task.checked) {
                li.classList.add("checked"); // Відновлюємо стан "checked"
            }

            listContainer.appendChild(li);

            let span = document.createElement("span");
            span.innerHTML = `\u00d7`;
            li.appendChild(span);

            addDragAndDropHandlers(li);
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

        if (dropzone === listContainer.lastElementChild) {
            listContainer.appendChild(draggableElement); // Розміщуємо в кінці
        } else {
            listContainer.insertBefore(draggableElement, dropzone); // Вставляємо перед цільовим елементом
        }

        saveData();
    });
}