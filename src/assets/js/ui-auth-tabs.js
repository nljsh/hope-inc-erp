// S1-DEV-02: Sign In / Register Tab & Header View Switcher
document.addEventListener('DOMContentLoaded', () => {
  const switchTriggers = document.querySelectorAll('[data-auth-switch]');
  const tabs = document.querySelectorAll('.auth-tab');
  const signinForm = document.getElementById('signin-form');
  const registerForm = document.getElementById('register-form');

  function activateMode(mode) {
    const isSignin = mode === 'signin';

    tabs.forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.authSwitch === mode);
    });

    signinForm.classList.toggle('active', isSignin);
    registerForm.classList.toggle('active', !isSignin);
  }

  switchTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      activateMode(trigger.dataset.authSwitch);
    });
  });
});
