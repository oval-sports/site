// ===== SHOP FILTER =====
document.addEventListener('DOMContentLoaded', () => {
  const btns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.product-card-full');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      cards.forEach(card => {
        card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
      });
    });
  });
});
