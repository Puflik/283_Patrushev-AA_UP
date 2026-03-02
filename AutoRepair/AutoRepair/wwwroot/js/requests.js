let allRequests = [];

async function getRequests() {
    const response = await fetch("/api/requests", {
        headers: { "Accept": "application/json" }
    });
    if (response.ok) {
        allRequests = await response.json();
        renderRequests(allRequests);
    } else {
        const error = await response.json();
        showError(error.message || 'Ошибка загрузки');
    }
}

function renderRequests(requests) {
    const tbody = document.querySelector("#t1 tbody");
    tbody.innerHTML = "";
    if (requests.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="8" style="text-align:center;color:var(--muted)">Заявки не найдены</td>`;
        tbody.append(tr);
        return;
    }
    requests.forEach(r => tbody.append(row(r)));
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
        statusLabel(request.requestStatus),
        request.masterID ?? "—"
    ];
    cells.forEach(text => {
        const td = document.createElement("td");
        td.textContent = text;
        tr.append(td);
    });

    const linksTd = document.createElement("td");
    const openBtn = document.createElement("button");
    openBtn.textContent = "Открыть";
    openBtn.className = "edit-button";
    openBtn.addEventListener("click", () => location.href = `/request-card?id=${request.requestID}`);
    linksTd.append(openBtn);
    tr.append(linksTd);
    return tr;
}

document.querySelectorAll(".filter-btn[data-status]").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn[data-status]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        applyFilters();
    });
});

const searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener("input", () => applyFilters());
}

function applyFilters() {
    const activeBtn = document.querySelector(".filter-btn.active[data-status]");
    const status = activeBtn ? activeBtn.dataset.status : "all";
    const query = (searchInput ? searchInput.value : "").toLowerCase();

    const statusMap = {
        "new": ["new", "Новая заявка"],
        "in_progress": ["in_progress", "В процессе ремонта"],
        "waiting": ["waiting", "Ожидание автозапчастей"],
        "done": ["done", "Завершена", "Готова к выдаче"],
        "cancelled": ["cancelled", "Отменена"]
    };

    const filtered = allRequests.filter(r => {
        const matchStatus = status === "all" || (statusMap[status] || [status]).includes(r.requestStatus);
        const matchQuery = !query ||
            String(r.requestID).includes(query) ||
            (r.carModel || "").toLowerCase().includes(query) ||
            (r.problemDescryption || "").toLowerCase().includes(query);
        return matchStatus && matchQuery;
    });
    renderRequests(filtered);
}

getRequests();
initSidebar();