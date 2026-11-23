import { supabaseClient } from '../../config/supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
  const signinForm = document.getElementById('signin-form');
  const registerForm = document.getElementById('register-form');
  const forgotLink = document.querySelector('.forgot-link');
  const authCard = document.querySelector('.auth-card');

  let isRecoveryMode = false;
  let recoveryForm = null;

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
        'margin-bottom: 0.75rem',
        'display: none'
      ].join(';');
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        form.insertBefore(banner, submitBtn);
      } else {
        form.appendChild(banner);
      }
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

  function mountRecoveryForm() {
    if (!authCard || recoveryForm) return;
    isRecoveryMode = true;

    document.querySelectorAll('.auth-form').forEach((f) => f.classList.remove('active'));

    recoveryForm = document.createElement('form');
    recoveryForm.id = 'recovery-set-password-form';
    recoveryForm.className = 'auth-form active';
    recoveryForm.innerHTML = `
      <div class="field-group">
        <label for="recovery-new-password">NEW PASSWORD</label>
        <input type="password" id="recovery-new-password" name="new_password" autocomplete="new-password" minlength="6" required />
      </div>
      <div class="field-group">
        <label for="recovery-confirm-password">CONFIRM NEW PASSWORD</label>
        <input type="password" id="recovery-confirm-password" name="confirm_password" autocomplete="new-password" minlength="6" required />
      </div>
      <button type="submit" class="btn-primary">Update Password</button>
    `;

    authCard.appendChild(recoveryForm);
    showFeedback(recoveryForm, 'Recovery session verified. Enter your new password below.', 'info');

    recoveryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById('recovery-new-password').value;
      const confirmPassword = document.getElementById('recovery-confirm-password').value;

      if (!newPassword || newPassword.length < 6) {
        return showFeedback(recoveryForm, 'New password must be at least 6 characters.', 'error');
      }
      if (newPassword !== confirmPassword) {
        return showFeedback(recoveryForm, 'Passwords do not match.', 'error');
      }

      showFeedback(recoveryForm, 'Updating password...', 'info');
      const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
      if (error) {
        return showFeedback(recoveryForm, error.message, 'error');
      }

      showFeedback(recoveryForm, 'Password updated! Redirecting to workspace...', 'success');
      setTimeout(() => {
        window.location.replace('src/pages/dashboard.html');
      }, 700);
    });
  }

  const hasRecoveryParams =
    window.location.hash.includes('type=recovery') ||
    new URLSearchParams(window.location.search).has('code');

  if (hasRecoveryParams) {
    mountRecoveryForm();
  }

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        mountRecoveryForm();
      }
    });

    if (!hasRecoveryParams) {
      supabaseClient.auth.getSession().then(({ data }) => {
        if (!isRecoveryMode && data?.session?.user) {
          window.location.href = 'src/pages/dashboard.html';
        }
      });
    }
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
      if (!password || password.length < 6) {
        return showFeedback(signinForm, 'Password must be at least 6 characters.', 'error');
      }

      if (!supabaseClient) {
        return showFeedback(signinForm, 'Supabase client not initialized. Check src/config/env.local.js.', 'error');
      }

      showFeedback(signinForm, 'Authenticating...', 'info');
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        return showFeedback(signinForm, error.message, 'error');
      }

      const status = String(data?.user?.user_metadata?.account_status || '').toLowerCase();
      if (status === 'blocked' || data?.user?.user_metadata?.is_blocked) {
        await supabaseClient.auth.signOut();
        return showFeedback(signinForm, 'This account is blocked. Contact an administrator.', 'error');
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
      if (password.length < 6) {
        return showFeedback(registerForm, 'Password must be at least 6 characters.', 'error');
      }

      if (!supabaseClient) {
        return showFeedback(registerForm, 'Supabase client not initialized. Check src/config/env.local.js.', 'error');
      }

      showFeedback(registerForm, 'Creating account...', 'info');
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: 'user' },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        return showFeedback(registerForm, error.message, 'error');
      }

      if (data?.session?.user) {
        showFeedback(registerForm, 'Account created and signed in. Redirecting...', 'success');
        window.location.href = 'src/pages/dashboard.html';
        return;
      }

      showFeedback(
        registerForm,
        'Account registered. Check your email inbox to confirm if email confirmation is enabled, then sign in.',
        'success'
      );
    });
  }

  // Forgot / Set Password Handler
  if (forgotLink) {
    forgotLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signin-email').value.trim();
      const typedPassword = document.getElementById('signin-password').value;

      if (!supabaseClient) {
        return showFeedback(signinForm, 'Supabase client not initialized. Check src/config/env.local.js.', 'error');
      }

      const { data: sessionData } = await supabaseClient.auth.getSession();
      if (sessionData?.session?.user && typedPassword.length >= 6) {
        const { error: updErr } = await supabaseClient.auth.updateUser({ password: typedPassword });
        if (updErr) return showFeedback(signinForm, updErr.message, 'error');
        return showFeedback(signinForm, 'Password updated for active session.', 'success');
      }

      if (!isValidEmail(email)) {
        return showFeedback(signinForm, 'Enter your email address above first to send a reset link.', 'error');
      }

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) {
        return showFeedback(signinForm, error.message, 'error');
      }
      showFeedback(signinForm, `Password reset link sent to ${email}.`, 'success');
    });
  }
});
