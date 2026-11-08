const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.getElementById('mobile-nav');
if (menuButton && mobileMenu) {
  menuButton.addEventListener('click', () => {
    const opened = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!opened));
    menuButton.setAttribute('aria-label', opened ? 'Open navigation' : 'Close navigation');
    mobileMenu.hidden = opened;
  });
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open navigation');
      mobileMenu.hidden = true;
    });
  });
}
