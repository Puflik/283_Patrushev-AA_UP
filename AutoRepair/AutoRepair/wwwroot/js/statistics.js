
document.querySelectorAll(".filter-btn[data-period]").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn[data-period]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        loadStatistics(btn.dataset.period);
    });
});

initSidebar();
loadStatistics('month');