document.getElementById("resetBtn").addEventListener("click", () => {
    document.getElementById("subject").value = "";
    document.getElementById("messageText").value = "";
});

document.getElementById("saveBtn").addEventListener("click", async () => {
    const subject = document.getElementById("subject").value.trim();
    const messageText = document.getElementById("messageText").value.trim();

    if (!subject) { showWarning("Укажите тему обращения"); return; }
    if (!messageText) { showWarning("Введите текст сообщения"); return; }

    const user = await getCurrentUser();
    if (!user) return;

    const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
            subject: subject,
            messageText: messageText,
            clientID: user.userID
        })
    });

    if (response.ok) {
        showInfo("Сообщение отправлено! Менеджер свяжется с вами в течение рабочего дня.");
        document.getElementById("subject").value = "";
        document.getElementById("messageText").value = "";
    } else {
        showError("Не удалось отправить сообщение. Попробуйте позже.");
    }
});

initClientNav();