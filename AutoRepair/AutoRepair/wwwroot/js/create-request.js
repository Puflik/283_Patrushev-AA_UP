// создание новой заявки
async function createRequest(clientId, carType, carModel, problemDescryption) {
    const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
            startDate: new Date().toISOString().split("T")[0],
            carType: carType,
            carModel: carModel,
            problemDescryption: problemDescryption,
            requestStatus: "new",
            clientID: clientId
        })
    });
    if (response.ok === true) {
        location.href = "/my-requests";
    } else {
        const error = await response.json();
        showError(error.message);
    }
}

// сброс полей формы
function reset() {
    document.getElementById("carType").value =
        document.getElementById("carModel").value =
        document.getElementById("problemDescryption").value = "";
}

document.getElementById("resetBtn").addEventListener("click", () => reset());

document.getElementById("saveBtn").addEventListener("click", async () => {
    const clientId = document.getElementById("currentUserId").value;
    const carType = document.getElementById("carType").value;
    const carModel = document.getElementById("carModel").value;
    const problemDescryption = document.getElementById("problemDescryption").value;
    await createRequest(clientId, carType, carModel, problemDescryption);
    reset();
});
