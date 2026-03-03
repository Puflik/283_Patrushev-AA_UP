<<<<<<< HEAD
var statusToEng = {
    'Новая заявка': 'new', 'В процессе ремонта': 'in_progress',
    'Ожидание автозапчастей': 'waiting', 'Готова к выдаче': 'done', 'Отменена': 'cancelled'
};
var statusToRu = {
    'new': 'Новая заявка', 'in_progress': 'В процессе ремонта',
    'waiting': 'Ожидание автозапчастей', 'done': 'Готова к выдаче', 'cancelled': 'Отменена'
};

=======
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
async function getRequest(id) {
    const response = await fetch(`/api/requests/${id}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
    });

    const user = await getCurrentUser();
    if (user && (user.type === 'manager' || user.type === 'admin')) {
        const assignLink = document.getElementById('assignLink');
        if (assignLink) {
            assignLink.classList.remove('hidden');
            assignLink.href = `/assign?id=${request.requestID}`;
        }
    }

    if (response.ok === true) {
        const request = await response.json();
        document.getElementById("requestID").value          = request.requestID;
        document.getElementById("startDate").value          = request.startDate;
        document.getElementById("carType").value            = request.carType;
        document.getElementById("carModel").value           = request.carModel;
        document.getElementById("problemDescryption").value = request.problemDescryption;
        document.getElementById("completionDate").value     = request.completionDate ?? "";
        document.getElementById("repairParts").value        = request.repairParts ?? "";
        document.getElementById("masterID").value           = request.masterID ?? "";
        document.getElementById("clientID").value           = request.clientID;
        const statusToEng = {
            'Новая заявка':           'new',
            'В процессе ремонта':     'in_progress',
            'Ожидание автозапчастей': 'waiting',
            'Готова к выдаче':        'done',
            'Отменена':               'cancelled'
        };
        const sel = document.getElementById("requestStatus");
        if (sel) sel.value = statusToEng[request.requestStatus] || request.requestStatus;
    } 
    else {
        const error = await response.json();
        showError(error.message);
    }
}

<<<<<<< HEAD
async function editRequest(requestID, statusEng, repairParts, completionDate) {
    const statusToRu = {
        'new':         'Новая заявка',
        'in_progress': 'В процессе ремонта',
        'waiting':     'Ожидание автозапчастей',
        'done':        'Готова к выдаче',
        'cancelled':   'Отменена'
    };
    const requestStatus = statusToRu[statusEng] || statusEng;
    const currentRes = await fetch(`/api/requests/${requestID}`);
    const current = await currentRes.json();

=======
async function editRequest(requestID, requestStatus, repairParts, completionDate) {
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
    const response = await fetch("/api/requests", {
        method: "PUT",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
            requestID: current.requestID,
            startDate: current.startDate,
            carType: current.carType,
            carModel: current.carModel,
            problemDescryption: current.problemDescryption,
            requestStatus: requestStatus,
            completionDate: completionDate || current.completionDate || null,
            repairParts: repairParts || current.repairParts || null,
            masterID: current.masterID,
            clientID: current.clientID
        })
    });
    if (response.ok) {
        showInfo("Изменения сохранены");
    } else {
        const error = await response.json();
        showError(error.detail || error.message || "Ошибка сохранения");
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
        showError(error.message);
    }
}

async function deleteComment(id) {
    const response = await fetch(`/api/comments/${id}`, {
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
    removeLink.addEventListener("click", async () => {
        const ok = await confirmAction('Вы уверены? Это действие необратимо');
        if (ok) {
            await deleteComment(comment.commentID);
            showInfo('Комментарий удалён');
        }
    });
    linksTd.append(removeLink);

    tr.append(linksTd);
    return tr;
}

function reset() {
    document.getElementById("commentMessage").value = "";
}

document.getElementById("resetBtn").addEventListener("click", () => reset());

document.getElementById("saveBtn").addEventListener("click", async () => {
    const id             = document.getElementById("requestID").value;
    const status         = document.getElementById("requestStatus").value;
    const repairParts    = document.getElementById("repairParts").value;
    const completionDate = document.getElementById("completionDate").value;
    await editRequest(id, status, repairParts, completionDate);
});

document.getElementById("addCommentBtn").addEventListener("click", async () => {
    const message   = document.getElementById("commentMessage").value;
    const masterId  = document.getElementById("currentUserId").value;
    const requestId = document.getElementById("requestID").value;
    await createComment(message, masterId, requestId);
    reset();
});

const params = new URLSearchParams(window.location.search);
const requestId = params.get("id");
getRequest(requestId);
getComments(requestId);
initSidebar();