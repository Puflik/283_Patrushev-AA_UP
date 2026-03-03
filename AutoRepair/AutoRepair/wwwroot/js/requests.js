<<<<<<< HEAD
var allRequests = [];

async function getRequests() {
    var response = await fetch("/api/requests", {
=======
let allRequests = [];

async function getRequests() {
    const response = await fetch("/api/requests", {
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
        headers: { "Accept": "application/json" }
    });
    if (response.ok) {
        allRequests = await response.json();
        renderRequests(allRequests);
    } else {
<<<<<<< HEAD
        showError('Ошибка загрузки заявок');
=======
        const error = await response.json();
        showError(error.message || 'Ошибка загрузки');
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
    }
}

function renderRequests(requests) {
<<<<<<< HEAD
    var tbody = document.querySelector("#t1 tbody");
    tbody.innerHTML = "";
    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--muted)">Заявки не найдены</td></tr>';
        return;
    }
    requests.forEach(function(r) { tbody.append(row(r)); });
=======
    const tbody = document.querySelector("#t1 tbody");
    tbody.innerHTML = "";
    if (requests.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="8" style="text-align:center;color:var(--muted)">Заявки не найдены</td>`;
        tbody.append(tr);
        return;
    }
    requests.forEach(r => tbody.append(row(r)));
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
}

function row(request) {
    var tr = document.createElement("tr");
    tr.setAttribute("data-rowid",  request.requestID);
    tr.setAttribute("data-status", request.requestStatus);

<<<<<<< HEAD
    [
=======
    const cells = [
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
        request.requestID,
        request.startDate,
        request.carType,
        request.carModel,
        request.problemDescryption,
        statusLabel(request.requestStatus),
<<<<<<< HEAD
        request.masterID !== null && request.masterID !== undefined ? request.masterID : "—"
    ].forEach(function(text) {
        var td = document.createElement("td");
        td.textContent = (text !== null && text !== undefined) ? text : "—";
        tr.append(td);
    });

    var linksTd = document.createElement("td");
    var openBtn = document.createElement("button");
    openBtn.textContent = "Открыть";
    openBtn.className   = "edit-button";
    openBtn.addEventListener("click", function() { location.href = "/request-card?id=" + request.requestID; });
=======
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
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
    linksTd.append(openBtn);
    tr.append(linksTd);
    return tr;
}

<<<<<<< HEAD
document.querySelectorAll(".filter-btn[data-status]").forEach(function(btn) {
    btn.addEventListener("click", function() {
        document.querySelectorAll(".filter-btn[data-status]").forEach(function(b) { b.classList.remove("active"); });
=======
document.querySelectorAll(".filter-btn[data-status]").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn[data-status]").forEach(b => b.classList.remove("active"));
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
        btn.classList.add("active");
        applyFilters();
    });
});

<<<<<<< HEAD
var searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener("input", function() { applyFilters(); });
}

function applyFilters() {
    var activeBtn = document.querySelector(".filter-btn.active[data-status]");
    var status    = activeBtn ? activeBtn.dataset.status : "all";
    var query     = (searchInput ? searchInput.value : "").toLowerCase();

    var filtered = allRequests.filter(function(r) {
        var allowed      = statusMap[status] || [status];
        var matchStatus  = status === "all" || allowed.indexOf(r.requestStatus) !== -1;
        var matchQuery   = !query
            || String(r.requestID).indexOf(query) !== -1
            || (r.carModel           || "").toLowerCase().indexOf(query) !== -1
            || (r.problemDescryption || "").toLowerCase().indexOf(query) !== -1;
=======
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
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
        return matchStatus && matchQuery;
    });
    renderRequests(filtered);
}

getRequests();
<<<<<<< HEAD
initSidebar();
=======
initSidebar();
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
