// получение данных для входа
document.getElementById("saveBtn").addEventListener("click", async () => {
    const login = document.getElementById("userLogin").value;
    const password = document.getElementById("userPassword").value;

    const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ login: login, password: password })
    });
    if (response.ok === true) {
        const user = await response.json();
        // перенаправление в зависимости от роли
        if (user.type === "client") {
            location.href = "/my-requests";
        } else {
            location.href = "/requests";
        }
    } else {
        const error = await response.json();
        console.log(error.message);
    }
});
