// получение заявок текущего клиента
async function getRequests(clientId) {
    const response = await fetch(`/api/requests/client/${clientId}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if (response.ok === true) {
        const requests = await response.json();
        const rows = document.querySelector("#t1 tbody");
        rows.innerHTML = "";
        requests.forEach(request => rows.append(row(request)));
    } else {
        const error = await response.json();
        console.log(error.message);
    }
}

// отмена заявки (только если статус "new")
async function cancelRequest(id) {
    const response = await fetch("/api/requests", {
        method: "PUT",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ requestID: id, requestStatus: "cancelled" })
    });
    if (response.ok === true) {
        const request = await response.json();
        document.querySelector(`#t1 tr[data-rowid='${request.requestID}']`).replaceWith(row(request));
    } else {
        const error = await response.json();
        console.log(error.message);
    }
}

// формирование строки таблицы
function row(request) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-rowid", request.requestID);

    const statusLabels = {
        "new": "Новая",
        "in_progress": "В работе",
        "waiting": "Ожидание",
        "done": "Завершено",
        "cancelled": "Отменено"
    };

    // ID заявки
    const idTd = document.createElement("td");
    idTd.append(request.requestID);
    tr.append(idTd);

    // дата создания
    const dateTd = document.createElement("td");
    dateTd.append(request.startDate);
    tr.append(dateTd);

    // вид авто
    const carTypeTd = document.createElement("td");
    carTypeTd.append(request.carType);
    tr.append(carTypeTd);

    // модель авто
    const carModelTd = document.createElement("td");
    carModelTd.append(request.carModel);
    tr.append(carModelTd);

    // описание проблемы
    const problemTd = document.createElement("td");
    problemTd.append(request.problemDescryption);
    tr.append(problemTd);

    // статус
    const statusTd = document.createElement("td");
    statusTd.append(statusLabels[request.requestStatus] || request.requestStatus);
    tr.append(statusTd);

    // кнопки действий
    const linksTd = document.createElement("td");
    linksTd.classList.add("button-group");

    const detailLink = document.createElement("button");
    detailLink.append("Подробнее");
    detailLink.classList.add("edit-button");
    detailLink.addEventListener("click", () => location.href = `/request-detail?id=${request.requestID}`);
    linksTd.append(detailLink);

    if (request.requestStatus === "new") {
        const cancelLink = document.createElement("button");
        cancelLink.append("Отменить");
        cancelLink.classList.add("remove-button");
        cancelLink.addEventListener("click", async () => await cancelRequest(request.requestID));
        linksTd.append(cancelLink);
    }

    tr.append(linksTd);
    return tr;
}

// получить clientId из скрытого поля (подставляется сервером)
const clientId = document.getElementById("currentUserId").value;
getRequests(clientId);
