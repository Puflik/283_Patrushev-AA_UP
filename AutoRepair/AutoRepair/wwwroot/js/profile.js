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
        showError(error.message);
    }
}

async function editUser(userId, fio, phone, login, password) {
    const currentRes = await fetch(`/api/users/${userId}`);
    const current = await currentRes.json();

    const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
            userID: parseInt(userId),
            fio: fio,
            phone: phone,
            login: login,
            password: password.trim() !== "" ? password : current.password,
            type: current.type
        })
    });
    if (response.ok) {
        const user = await response.json();
        document.getElementById("profileName").textContent = user.fio;
        document.getElementById("profileMeta").textContent = `${user.login} · ${user.phone}`;
        document.getElementById("profileAvatar").textContent = initials(user.fio);
        const navAvatar = document.getElementById("navAvatar");
        const navName = document.getElementById("navName");
        if (navAvatar) navAvatar.textContent = initials(user.fio);
        if (navName) navName.textContent = user.fio;
        showInfo("Данные сохранены");
    } else {
        const error = await response.json();
        showError(error.detail || error.message || "Ошибка сохранения");
    }
}

function reset() {
    document.getElementById("userFio").value      =
        document.getElementById("userPhone").value    =
        document.getElementById("userLogin").value    =
        document.getElementById("userPassword").value = "";
}

function toggleEdit() {
    const form = document.getElementById("editForm");
    const btn  = document.getElementById("toggleEditBtn");
    if (form.classList.contains("hidden")) {
        form.classList.remove("hidden");
        btn.textContent = "Отмена";
    } else {
        form.classList.add("hidden");
        btn.textContent = "Редактировать профиль";
        reset();
    }
}

document.getElementById("toggleEditBtn").addEventListener("click", toggleEdit);

document.getElementById("resetBtn").addEventListener("click", () => toggleEdit());

document.getElementById("saveBtn").addEventListener("click", async () => {
    const id       = document.getElementById("userID").value;
    const fio      = document.getElementById("userFio").value;
    const phone    = document.getElementById("userPhone").value;
    const login    = document.getElementById("userLogin").value;
    const password = document.getElementById("userPassword").value;
    await editUser(id, fio, phone, login, password);
    toggleEdit();
});

async function loadProfile() {
    const user = await getCurrentUser();
    if (!user) return;

    const nameEl = document.getElementById("profileName");
    const metaEl = document.getElementById("profileMeta");
    const avatarEl = document.getElementById("profileAvatar");
    const navAvatarEl = document.getElementById("navAvatar");
    const navNameEl = document.getElementById("navName");

    if (nameEl) nameEl.textContent = user.fio;
    if (metaEl) metaEl.textContent = `${user.login} · ${user.phone}`;
    if (avatarEl) avatarEl.textContent = initials(user.fio);
    if (navAvatarEl) navAvatarEl.textContent = initials(user.fio);
    if (navNameEl) navNameEl.textContent = user.fio;

    document.getElementById("userID").value = user.userID;
    document.getElementById("userFio").value = user.fio;
    document.getElementById("userPhone").value = user.phone;
    document.getElementById("userLogin").value = user.login;

    try {
        const res = await fetch(`/api/requests/client/${user.userID}`);
        if (res.ok) {
            const requests = await res.json();
<<<<<<< HEAD
        const statusMap = {
            active: ["new", "in_progress", "waiting", "Новая заявка", "В процессе ремонта", "Ожидание автозапчастей"],
            done:   ["done", "Завершена", "Готова к выдаче"],
            cancelled: ["cancelled", "Отменена"]
        };
        document.getElementById("statTotal").textContent = requests.length;
        document.getElementById("statDone").textContent = requests.filter(r => statusMap.done.includes(r.requestStatus)).length;
        document.getElementById("statActive").textContent = requests.filter(r => statusMap.active.includes(r.requestStatus)).length;
        document.getElementById("statCancelled").textContent = requests.filter(r => statusMap.cancelled.includes(r.requestStatus)).length;
=======
            document.getElementById("statTotal").textContent = requests.length;
            document.getElementById("statDone").textContent = requests.filter(r => r.requestStatus === "done").length;
            document.getElementById("statActive").textContent = requests.filter(r => ["new", "in_progress", "waiting"].includes(r.requestStatus)).length;
            document.getElementById("statCancelled").textContent = requests.filter(r => r.requestStatus === "cancelled").length;
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
        }
    } catch (e) {
        console.error('Ошибка загрузки статистики', e);
    }
}

loadProfile();
