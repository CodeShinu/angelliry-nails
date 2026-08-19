const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-button]');
const menu = document.querySelector('[data-menu]');
const lightbox = document.querySelector('[data-lightbox]');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lastScroll = scrollY;
let lastFocus = null;

function closeMenu(returnFocus = false) {
  menu.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
  if (returnFocus) menuButton.focus();
}
function updateHeader() {
  const current = scrollY;
  header.classList.toggle('scrolled', current > 24);
  header.classList.toggle('header-hidden', current > 150 && current > lastScroll && !menu.classList.contains('open'));
  lastScroll = Math.max(0, current);
}
updateHeader();
addEventListener('scroll', updateHeader, { passive: true });

menuButton.addEventListener('click', () => {
  const open = !menu.classList.contains('open');
  if (open) {
    menu.classList.add('open');
    menuButton.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    menu.querySelector('a').focus();
  } else closeMenu(true);
});
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('click', event => {
  if (menu.classList.contains('open') && !header.contains(event.target)) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.classList.contains('open')) closeMenu(true);
});

const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('[data-nav]')];
const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  navLinks.forEach(link => {
    const active = link.dataset.nav === entry.target.id;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  });
}), { rootMargin: '-35% 0px -55%', threshold: 0 });
sections.forEach(section => sectionObserver.observe(section));

const revealItems = document.querySelectorAll('.reveal');
if (reducedMotion) revealItems.forEach(item => item.classList.add('visible'));
else {
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
  }), { threshold: .12 });
  revealItems.forEach(item => revealObserver.observe(item));
}

document.querySelector('[data-year]').textContent = new Date().getFullYear();
document.querySelectorAll('.price small').forEach(label => label.textContent = 'valor');

const filterLabels = { all: 'Todos', f1: 'Molde F1', manutencao: 'Manutenção', gel: 'Banho de gel' };
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const galleryItems = [...document.querySelectorAll('[data-category]')];
const galleryStatus = document.querySelector('[data-gallery-status]');
function setFilter(category, focusHeading = false) {
  filterButtons.forEach(button => {
    const active = button.dataset.filter === category;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  galleryItems.forEach(item => { item.hidden = filterButtons.length > 0 && category !== 'all' && item.dataset.category !== category; });
  if (galleryStatus) galleryStatus.textContent = category === 'all' ? 'Trabalho real da Angelliry.' : `Veja o trabalho disponível e acompanhe as próximas inspirações pelo Instagram.`;
  if (focusHeading) setTimeout(() => document.querySelector('#portfolio .section-heading').focus({ preventScroll: true }), 350);
}
filterButtons.forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));

const serviceCategories = ['f1', 'manutencao', 'gel'];
document.querySelectorAll('.service-card').forEach((card, index) => {
  card.querySelector('.card-link').dataset.cta = `service-${serviceCategories[index]}`;
  const inspiration = document.createElement('a');
  inspiration.href = '#portfolio';
  inspiration.className = 'inspiration-link';
  inspiration.textContent = 'Ver inspirações ↓';
  inspiration.addEventListener('click', () => setFilter(serviceCategories[index], true));
  card.append(inspiration);
});

const lightboxMark = lightbox.querySelector('[data-lightbox-mark]');
galleryItems.forEach((item, index) => item.addEventListener('click', () => {
  lastFocus = item;
  lightboxMark.textContent = String(index + 1).padStart(2, '0');
  lightbox.showModal();
  document.body.classList.add('modal-open');
  lightbox.querySelector('[data-close]').focus();
}));
function closeLightbox() {
  lightbox.close(); document.body.classList.remove('modal-open'); lastFocus?.focus();
}
lightbox.querySelector('[data-close]').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
lightbox.addEventListener('close', () => document.body.classList.remove('modal-open'));

window.trackAngelliryCTA = detail => window.dataLayer?.push({ event: 'cta_click', ...detail });
document.querySelectorAll('[data-cta]').forEach(element => element.addEventListener('click', () => window.trackAngelliryCTA({ cta: element.dataset.cta })));

if (!reducedMotion) {
  const heroFlower = document.querySelector('.hero-flower');
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking || scrollY > innerHeight * 1.3) return;
    ticking = true;
    requestAnimationFrame(() => { heroFlower.style.transform = `translateY(${scrollY * .035}px) rotate(25deg)`; ticking = false; });
  }, { passive: true });
}
