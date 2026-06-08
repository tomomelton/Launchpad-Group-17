document.addEventListener('click', function (e) {
  if (!e.target.closest('.lang-dropdown')) {
    var menu = document.querySelector('.lang-menu');
    if (menu) menu.classList.remove('open');
  }
});

var toggle = document.querySelector('.nav-toggle');
var navMenu = document.querySelector('.nav-menu');

function setMenuOpen(isOpen) {
  if (!navMenu || !toggle) return;
  navMenu.classList.toggle('open', isOpen);
  toggle.setAttribute('aria-expanded', String(isOpen));
  toggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
}

if (toggle && navMenu) {
  toggle.addEventListener('click', function () {
    setMenuOpen(!navMenu.classList.contains('open'));
  });
}

var links = document.querySelectorAll('.nav-links a');
for (var i = 0; i < links.length; i++) {
  links[i].addEventListener('click', function () {
    setMenuOpen(false);
  });
}
