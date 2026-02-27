// получение заявки
async function getRequest(id) {
    const response = await fetch(`/api/requests/${id}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });
    if (response.ok === true) {
        const request = await response.json();
        document.getElementById("requestID").value          = request.requestID;
        document.getElementById("startDate").value          = request.startDate;
        document.getElementById("carType").value            = request.carType;
        document.getElementById("carModel").value           = request.carModel;
        document.getElementById("problemDescryption").value = request.problemDescryption;
        document.getElementById("requestStatus").value      = request.requestStatus;
        document.getElementById("completionDate").value     = request.completionDate ?? "";
        document.getElementById("repairParts").value        = request.repairParts ?? "";
        document.getElementById("masterID").value           = request.masterID ?? "";
        document.getElementById("clientID").value           = request.clientID;
    } else {
        const error = await response.json();
        console.log(error.message);
    }
}

// обновление заявки (статус, запчасти, дата завершения)
async function editRequest(requestID, requestStatus, repairParts, completionDate) {
    const response = await fetch("/api/requests", {
        method: "PUT",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
            requestID: parseInt(requestID),
            requestStatus: requestStatus,
            repairParts: repairParts,
            completionDate: completionDate || null
        })
    });
    if (response.ok === true) {
        const request = await response.json();
        document.getElementById("requestStatus").value  = request.requestStatus;
        document.getElementById("repairParts").value    = request.repairParts ?? "";
        document.getElementById("completionDate").value = request.completionDate ?? "";
    } else {
        const error = await response.json();
        console.log(error.message);
    }
}

// получение комментариев к заявке
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
        console.log(error.message);
    }
}

// добавление комментария
async function createComment(message, masterId, requestId) {
    const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
            message: message,
            masterID: parseInt(masterId),
            requestID: parseInt(requestId)
        })
    });
    if (response.ok === true) {
        const comment = await response.json();
        document.querySelector("#t1 tbody").append(row(comment));
    } else {
        const error = await response.json();
        console.log(error.message);
    }
}

// удаление комментария
async function deleteComment(id) {
    const response = await fetch(`/api/comments/${id}`, {
        method: "DELETE",
        headers: { "Accept": "application/json", "Content-Type": "application/json" }
    });
    if (response.ok === true) {
        document.querySelector(`#t1 tr[data-rowid='${id}']`).remove();
    } else {
        const error = await response.json();
        console.log(error.message);
    }
}

// формирование строки комментария
function row(comment) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-rowid", comment.commentID);

    const idTd = document.createElement("td");
    idTd.append(comment.commentID);
    tr.append(idTd);

    const msgTd = document.createElement("td");
    msgTd.append(comment.message);
    tr.append(msgTd);

    const masterTd = document.createElement("td");
    masterTd.append(comment.masterID);
    tr.append(masterTd);

    const linksTd = document.createElement("td");
    linksTd.classList.add("button-group");

    const removeLink = document.createElement("button");
    removeLink.append("Удалить");
    removeLink.classList.add("remove-button");
    removeLink.addEventListener("click", async () => await deleteComment(comment.commentID));
    linksTd.append(removeLink);

    tr.append(linksTd);
    return tr;
}

// сброс поля комментария
function reset() {
    document.getElementById("commentMessage").value = "";
}

document.getElementById("resetBtn").addEventListener("click", () => reset());

// сохранить изменения заявки
document.getElementById("saveBtn").addEventListener("click", async () => {
    const id             = document.getElementById("requestID").value;
    const status         = document.getElementById("requestStatus").value;
    const repairParts    = document.getElementById("repairParts").value;
    const completionDate = document.getElementById("completionDate").value;
    await editRequest(id, status, repairParts, completionDate);
});

// добавить комментарий
document.getElementById("addCommentBtn").addEventListener("click", async () => {
    const message   = document.getElementById("commentMessage").value;
    const masterId  = document.getElementById("currentUserId").value;
    const requestId = document.getElementById("requestID").value;
    await createComment(message, masterId, requestId);
    reset();
});

// инициализация
const params = new URLSearchParams(window.location.search);
const requestId = params.get("id");
getRequest(requestId);
getComments(requestId);
