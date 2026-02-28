// получение всех заявок (для механика — только свои)
async function getRequests() {
    const response = await fetch("/api/requests", {
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
        showError(error.message);
    }
}

// формирование строки таблицы
function row(request) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-rowid", request.requestID);
    tr.setAttribute("data-status", request.requestStatus);

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

    // дата
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

    // ID механика
    const masterTd = document.createElement("td");
    masterTd.append(request.masterID ?? "—");
    tr.append(masterTd);

    // кнопки
    const linksTd = document.createElement("td");
    linksTd.classList.add("button-group");

    const openLink = document.createElement("button");
    openLink.append("Открыть");
    openLink.classList.add("edit-button");
    openLink.addEventListener("click", () => location.href = `/request-card?id=${request.requestID}`);
    linksTd.append(openLink);

    tr.append(linksTd);
    return tr;
}

getRequests();
