async function loadMessages() {
    const response = await fetch("/api/messages", {
        headers: { "Accept": "application/json" }
    });
    if (response.ok) {
        const messages = await response.json();
        const tbody = document.querySelector("#t1 tbody");
        tbody.innerHTML = "";
        if (messages.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--muted)">Обращений нет</td></tr>`;
            return;
        }
        messages.forEach(m => {
            const tr = document.createElement("tr");
            [m.messageID, m.subject, m.messageText, m.clientID].forEach(text => {
                const td = document.createElement("td");
                td.textContent = text ?? "—";
                tr.append(td);
            });
            tbody.append(tr);
        });
    } else {
        showError("Ошибка загрузки обращений");
    }
}

loadMessages();
initSidebar();