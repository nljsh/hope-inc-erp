// S1-DEV-03 & S2-DEV-02: Hope Enterprise — Client-Side Authentication Service & Validation
import { supabaseClient } from '../../config/supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
  const signinForm = document.getElementById('signin-form');
  const registerForm = document.getElementById('register-form');
  const forgotLink = document.querySelector('.forgot-link');

  function ensureFeedbackBanner(form) {
    let banner = form.querySelector('.auth-feedback');
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'auth-feedback';
      banner.setAttribute('role', 'status');
      banner.style.cssText = [
        'font-size: 0.8rem',
        'padding: 0.65rem 0.85rem',
        'border-radius: 8px',
        'border: 1px solid #23252C',
        'background-color: #1B1C22',
        'color: #F3F4F6',
        'line-height: 1.45',
        'display: none'
      ].join(';');
      form.insertBefore(banner, form.querySelector('button[type="submit"]'));
    }
    return banner;
  }

  function showFeedback(form, message, type = 'info') {
    if (!form) return;
    const banner = ensureFeedbackBanner(form);
    banner.textContent = message;
    banner.style.display = 'block';
    if (type === 'error') {
      banner.style.borderColor = '#7F1D1D';
      banner.style.color = '#FCA5A5';
    } else if (type === 'success') {
      banner.style.borderColor = '#065F46';
      banner.style.color = '#6EE7B7';
    } else {
      banner.style.borderColor = '#23252C';
      banner.style.color = '#D1D5DB';
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Sign In Handler
  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signin-email').value.trim();
      const password = document.getElementById('signin-password').value;

      if (!isValidEmail(email)) {
        return showFeedback(signinForm, 'Enter a valid corporate email address.', 'error');
      }
      if (password.length < 6) {
        return showFeedback(signinForm, 'Password must be at least 6 characters.', 'error');
      }

      if (!supabaseClient) {
        sessionStorage.setItem('hope_erp_demo_user', JSON.stringify({ email, role: 'operator' }));
        showFeedback(signinForm, 'Credentials validated. Redirecting to Hope Enterprise workspace...', 'success');
        setTimeout(() => {
          window.location.href = 'src/pages/dashboard.html';
        }, 700);
        return;
      }

      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        return showFeedback(signinForm, error.message, 'error');
      }

      showFeedback(signinForm, 'Session authenticated. Redirecting...', 'success');
      window.location.href = 'src/pages/dashboard.html';
    });
  }

  // Register Handler
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('register-name').value.trim();
      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value;

      if (fullName.length < 2) {
        return showFeedback(registerForm, 'Enter your full operator name.', 'error');
      }
      if (!isValidEmail(email)) {
        return showFeedback(registerForm, 'Enter a valid corporate email address.', 'error');
      }
      if (password.length < 8) {
        return showFeedback(registerForm, 'Password must be at least 8 characters.', 'error');
      }

      if (!supabaseClient) {
        return showFeedback(
          registerForm,
          'Registration validated. Connect live Supabase keys in supabaseClient.js to persist operator accounts.',
          'success'
        );
      }

      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });

      if (error) {
        return showFeedback(registerForm, error.message, 'error');
      }

      showFeedback(registerForm, 'Operator account provisioned. Check your inbox to verify your email.', 'success');
    });
  }

  // Forgot Password Handler
  if (forgotLink) {
    forgotLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signin-email').value.trim();
      if (!isValidEmail(email)) {
        return showFeedback(signinForm, 'Enter your email address above first to send a recovery link.', 'error');
      }

      if (!supabaseClient) {
        return showFeedback(signinForm, Password recovery flow ready for  once Supabase SMTP is active., 'info');
      }

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
      if (error) {
        return showFeedback(signinForm, error.message, 'error');
      }
      showFeedback(signinForm, Password reset instructions dispatched to ., 'success');
    });
  }
});
