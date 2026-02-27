// получение данных профиля текущего пользователя
async function getUser(id) {
    const response = await fetch(`/api/users/${id}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if (response.ok === true) {
        const user = await response.json();
        document.getElementById("userID").value    = user.userID;
        document.getElementById("userFio").value   = user.fio;
        document.getElementById("userPhone").value = user.phone;
        document.getElementById("userLogin").value = user.login;
    } else {
        const error = await response.json();
        console.log(error.message);
    }
}

// обновление профиля
async function editUser(userId, fio, phone, login, password) {
    const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
            userID: parseInt(userId),
            fio: fio,
            phone: phone,
            login: login,
            password: password
        })
    });
    if (response.ok === true) {
        const user = await response.json();
        document.getElementById("userFio").value   = user.fio;
        document.getElementById("userPhone").value = user.phone;
        document.getElementById("userLogin").value = user.login;
    } else {
        const error = await response.json();
        console.log(error.message);
    }
}

// сброс полей
function reset() {
    document.getElementById("userFio").value      =
        document.getElementById("userPhone").value    =
        document.getElementById("userLogin").value    =
        document.getElementById("userPassword").value = "";
}

document.getElementById("resetBtn").addEventListener("click", () => reset());

document.getElementById("saveBtn").addEventListener("click", async () => {
    const id       = document.getElementById("userID").value;
    const fio      = document.getElementById("userFio").value;
    const phone    = document.getElementById("userPhone").value;
    const login    = document.getElementById("userLogin").value;
    const password = document.getElementById("userPassword").value;
    await editUser(id, fio, phone, login, password);
    reset();
});

// инициализация
const userId = document.getElementById("currentUserId").value;
getUser(userId);
