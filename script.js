const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-button]');
const menu = document.querySelector('[data-menu]');
const lightbox = document.querySelector('[data-lightbox]');
const floatingCta = document.querySelector('[data-floating]');
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = motionQuery.matches;
let lastFocus = null;

/* Menu mobile ------------------------------------------------------------ */
function isMenuOpen() {
  return menu.classList.contains('open');
}

function openMenu() {
  menu.classList.add('open');
  menuButton.setAttribute('aria-expanded', 'true');
  menuButton.querySelector('.sr-only').textContent = 'Fechar menu';
  document.body.classList.add('menu-open');
  header.classList.remove('header-hidden');
  menu.querySelector('a').focus();
}

function closeMenu(returnFocus = false) {
  if (!isMenuOpen()) return;
  menu.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.querySelector('.sr-only').textContent = 'Menu';
  document.body.classList.remove('menu-open');
  if (returnFocus) menuButton.focus();
}

menuButton.addEventListener('click', () => (isMenuOpen() ? closeMenu(true) : openMenu()));
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('click', event => {
  if (isMenuOpen() && !header.contains(event.target)) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && isMenuOpen()) closeMenu(true);
});
// Ao voltar para o desktop com o menu aberto, fecha e libera o scroll.
matchMedia('(min-width: 861px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});

/* Header + parallax: um único listener de scroll, agrupado em rAF -------- */
let lastScroll = scrollY;
let scrollTicking = false;
const decorItems = new Set();
const parallaxObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) decorItems.add(entry.target);
  else decorItems.delete(entry.target);
}));
document.querySelectorAll('.decor[data-depth]').forEach(element => parallaxObserver.observe(element));

function onScrollFrame() {
  const current = scrollY;
  header.classList.toggle('scrolled', current > 24);
  header.classList.toggle('header-hidden', current > 150 && current > lastScroll && !isMenuOpen());
  lastScroll = Math.max(0, current);

  if (!reducedMotion) {
    const viewportCenter = innerHeight / 2;
    decorItems.forEach(element => {
      const rect = element.getBoundingClientRect();
      const offset = (rect.top + rect.height / 2 - viewportCenter) * Number(element.dataset.depth);
      element.style.translate = `0 ${offset.toFixed(1)}px`;
    });
  }
  scrollTicking = false;
}

addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(onScrollFrame);
}, { passive: true });
onScrollFrame();

motionQuery.addEventListener('change', event => {
  reducedMotion = event.matches;
  if (reducedMotion) decorItems.forEach(element => { element.style.translate = ''; });
});

/* Navegação ativa -------------------------------------------------------- */
const navLinks = [...document.querySelectorAll('[data-nav]')];
const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  navLinks.forEach(link => {
    const active = link.dataset.nav === entry.target.id;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}), { rootMargin: '-35% 0px -55%', threshold: 0 });
document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));

/* Revelação no scroll, com stagger sutil entre irmãos -------------------- */
const revealItems = [...document.querySelectorAll('.reveal')];
const revealGroups = new Map();
revealItems.forEach(item => {
  const siblings = revealGroups.get(item.parentElement) || [];
  siblings.push(item);
  revealGroups.set(item.parentElement, siblings);
});
revealGroups.forEach(siblings => siblings.forEach((item, index) => {
  if (index) item.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 0.09}s`);
}));

if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach(item => item.classList.add('visible'));
} else {
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  revealItems.forEach(item => revealObserver.observe(item));
}

/* Botão flutuante: some onde já existe um CTA de agendamento na tela ------ */
const ctaZones = new Set();
const floatingObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => (entry.isIntersecting ? ctaZones.add(entry.target) : ctaZones.delete(entry.target)));
  const hidden = ctaZones.size > 0;
  floatingCta.classList.toggle('is-hidden', hidden);
  if (hidden) floatingCta.setAttribute('tabindex', '-1');
  else floatingCta.removeAttribute('tabindex');
}, { threshold: 0 });
document.querySelectorAll('.hero-actions, .card-link, .services-help, .portfolio-note .text-link, .location-actions, [data-final-cta], .footer').forEach(zone => floatingObserver.observe(zone));

/* Lightbox do portfólio -------------------------------------------------- */
const galleryItems = [...document.querySelectorAll('[data-gallery]')];
const lightboxMark = lightbox.querySelector('[data-lightbox-mark]');
const lightboxImg = lightbox.querySelector('[data-lightbox-img]');
const lightboxSource = lightbox.querySelector('[data-lightbox-source]');
const lightboxTitle = lightbox.querySelector('#lightbox-title');
const lightboxCta = lightbox.querySelector('[data-lightbox-cta]');
const pad = n => String(n).padStart(2, '0');
let currentPhoto = 0;

function showPhoto(index) {
  currentPhoto = (index + galleryItems.length) % galleryItems.length;
  const item = galleryItems[currentPhoto];
  const img = item.querySelector('img');
  const source = item.querySelector('source');
  // Na foto ampliada, usa sempre a maior versão do srcset (a miniatura de 400px ficaria borrada).
  if (source) lightboxSource.srcset = source.srcset.split(',').pop().trim().split(' ')[0];
  lightboxImg.src = img.getAttribute('src');
  lightboxImg.width = Number(img.getAttribute('width'));
  lightboxImg.height = Number(img.getAttribute('height'));
  lightboxImg.alt = img.alt;
  lightboxTitle.textContent = item.dataset.title || '';
  lightboxMark.textContent = `${pad(currentPhoto + 1)} / ${pad(galleryItems.length)}`;
  const message = `Oi, Angelliry! Vi a foto ${pad(currentPhoto + 1)} do portfólio no site (${(item.dataset.title || '').replace(/\.$/, '').replace(/^./, c => c.toLowerCase())}) e gostaria de fazer algo inspirado nela.`;
  lightboxCta.href = `https://wa.me/5511914689402?text=${encodeURIComponent(message)}`;
  lightboxCta.dataset.cta = `lightbox-whatsapp-${pad(currentPhoto + 1)}`;
}

galleryItems.forEach((item, index) => item.addEventListener('click', () => {
  lastFocus = item;
  showPhoto(index);
  lightbox.showModal();
  document.body.classList.add('modal-open');
  lightbox.querySelector('[data-close]').focus();
}));

lightbox.querySelector('[data-lightbox-prev]').addEventListener('click', () => showPhoto(currentPhoto - 1));
lightbox.querySelector('[data-lightbox-next]').addEventListener('click', () => showPhoto(currentPhoto + 1));
lightbox.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(currentPhoto - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(currentPhoto + 1); }
});

// Deslizar para trocar de foto no celular
let touchStartX = null;
lightbox.addEventListener('touchstart', event => { touchStartX = event.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', event => {
  if (touchStartX === null) return;
  const delta = event.changedTouches[0].clientX - touchStartX;
  touchStartX = null;
  if (Math.abs(delta) > 50) showPhoto(currentPhoto + (delta < 0 ? 1 : -1));
}, { passive: true });

function closeLightbox() {
  if (lightbox.open) lightbox.close();
}

lightbox.querySelector('[data-close]').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', event => {
  if (event.target === lightbox) closeLightbox();
});
// Fecha por botão, clique no fundo ou Esc: sempre devolve o foco à foto.
lightbox.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  lastFocus?.focus();
});

/* Tracking de CTAs (dataLayer) ------------------------------------------- */
window.dataLayer = window.dataLayer || [];
window.trackAngelliryCTA = detail => window.dataLayer.push({ event: 'cta_click', ...detail });
document.querySelectorAll('[data-cta]').forEach(element => element.addEventListener('click', () => {
  window.trackAngelliryCTA({ cta: element.dataset.cta });
}));

/* Ano do rodapé ---------------------------------------------------------- */
document.querySelector('[data-year]').textContent = new Date().getFullYear();
