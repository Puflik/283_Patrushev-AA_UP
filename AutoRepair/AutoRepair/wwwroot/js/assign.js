// получение заявки для назначения
async function getRequest(id) {
    const response = await fetch(`/api/requests/${id}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if (response.ok === true) {
        const request = await response.json();
        document.getElementById("requestID").value = request.requestID;
        document.getElementById("carType").value   = request.carType;
        document.getElementById("carModel").value  = request.carModel;
        document.getElementById("problem").value   = request.problemDescryption;
        document.getElementById("status").value    = request.requestStatus;
    } else {
        const error = await response.json();
        showError(error.message);
    }
}

// получение списка механиков
async function getMechanics() {
    const response = await fetch("/api/users", {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if (response.ok === true) {
        const users = await response.json();
        const mechanics = users.filter(u => u.type === "mechanic");
        const rows = document.querySelector("#t1 tbody");
        rows.innerHTML = "";
        mechanics.forEach(mechanic => rows.append(row(mechanic)));
    } else {
        const error = await response.json();
        showError(error.message);
    }
}

// назначение механика на заявку
async function assignMechanic(requestId, masterId) {
    const response = await fetch("/api/requests", {
        method: "PUT",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
            requestID: parseInt(requestId),
            masterID: parseInt(masterId),
            requestStatus: "in_progress"
        })
    });
    if (response.ok === true) {
        location.href = "/requests";
    } else {
        const error = await response.json();
        showError(error.message);
    }
}

// формирование строки механика
function row(mechanic) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-rowid", mechanic.userID);

    const idTd = document.createElement("td");
    idTd.append(mechanic.userID);
    tr.append(idTd);

    const fioTd = document.createElement("td");
    fioTd.append(mechanic.fio);
    tr.append(fioTd);

    const phoneTd = document.createElement("td");
    phoneTd.append(mechanic.phone);
    tr.append(phoneTd);

    const linksTd = document.createElement("td");
    linksTd.classList.add("button-group");

    const assignLink = document.createElement("button");
    assignLink.append("Назначить");
    assignLink.classList.add("edit-button");
    assignLink.addEventListener("click", async () => {
        const requestId = document.getElementById("requestID").value;
        await assignMechanic(requestId, mechanic.userID);
    });
    linksTd.append(assignLink);

    tr.append(linksTd);
    return tr;
}

// инициализация: id заявки из адресной строки
const params = new URLSearchParams(window.location.search);
const requestId = params.get("id");
getRequest(requestId);
getMechanics();
