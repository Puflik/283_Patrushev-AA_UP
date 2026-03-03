async function createRequest(carType, carModel, problemDescryption) {
    const user = await getCurrentUser();
    if (!user) return;

    if (!carType) { showWarning('Выберите вид автомобиля', 'Внимание'); return; }
    if (!carModel.trim()) { showWarning('Укажите модель автомобиля', 'Внимание'); return; }
    if (!problemDescryption.trim()) { showWarning('Опишите проблему', 'Внимание'); return; }

    const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
            startDate: new Date().toISOString().split("T")[0],
            carType: carType,
            carModel: carModel,
            problemDescryption: problemDescryption,
<<<<<<< HEAD
            requestStatus: "Новая заявка",
=======
            requestStatus: "new",
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
            clientID: user.userID
        })
    });
    if (response.ok) {
        showInfo('Заявка создана!');
        setTimeout(() => location.href = "/my-requests", 1000);
    } else {
        const error = await response.json();
        showError(error.message || 'Ошибка создания заявки');
    }
}

function reset() {
    document.getElementById("carType").value = "";
    document.getElementById("carModel").value = "";
    document.getElementById("problemDescryption").value = "";
}

document.getElementById("resetBtn").addEventListener("click", reset);

document.getElementById("saveBtn").addEventListener("click", async () => {
    const carType = document.getElementById("carType").value;
    const carModel = document.getElementById("carModel").value;
    const problemDescryption = document.getElementById("problemDescryption").value;
    await createRequest(carType, carModel, problemDescryption);
});

initClientNav();