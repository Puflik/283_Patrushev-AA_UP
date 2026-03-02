async function getRequest(id) {
    const response = await fetch(`/api/requests/${id}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if (response.ok === true) {
        const request = await response.json();

        const statusLabels = {
            "new": "Новая",
            "in_progress": "В работе",
            "waiting": "Ожидание",
            "done": "Завершено",
            "cancelled": "Отменено"
        };

        document.getElementById("requestID").value      = request.requestID;
        document.getElementById("startDate").value      = request.startDate;
        document.getElementById("carType").value        = request.carType;
        document.getElementById("carModel").value       = request.carModel;
        document.getElementById("problem").value        = request.problemDescryption;
        document.getElementById("status").value         = statusLabels[request.requestStatus] || request.requestStatus;
        document.getElementById("completionDate").value = request.completionDate ?? "—";
        document.getElementById("repairParts").value    = request.repairParts ?? "—";

        if (request.requestStatus === "new" || request.requestStatus === "Новая заявка") {
            document.getElementById("cancelBtn").style.display = "inline-block";
        }
    } else {
        const error = await response.json();
        showError(error.message);
    }
}

async function getComments(requestId) {
    const response = await fetch(`/api/comments/request/${requestId}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if (response.ok === true) {
        const comments = await response.json();
        const rows = document.querySelector("#t1 tbody");
        rows.innerHTML = "";
        comments.forEach(comment => rows.append(row(comment)));
    } else {
        const error = await response.json();
        showError(error.message);
    }
}

document.getElementById("cancelBtn").addEventListener("click", async () => {
    const ok = await confirmAction('Вы уверены? Это действие необратимо');
    if (!ok) return;
    const id = document.getElementById("requestID").value;

    const currentRes = await fetch(`/api/requests/${id}`);
    const current = await currentRes.json();

    const response = await fetch("/api/requests", {
        method: "PUT",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
            requestID: current.requestID,
            startDate: current.startDate,
            carType: current.carType,
            carModel: current.carModel,
            problemDescryption: current.problemDescryption,
            requestStatus: "Отменена",
            completionDate: current.completionDate,
            repairParts: current.repairParts,
            masterID: current.masterID,
            clientID: current.clientID
        })
    });
    if (response.ok) {
        location.href = "/my-requests";
    } else {
        const error = await response.json();
        showError(error.detail || error.message || 'Ошибка отмены');
    }
});

function row(comment) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-rowid", comment.commentID);

    const idTd = document.createElement("td");
    idTd.append(comment.commentID);
    tr.append(idTd);

    const msgTd = document.createElement("td");
    msgTd.append(comment.message);
    tr.append(msgTd);

    return tr;
}

const params = new URLSearchParams(window.location.search);
const requestId = params.get("id");
getRequest(requestId);
getComments(requestId);
initSidebar();