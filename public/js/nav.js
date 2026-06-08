document.addEventListener('click', function (e) {
  if (!e.target.closest('.lang-dropdown')) {
    var menu = document.querySelector('.lang-menu');
    if (menu) menu.classList.remove('open');
  }
});

var toggle = document.querySelector('.nav-toggle');
var navMenu = document.querySelector('.nav-menu');

function navLabel(key, fallback) {
  return window.I18N && window.I18N.t ? window.I18N.t(key) : fallback;
}

function setMenuOpen(isOpen) {
  if (!navMenu || !toggle) return;
  navMenu.classList.toggle('open', isOpen);
  toggle.setAttribute('aria-expanded', String(isOpen));
  toggle.setAttribute('aria-label', isOpen ? navLabel('close_nav', 'Close navigation menu') : navLabel('open_nav', 'Open navigation menu'));
}

if (toggle && navMenu) {
  toggle.addEventListener('click', function () {
    setMenuOpen(!navMenu.classList.contains('open'));
  });

  document.addEventListener('languagechange', function () {
    setMenuOpen(navMenu.classList.contains('open'));
  });
}

var links = document.querySelectorAll('.nav-links a');
for (var i = 0; i < links.length; i++) {
  links[i].addEventListener('click', function () {
    setMenuOpen(false);
  });
}
