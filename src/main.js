const toggle = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('[data-menu]');
const header = document.querySelector('.site-header');

const updateHeader = () => {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 24);
};

if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    menu.toggleAttribute('data-open', !isOpen);
    header?.classList.toggle('is-menu-open', !isOpen);
  });
}

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });
