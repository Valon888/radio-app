// Paneli "Filtra" në telefon: hap/mbyll #filters (në desktop butoni është i fshehur).
const btn = document.getElementById('filtersBtn');
const panel = document.getElementById('filters');

function setOpen(open) {
  panel.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', String(open));
}

if (btn && panel) {
  btn.addEventListener('click', () => setOpen(!panel.classList.contains('open')));
  document.addEventListener('click', (e) => {
    if (!panel.classList.contains('open')) return;
    if (panel.contains(e.target) || btn.contains(e.target)) return;
    setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
}
