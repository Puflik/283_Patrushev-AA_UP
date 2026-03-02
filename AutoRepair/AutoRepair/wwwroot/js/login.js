function showLoginForm() {
    document.getElementById("formLogin").classList.remove("hidden");
    document.getElementById("formRegister").classList.add("hidden");
    document.getElementById("tabLogin").classList.add("active");
    document.getElementById("tabRegister").classList.remove("active");
    document.getElementById("errorMsg").textContent = "";
    document.getElementById("errorMsgReg").textContent = "";
    document.getElementById("userLogin").value = "";
    document.getElementById("userPassword").value = "";
}
function showRegisterForm() {
    document.getElementById("formLogin").classList.add("hidden");
    document.getElementById("formRegister").classList.remove("hidden");
    document.getElementById("tabLogin").classList.remove("active");
    document.getElementById("tabRegister").classList.add("active");
    document.getElementById("regFio").value = "";
    document.getElementById("regPhone").value = "";
    document.getElementById("regLogin").value = "";
    document.getElementById("regPassword").value = "";
    document.getElementById("errorMsg").textContent = "";
    document.getElementById("errorMsgReg").textContent = "";
}

async function doLogin() {
    const login = document.getElementById("userLogin").value;
    const password = document.getElementById("userPassword").value;

    const response = await fetch("/api/login", {
        method: "POST",
        credentials: 'include', // ensure cookie is saved
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ login: login, password: password })
    });
    if (response.ok === true) {
        const user = await response.json();
        console.log('login result', user);
        if (user.type === "client") {
            location.href = "/my-requests";
        } else {
            location.href = "/requests";
        }
    } else {
        const error = await response.json();
        showError(error.message);
    }
}

async function doRegister() {
    const fio = document.getElementById("regFio").value;
    const phone = document.getElementById("regPhone").value;
    const login = document.getElementById("regLogin").value;
    const password = document.getElementById("regPassword").value;

    const response = await fetch("/api/users", {
        method: "POST",
        credentials: 'include',
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
            fio: fio,
            phone: phone,
            login: login,
            password: password,
            type: "client"
        })
    });
    if (response.ok === true) {
        showInfo('Регистрация прошла успешно. Входим...');
        showLoginForm();
        document.getElementById("userLogin").value = login;
        document.getElementById("userPassword").value = password;
        await doLogin();
    } else {
        const error = await response.json();
        showError(error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("tabLogin").addEventListener("click", showLoginForm);
    document.getElementById("tabRegister").addEventListener("click", showRegisterForm);
    document.getElementById("linkToRegister").addEventListener("click", e => { e.preventDefault(); showRegisterForm(); });
    document.getElementById("linkToLogin").addEventListener("click", e => { e.preventDefault(); showLoginForm(); });
    document.getElementById("saveBtn").addEventListener("click", doLogin);
    document.getElementById("regBtn").addEventListener("click", doRegister);
    showLoginForm();
});
