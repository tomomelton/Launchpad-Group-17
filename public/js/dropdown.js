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

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
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

function formatCategoryLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, function (letter) {
      return letter.toUpperCase();
    });
}

function getCategoryIcon(categoryKey) {
  var icons = {
    staple_foods: 'fa-bowl-food',
    protein_sources: 'fa-drumstick-bite',
    fruit_and_vegetables: 'fa-carrot',
    drinks: 'fa-mug-hot',
    snacks_and_desserts: 'fa-cookie-bite',
    household_and_personal_care: 'fa-pump-soap',
    baby_and_family_items: 'fa-baby',
    dietary_requirements_supported: 'fa-leaf'
  };
  return icons[categoryKey] || 'fa-box-open';
}

function buildCheckboxOption(categoryKey, item, index) {
  var label = document.createElement('label');
  label.className = 'pill-option';

  var input = document.createElement('input');
  input.name = categoryKey;
  input.type = 'checkbox';
  input.value = String(index);
  input.dataset.itemLabel = item;
  input.dataset.categoryIcon = getCategoryIcon(categoryKey);

  var span = document.createElement('span');
  span.textContent = item;

  label.appendChild(input);
  label.appendChild(span);
  return label;
}

function buildCollapseSection(categoryKey, items) {
  var section = document.createElement('div');
  section.className = 'pill-collapse';

  var trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'pill-collapse-trigger';
  trigger.setAttribute('aria-expanded', 'false');

  var title = document.createElement('span');
  title.innerHTML = '<i class="fa-solid ' + getCategoryIcon(categoryKey) + '" aria-hidden="true"></i> ' + formatCategoryLabel(categoryKey);
  trigger.appendChild(title);

  var chevron = document.createElement('i');
  chevron.className = 'fa-solid fa-chevron-down pill-collapse-chevron';
  chevron.setAttribute('aria-hidden', 'true');
  trigger.appendChild(chevron);

  var panel = document.createElement('div');
  panel.className = 'pill-collapse-panel';

  for (var i = 0; i < items.length; i++) {
    panel.appendChild(buildCheckboxOption(categoryKey, items[i], i));
  }

  trigger.addEventListener('click', function (e) {
    e.stopPropagation();
    var isOpen = section.classList.toggle('open');
    trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  section.appendChild(trigger);
  section.appendChild(panel);
  return section;
}

function buildFoodMenu(data) {
  var menu = document.querySelector('.food-dropdown .pill-menu');
  if (!menu) return;

  menu.innerHTML = '';
  var keys = Object.keys(data);

  for (var k = 0; k < keys.length; k++) {
    var categoryKey = keys[k];
    var items = data[categoryKey];
    if (!Array.isArray(items) || items.length === 0) continue;
    menu.appendChild(buildCollapseSection(categoryKey, items));
  }
}

function getSelectedInputs() {
  return Array.prototype.slice.call(document.querySelectorAll('.food-dropdown input[type="checkbox"]:checked'));
}

function getSelectedPreferences() {
  return getSelectedInputs().map(function (input) {
    return input.dataset.itemLabel || input.value;
  });
}

window.getSelectedPreferences = getSelectedPreferences;

function updateSelectedChips() {
  var chips = document.getElementById('selected-chips');
  if (!chips) return;

  chips.innerHTML = '';
  var selectedInputs = getSelectedInputs();

  selectedInputs.forEach(function (input) {
    var pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'pill selected-food-pill';
    pill.setAttribute('aria-label', 'Remove ' + (input.dataset.itemLabel || input.value));
    pill.innerHTML = '<i class="fa-solid ' + (input.dataset.categoryIcon || 'fa-box-open') + '" aria-hidden="true"></i><span>' + (input.dataset.itemLabel || input.value) + '</span><i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    pill.addEventListener('click', function () {
      input.checked = false;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      updateSelectedChips();
    });
    chips.appendChild(pill);
  });
}

window.updateSelectedChips = updateSelectedChips;

document.addEventListener('change', function(e) {
  if (e.target && e.target.closest('.food-dropdown')) {
    updateSelectedChips();
  }
});

fetch('/api/food-bank-items')
  .then(function (res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  })
  .then(function (data) {
    buildFoodMenu(data);
    updateSelectedChips();
  })
  .catch(function (error) {
    console.error('Could not load food items:', error);
  });
