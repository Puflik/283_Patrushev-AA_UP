// получение всех пользователей
async function getUsers() {
    const response = await fetch("/api/users", {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if (response.ok === true) {
        const users = await response.json();
        const rows = document.querySelector("#t1 tbody");
        users.forEach(user => rows.append(row(user)));
    } else {
        const error = await response.json();
        showError(error.message);
    }
}

// получение одного пользователя для редактирования
async function getUser(id) {
    const response = await fetch(`/api/users/${id}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if (response.ok === true) {
        const user = await response.json();
        document.getElementById("userID").value       = user.userID;
        document.getElementById("userFio").value      = user.fio;
        document.getElementById("userPhone").value    = user.phone;
        document.getElementById("userLogin").value    = user.login;
        document.getElementById("userPassword").value = user.password;
        document.getElementById("userType").value     = user.type;
    } else {
        const error = await response.json();
        showError(error.message);
    }
}

// создание пользователя
async function createUser(fio, phone, login, password, type) {
    const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
            fio: fio,
            phone: phone,
            login: login,
            password: password,
            type: type
        })
    });
    if (response.ok === true) {
        const user = await response.json();
        document.querySelector("#t1 tbody").append(row(user));
    } else {
        const error = await response.json();
        showError(error.message);
    }
}

// обновление пользователя
async function editUser(userId, fio, phone, login, password, type) {
    const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
            userID: parseInt(userId),
            fio: fio,
            phone: phone,
            login: login,
            password: password,
            type: type
        })
    });
    if (response.ok === true) {
        const user = await response.json();
        document.querySelector(`#t1 tr[data-rowid='${user.userID}']`).replaceWith(row(user));
    } else {
        const error = await response.json();
        showError(error.message);
    }
}

// удаление пользователя
async function deleteUser(id) {
    const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: { "Accept": "application/json", "Content-Type": "application/json" }
    });
    if (response.ok === true) {
        document.querySelector(`#t1 tr[data-rowid='${id}']`).remove();
    } else {
        const error = await response.json();
        showError(error.message);
    }
}

// сброс полей формы
function reset() {
    document.getElementById("userID").value       =
        document.getElementById("userFio").value      =
        document.getElementById("userPhone").value    =
        document.getElementById("userLogin").value    =
        document.getElementById("userPassword").value =
        document.getElementById("userType").value     = "";
}

// формирование строки таблицы
function row(user) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-rowid", user.userID);
    tr.setAttribute("data-role", user.type);

    // ID пользователя
    const idTd = document.createElement("td");
    idTd.append(user.userID);
    tr.append(idTd);

    // ФИО
    const fioTd = document.createElement("td");
    fioTd.append(user.fio);
    tr.append(fioTd);

    // телефон
    const phoneTd = document.createElement("td");
    phoneTd.append(user.phone);
    tr.append(phoneTd);

    // логин
    const loginTd = document.createElement("td");
    loginTd.append(user.login);
    tr.append(loginTd);

    // пароль
    const passwordTd = document.createElement("td");
    passwordTd.append(user.password);
    tr.append(passwordTd);

    // тип
    const typeTd = document.createElement("td");
    typeTd.append(user.type);
    tr.append(typeTd);

    // кнопки
    const linksTd = document.createElement("td");
    linksTd.classList.add("button-group");

    const editLink = document.createElement("button");
    editLink.append("Изменить");
    editLink.classList.add("edit-button");
    editLink.addEventListener("click", async () => await getUser(user.userID));
    linksTd.append(editLink);

    const removeLink = document.createElement("button");
    removeLink.append("Удалить");
    removeLink.classList.add("remove-button");
    removeLink.addEventListener("click", async () => {
        const ok = await confirmAction('Вы уверены? Это действие необратимо');
        if (ok) {
            await deleteUser(user.userID);
            showInfo('Пользователь удалён');
        }
    });
    linksTd.append(removeLink);

    tr.append(linksTd);
    return tr;
}

document.getElementById("resetBtn").addEventListener("click", () => reset());

document.getElementById("saveBtn").addEventListener("click", async () => {
    const id       = document.getElementById("userID").value;
    const fio      = document.getElementById("userFio").value;
    const phone    = document.getElementById("userPhone").value;
    const login    = document.getElementById("userLogin").value;
    const password = document.getElementById("userPassword").value;
    const type     = document.getElementById("userType").value;
    if (id === "")
        await createUser(fio, phone, login, password, type);
    else
        await editUser(id, fio, phone, login, password, type);
    reset();
});

// инициализация
getUsers();

// Фильтрация по роли
document.querySelectorAll(".filter-btn[data-role]").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn[data-role]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const role = btn.dataset.role;
        document.querySelectorAll("#t1 tbody tr").forEach(tr => {
            tr.style.display = (role === "all" || tr.dataset.role === role) ? "" : "none";
        });
    });
});
