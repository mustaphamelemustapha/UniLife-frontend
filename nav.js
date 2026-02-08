// Shared mobile nav toggle (left drawer + overlay)
const navbar = document.querySelector('.navbar');
if (navbar) {
  const navLinks = navbar.querySelector('.nav-links');
  const menuToggle = navbar.querySelector('.menu-toggle');

  let overlay = document.querySelector('.nav-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);
  }

  const closeDrawer = () => {
    navLinks.classList.remove('active');
    overlay.classList.remove('active');
  };

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', closeDrawer);

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeDrawer);
    });
  }
}
