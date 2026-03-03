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
    var login    = document.getElementById("userLogin").value.trim();
    var password = document.getElementById("userPassword").value;

    var response = await fetch("/api/login", {
        method: "POST",
        credentials: 'include',
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ login: login, password: password })
    });

    if (response.ok) {
        var user = await response.json();
        console.log('login result', user);

        // Редирект по роли (type хранится в БД как английский)
        var redirectMap = {
            'client':   '/my-requests',
            'mechanic': '/requests',
            'operator': '/requests',
            'manager':  '/requests',
            'admin':    '/requests'
        };
        location.href = redirectMap[user.type] || '/requests';
    } else {
        var msg = 'Неверный логин или пароль';
        try { var err = await response.json(); msg = err.message || msg; } catch (e) {}
        document.getElementById("errorMsg").textContent = msg;
    }
}

async function doRegister() {
    var fio      = document.getElementById("regFio").value.trim();
    var phone    = document.getElementById("regPhone").value.trim();
    var login    = document.getElementById("regLogin").value.trim();
    var password = document.getElementById("regPassword").value;

    var response = await fetch("/api/users", {
        method: "POST",
        credentials: 'include',
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ fio: fio, phone: phone, login: login, password: password, type: "client" })
    });

    if (response.ok) {
        showLoginForm();
        document.getElementById("userLogin").value    = login;
        document.getElementById("userPassword").value = password;
        await doLogin();
    } else {
        var msg = 'Ошибка регистрации';
        try { var err = await response.json(); msg = err.message || msg; } catch (e) {}
        document.getElementById("errorMsgReg").textContent = msg;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("tabLogin").addEventListener("click", showLoginForm);
    document.getElementById("tabRegister").addEventListener("click", showRegisterForm);
    document.getElementById("linkToRegister").addEventListener("click", function(e) { e.preventDefault(); showRegisterForm(); });
    document.getElementById("linkToLogin").addEventListener("click",    function(e) { e.preventDefault(); showLoginForm();    });
    document.getElementById("saveBtn").addEventListener("click", doLogin);
    document.getElementById("regBtn").addEventListener("click",  doRegister);

    document.getElementById("userLogin").addEventListener("keydown", function(e) { if (e.key === "Enter") doLogin(); });
    document.getElementById("userPassword").addEventListener("keydown", function(e) { if (e.key === "Enter") doLogin(); });

    showLoginForm();
});
