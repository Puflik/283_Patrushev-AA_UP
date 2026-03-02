document.getElementById("faqSearch").addEventListener("input", function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll(".faq-item").forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(q) ? "" : "none";
    });
});
initClientNav();