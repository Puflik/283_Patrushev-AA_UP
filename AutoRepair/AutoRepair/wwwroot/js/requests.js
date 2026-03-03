var allRequests = [];

async function getRequests() {
    var response = await fetch("/api/requests", {
        headers: { "Accept": "application/json" }
    });
    if (response.ok) {
        allRequests = await response.json();
        renderRequests(allRequests);
    } else {
        showError('Ошибка загрузки заявок');
    }
}

function renderRequests(requests) {
    var tbody = document.querySelector("#t1 tbody");
    tbody.innerHTML = "";
    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--muted)">Заявки не найдены</td></tr>';
        return;
    }
    requests.forEach(function(r) { tbody.append(row(r)); });
}

function row(request) {
    var tr = document.createElement("tr");
    tr.setAttribute("data-rowid",  request.requestID);
    tr.setAttribute("data-status", request.requestStatus);

    [
        request.requestID,
        request.startDate,
        request.carType,
        request.carModel,
        request.problemDescryption,
        statusLabel(request.requestStatus),
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
    linksTd.append(openBtn);
    tr.append(linksTd);
    return tr;
}

document.querySelectorAll(".filter-btn[data-status]").forEach(function(btn) {
    btn.addEventListener("click", function() {
        document.querySelectorAll(".filter-btn[data-status]").forEach(function(b) { b.classList.remove("active"); });
        btn.classList.add("active");
        applyFilters();
    });
});

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
        return matchStatus && matchQuery;
    });
    renderRequests(filtered);
}

getRequests();
initSidebar();
