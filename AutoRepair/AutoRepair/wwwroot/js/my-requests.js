let allRequests = [];

async function getRequests() {
    const user = await getCurrentUser();
    if (!user) return;

    const response = await fetch(`/api/requests/client/${user.userID}`, {
        headers: { "Accept": "application/json" }
    });
    if (response.ok) {
        allRequests = await response.json();
        renderRequests(allRequests);
    } else {
        const error = await response.json();
        showError(error.message || 'Ошибка загрузки заявок');
    }
}

function renderRequests(requests) {
    const tbody = document.querySelector("#t1 tbody");
    tbody.innerHTML = "";
    if (requests.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="7" style="text-align:center;color:var(--muted)">Заявки не найдены</td>`;
        tbody.append(tr);
        return;
    }
    requests.forEach(r => tbody.append(row(r)));
}

async function cancelRequest(id) {
    // Сначала получаем текущую заявку чтобы не затереть поля
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
        const updated = await response.json();
        allRequests = allRequests.map(r => r.requestID === updated.requestID ? updated : r);
        renderRequests(allRequests);
        showInfo('Заявка отменена');
    } else {
        const error = await response.json();
        showError(error.detail || error.message || 'Ошибка отмены');
    }
}

function row(request) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-rowid", request.requestID);
    tr.setAttribute("data-status", request.requestStatus);

    const cells = [
        request.requestID,
        request.startDate,
        request.carType,
        request.carModel,
        request.problemDescryption,
        statusLabel(request.requestStatus)
    ];
    cells.forEach(text => {
        const td = document.createElement("td");
        td.textContent = text;
        tr.append(td);
    });

    const linksTd = document.createElement("td");
    linksTd.classList.add("button-group");

    const detailBtn = document.createElement("button");
    detailBtn.textContent = "Подробнее";
    detailBtn.className = "edit-button";
    detailBtn.addEventListener("click", () => location.href = `/request-detail?id=${request.requestID}`);
    linksTd.append(detailBtn);

    if (request.requestStatus === "new" || request.requestStatus === "Новая заявка") {
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Отменить";
        cancelBtn.className = "remove-button";
        cancelBtn.addEventListener("click", async () => {
            const ok = await confirmAction('Вы уверены? Это действие необратимо');
            if (ok) await cancelRequest(request.requestID);
        });
        linksTd.append(cancelBtn);
    }

    tr.append(linksTd);
    return tr;
}

// Фильтры
document.querySelectorAll(".filter-btn[data-status]").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn[data-status]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const status = btn.dataset.status;

        // Маппинг английских статусов на русские (как в БД)
        const statusMap = {
            "new": ["new", "Новая заявка"],
            "in_progress": ["in_progress", "В процессе ремонта"],
            "waiting": ["waiting", "Ожидание автозапчастей"],
            "done": ["done", "Завершена", "Готова к выдаче"],
            "cancelled": ["cancelled", "Отменена"]
        };

        const filtered = status === "all"
            ? allRequests
            : allRequests.filter(r => (statusMap[status] || [status]).includes(r.requestStatus));
        renderRequests(filtered);
    });
});

getRequests();
initClientNav();