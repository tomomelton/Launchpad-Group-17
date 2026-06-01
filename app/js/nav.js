document.addEventListener('click', function (e) {
  if (!e.target.closest('.lang-dropdown')) {
    var menu = document.querySelector('.lang-menu');
    if (menu) menu.classList.remove('open');
  }
});

var toggle = document.querySelector('.nav-toggle');
var navMenu = document.querySelector('.nav-menu');

if (toggle) {
  toggle.addEventListener('click', function () {
    navMenu.classList.toggle('open');
  });
}

var links = document.querySelectorAll('.nav-links a');
for (var i = 0; i < links.length; i++) {
  links[i].addEventListener('click', function () {
    navMenu.classList.remove('open');
  });
}
