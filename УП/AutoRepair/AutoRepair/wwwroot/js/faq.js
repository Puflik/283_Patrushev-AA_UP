// faq.js
document.addEventListener('DOMContentLoaded', () => {
  initClientNav();
  document.getElementById('faqSearch').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll('.faq-item').forEach(item => {
      item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
});
