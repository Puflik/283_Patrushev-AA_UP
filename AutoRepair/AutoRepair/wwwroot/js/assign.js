async function getRequest(id) {
    const response = await fetch(`/api/requests/${id}`, {
        headers: { "Accept": "application/json" }
    });
    if (response.ok) {
        const request = await response.json();
        document.getElementById("requestID").value = request.requestID;
        const infoEl = document.getElementById("requestInfo");
        const problemEl = document.getElementById("requestProblem");
        const subEl = document.getElementById("topbarSub");
        if (infoEl) infoEl.textContent = `#${request.requestID} · ${request.carType} · ${request.carModel}`;
        if (problemEl) problemEl.textContent = request.problemDescryption;
        if (subEl) subEl.textContent = `Заявка #${request.requestID}`;
        const backLink = document.getElementById("backLink");
        if (backLink) backLink.href = `/request-card?id=${request.requestID}`;
    } else {
        showError('Заявка не найдена');
    }
}

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

async function assignMechanic(requestId, masterId) {
    const currentRes = await fetch(`/api/requests/${requestId}`);
    const current = await currentRes.json();
    const completionDate = document.getElementById("completionDateInput").value || null;

    const response = await fetch("/api/requests", {
        method: "PUT",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
            requestID:          current.requestID,
            startDate:          current.startDate,
            carType:            current.carType,
            carModel:           current.carModel,
            problemDescryption: current.problemDescryption,
            requestStatus:      "В процессе ремонта",
            completionDate:     completionDate || current.completionDate || null,
            repairParts:        current.repairParts,
            masterID:           parseInt(masterId),
            clientID:           current.clientID
        })
    });
    if (response.ok === true) {
        location.href = "/requests";
    } else {
        const error = await response.json();
        showError(error.message);
    }
}

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

const params = new URLSearchParams(window.location.search);
const requestId = params.get("id");
getRequest(requestId);
getMechanics();
initSidebar();