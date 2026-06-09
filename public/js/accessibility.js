(function () {
  function setToggleState(key, className, enabled) {
    document.body.classList.toggle(className, enabled);
    localStorage.setItem(key, String(enabled));
  }

  function applyStoredPreferences() {
    if (localStorage.getItem('highContrast') === 'true') {
      document.body.classList.add('high-contrast');
    }

    if (localStorage.getItem('largeText') === 'true') {
      document.body.classList.add('large-text');
    }
  }

  function bindControls() {
    var contrastButton = document.querySelector('[data-accessibility-toggle="high-contrast"]');
    var largeTextButton = document.querySelector('[data-accessibility-toggle="large-text"]');

    if (contrastButton) {
      contrastButton.addEventListener('click', function () {
        setToggleState('highContrast', 'high-contrast', !document.body.classList.contains('high-contrast'));
      });
    }

    if (largeTextButton) {
      largeTextButton.addEventListener('click', function () {
        setToggleState('largeText', 'large-text', !document.body.classList.contains('large-text'));
      });
    }
  }

  applyStoredPreferences();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindControls);
  } else {
    bindControls();
  }
})();
