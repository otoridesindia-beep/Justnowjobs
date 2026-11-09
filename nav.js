// Mobile slide-out menu, built from the header navigation. Shared by every page.
(() => {
  const header = document.querySelector('.site-header');
  const nav = header && header.querySelector('.main-nav');
  if (!nav) return;

  const brand = header.querySelector('.brand');
  const cta = header.querySelector('.header-cta');

  const toggle = document.createElement('button');
  toggle.className = 'menu-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Open menu');
  toggle.setAttribute('aria-controls', 'mobileDrawer');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>';
  header.insertBefore(toggle, header.firstChild);

  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay';

  const drawer = document.createElement('aside');
  drawer.className = 'drawer';
  drawer.id = 'mobileDrawer';
  drawer.setAttribute('aria-label', 'Menu');
  drawer.innerHTML = '<div class="drawer-head"></div><nav aria-label="Mobile navigation"></nav>';

  const head = drawer.querySelector('.drawer-head');
  const brandClone = brand.cloneNode(true);
  brandClone.removeAttribute('aria-label');
  head.appendChild(brandClone);
  const close = document.createElement('button');
  close.className = 'drawer-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Close menu');
  close.textContent = '×';
  head.appendChild(close);

  const drawerNav = drawer.querySelector('nav');
  nav.querySelectorAll('a').forEach((link) => drawerNav.appendChild(link.cloneNode(true)));
  if (cta) {
    const ctaClone = cta.cloneNode(true);
    ctaClone.className = 'drawer-cta';
    drawer.appendChild(ctaClone);
  }

  document.body.append(overlay, drawer);

  function setOpen(isOpen) {
    document.body.classList.toggle('drawer-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) close.focus(); else if (document.activeElement && drawer.contains(document.activeElement)) toggle.focus();
  }

  toggle.addEventListener('click', () => setOpen(true));
  close.addEventListener('click', () => setOpen(false));
  overlay.addEventListener('click', () => setOpen(false));
  drawer.addEventListener('click', (event) => { if (event.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });
  window.matchMedia('(min-width: 761px)').addEventListener('change', (event) => { if (event.matches) setOpen(false); });
})();
