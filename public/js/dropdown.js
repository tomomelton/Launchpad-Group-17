function closeAllPillMenus() {
  var menus = document.querySelectorAll('.pill-menu');
  for (var i = 0; i < menus.length; i++) {
    menus[i].classList.remove('open');
  }

  var triggers = document.querySelectorAll('.pill-trigger');
  for (var j = 0; j < triggers.length; j++) {
    triggers[j].setAttribute('aria-expanded', 'false');
  }
}

var dropdowns = document.querySelectorAll('.pill-dropdown');

for (var d = 0; d < dropdowns.length; d++) {
  (function (dropdown) {
    var trigger = dropdown.querySelector('.pill-trigger');
    var menu = dropdown.querySelector('.pill-menu');
    if (!trigger || !menu) return;

    trigger.addEventListener('click', function () {
      var isOpen = menu.classList.contains('open');
      closeAllPillMenus();
      if (!isOpen) {
        menu.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  })(dropdowns[d]);
}

document.addEventListener('click', function (e) {
  if (!e.target.closest('.pill-dropdown')) {
    closeAllPillMenus();
  }
});
