<<<<<<< HEAD
var allRequests = [];
var allUsers    = [];

async function loadData() {
    try {
        var results = await Promise.all([
            fetch("/api/requests"),
            fetch("/api/users")
        ]);
        allRequests = await results[0].json();
        allUsers    = await results[1].json();
        loadStatistics('month');
    } catch (e) {
        showError("Ошибка загрузки данных");
    }
}

function filterByPeriod(requests, period) {
    var now = new Date();
    return requests.filter(function(r) {
        var d = new Date(r.startDate);
        if (period === 'week') {
            var ago = new Date(now); ago.setDate(now.getDate() - 7);
            return d >= ago;
        }
        if (period === 'month')   return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (period === 'quarter') { var ago2 = new Date(now); ago2.setMonth(now.getMonth() - 3); return d >= ago2; }
        if (period === 'year')    return d.getFullYear() === now.getFullYear();
        return true;
    });
}

var DONE_STATUSES    = ['Готова к выдаче'];
var WAITING_STATUSES = ['Новая заявка'];

function loadStatistics(period) {
    var requests = filterByPeriod(allRequests, period);

    var done    = requests.filter(function(r) { return DONE_STATUSES.indexOf(r.requestStatus) !== -1; });
    var waiting = requests.filter(function(r) { return WAITING_STATUSES.indexOf(r.requestStatus) !== -1 && !r.masterID; });

    var avgTime = "—";
    var withDates = done.filter(function(r) { return r.completionDate && r.startDate; });
    if (withDates.length > 0) {
        var totalDays = withDates.reduce(function(sum, r) {
            return sum + Math.round((new Date(r.completionDate) - new Date(r.startDate)) / 86400000);
        }, 0);
        avgTime = (totalDays / withDates.length).toFixed(1) + " дн";
    }

    document.getElementById("statDone").textContent    = done.length;
    document.getElementById("statAvgTime").textContent = avgTime;
    document.getElementById("statTotal").textContent   = requests.length;
    document.getElementById("statWaiting").textContent = waiting.length;

    renderBarChart(requests);
    renderIssues(requests);
    renderMechanics(done);
}

function renderBarChart(requests) {
    var barChart  = document.getElementById("barChart");
    var barLabels = document.getElementById("barLabels");
    if (!barChart) return;

    var counts = {};
    requests.forEach(function(r) {
        var d   = new Date(r.startDate);
        var key = d.getDate() + "." + String(d.getMonth()+1).padStart(2,'0');
        counts[key] = (counts[key] || 0) + 1;
    });

    var entries = Object.entries(counts).slice(-14);
    var maxVal  = Math.max.apply(null, entries.map(function(e) { return e[1]; }).concat([1]));

    barChart.innerHTML  = "";
    barLabels.innerHTML = "";
    entries.forEach(function(entry) {
        var label = entry[0]; var count = entry[1];
        var bar = document.createElement("div");
        bar.style.cssText = "flex:1;background:var(--accent);border-radius:4px 4px 0 0;height:" + (count/maxVal*100) + "%;min-height:4px;position:relative;";
        var tip = document.createElement("span");
        tip.textContent   = count;
        tip.style.cssText = "position:absolute;top:-20px;left:50%;transform:translateX(-50%);font-size:.75rem;";
        bar.append(tip);
        barChart.append(bar);

        var lbl = document.createElement("div");
        lbl.style.cssText = "flex:1;text-align:center;font-size:.7rem;color:var(--muted);";
        lbl.textContent   = label;
        barLabels.append(lbl);
    });
}

function renderIssues(requests) {
    var el = document.getElementById("issuesList");
    if (!el) return;
    var counts = {};
    requests.forEach(function(r) {
        var key = r.problemDescryption ? r.problemDescryption.substring(0, 30) : "Не указано";
        counts[key] = (counts[key] || 0) + 1;
    });
    var sorted = Object.entries(counts).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5);
    var total  = requests.length || 1;
    el.innerHTML = "";
    sorted.forEach(function(entry) {
        var label = entry[0]; var count = entry[1];
        var pct = Math.round(count / total * 100);
        el.innerHTML += '<div style="margin-bottom:12px;">' +
            '<div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:4px;">' +
            '<span>' + label + '</span><span>' + pct + '%</span></div>' +
            '<div style="height:6px;background:#eee;border-radius:3px;">' +
            '<div style="height:100%;width:' + pct + '%;background:var(--accent);border-radius:3px;"></div>' +
            '</div></div>';
    });
}

function renderMechanics(doneRequests) {
    var tbody = document.querySelector("#t1 tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    var mechanics = allUsers.filter(function(u) { return u.type === "mechanic"; });
    if (mechanics.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--muted)">Нет данных</td></tr>';
        return;
    }
    mechanics.forEach(function(m) {
        var myReqs    = doneRequests.filter(function(r) { return r.masterID === m.userID; });
        var avgDays   = "—";
        var withDates = myReqs.filter(function(r) { return r.completionDate && r.startDate; });
        if (withDates.length > 0) {
            var total = withDates.reduce(function(s, r) {
                return s + Math.round((new Date(r.completionDate) - new Date(r.startDate)) / 86400000);
            }, 0);
            avgDays = (total / withDates.length).toFixed(1) + " дн";
        }
        var lastReq  = myReqs.slice().sort(function(a, b) { return new Date(b.startDate) - new Date(a.startDate); })[0];
        var lastDate = lastReq ? new Date(lastReq.startDate).toLocaleDateString('ru-RU') : "—";

        var tr = document.createElement("tr");
        [m.fio, myReqs.length, avgDays, lastDate].forEach(function(text) {
            var td = document.createElement("td"); td.textContent = text; tr.append(td);
        });
        tbody.append(tr);
    });
}

document.querySelectorAll(".filter-btn[data-period]").forEach(function(btn) {
    btn.addEventListener("click", function() {
        document.querySelectorAll(".filter-btn[data-period]").forEach(function(b) { b.classList.remove("active"); });
=======

document.querySelectorAll(".filter-btn[data-period]").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn[data-period]").forEach(b => b.classList.remove("active"));
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
        btn.classList.add("active");
        loadStatistics(btn.dataset.period);
    });
});

initSidebar();
<<<<<<< HEAD
loadData();
=======
loadStatistics('month');
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
