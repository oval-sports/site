// Mobile nav toggle
const toggle = document.getElementById('navToggle');
const menu = document.getElementById('navMenu');
if (toggle && menu) {
  toggle.addEventListener('click', () => menu.classList.toggle('open'));
}
