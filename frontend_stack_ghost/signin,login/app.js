import api from '../js/api.js';

const TAB_COPY = {
  login: {
    title: "Login",
    subtitle: "Welcome back to Stack Ghost",
  },
  signup: {
    title: "Sign Up",
    subtitle: "Create your Stack Ghost account",
  },
};

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("page-ready");
  
  // Check if already logged in
  if (api.isAuthenticated()) {
    window.location.href = '../home/index.html';
    return;
  }
  
  setupTabs();
  setupFormFocus();
  setupFormSubmit();
  setupTabLinks();
});

function setupTabs() {
  const tabButtons = Array.from(document.querySelectorAll("[data-tab]"));
  const forms = Array.from(document.querySelectorAll("[data-form]"));
  const indicator = document.querySelector(".tab-switch__indicator");
  const title = document.querySelector(".auth-title");
  const subtitle = document.querySelector(".subtitle");

  const activate = (tab) => {
    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });

    forms.forEach((form) => {
      form.classList.toggle("is-active", form.dataset.form === tab);
    });

    if (indicator) {
      indicator.style.transform = tab === "signup" ? "translateX(100%)" : "translateX(0)";
    }

    if (TAB_COPY[tab]) {
      if (title) title.textContent = TAB_COPY[tab].title;
      if (subtitle) subtitle.textContent = TAB_COPY[tab].subtitle;
    }
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      activate(btn.dataset.tab || "login");
    });
  });

  activate("login");
}

function setupFormFocus() {
  const inputs = document.querySelectorAll(".input-field input, .input-field textarea");
  inputs.forEach((input) => {
    input.addEventListener("focus", () => input.parentElement?.classList.add("is-focused"));
    input.addEventListener("blur", () => {
      if (!input.value.trim()) {
        input.parentElement?.classList.remove("is-focused");
      }
    });
  });
}

function setupFormSubmit() {
  // Login Form
  const loginForm = document.querySelector('[data-form="login"]');
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = loginForm.querySelector("button[type='submit']");
      const email = loginForm.querySelector('[name="email"]').value;
      const password = loginForm.querySelector('[name="password"]').value;
      
      if (!email || !password) {
        showError(loginForm, 'Please fill in all fields');
        return;
      }
      
      const original = submit.textContent;
      submit.disabled = true;
      submit.textContent = "Logging in...";
      submit.classList.add("is-loading");
      
      try {
        const response = await api.login(email, password);
        
        if (response.success) {
          showSuccess(loginForm, 'Login successful! Redirecting...');
          setTimeout(() => {
            window.location.href = '../home/index.html';
          }, 1000);
        } else {
          showError(loginForm, response.message || 'Login failed');
          submit.disabled = false;
          submit.textContent = original;
          submit.classList.remove("is-loading");
        }
      } catch (error) {
        showError(loginForm, error.message || 'Login failed. Please try again.');
        submit.disabled = false;
        submit.textContent = original;
        submit.classList.remove("is-loading");
      }
    });
  }
  
  // Signup Form
  const signupForm = document.querySelector('[data-form="signup"]');
  if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = signupForm.querySelector("button[type='submit']");
      const username = signupForm.querySelector('[name="username"]').value;
      const email = signupForm.querySelector('[name="email"]').value;
      const password = signupForm.querySelector('[name="password"]').value;
      
      if (!username || !email || !password) {
        showError(signupForm, 'Please fill in all fields');
        return;
      }
      
      if (password.length < 10) {
        showError(signupForm, 'Password must be at least 10 characters');
        return;
      }
      
      const original = submit.textContent;
      submit.disabled = true;
      submit.textContent = "Creating account...";
      submit.classList.add("is-loading");
      
      try {
        const response = await api.register(username, email, password);
        
        if (response.success) {
          showSuccess(signupForm, 'Account created! Please login.');
          setTimeout(() => {
            // Switch to login tab
            const loginTab = document.querySelector('[data-tab="login"]');
            if (loginTab) loginTab.click();
            // Pre-fill email
            const loginEmail = loginForm?.querySelector('[name="email"]');
            if (loginEmail) loginEmail.value = email;
          }, 1500);
          submit.disabled = false;
          submit.textContent = original;
          submit.classList.remove("is-loading");
        } else {
          showError(signupForm, response.message || 'Signup failed');
          submit.disabled = false;
          submit.textContent = original;
          submit.classList.remove("is-loading");
        }
      } catch (error) {
        showError(signupForm, error.message || 'Signup failed. Please try again.');
        submit.disabled = false;
        submit.textContent = original;
        submit.classList.remove("is-loading");
      }
    });
  }
}

function showError(form, message) {
  clearMessages(form);
  const error = document.createElement('div');
  error.className = 'auth-message auth-message--error';
  error.textContent = message;
  error.style.cssText = 'padding: 12px; margin: 16px 0; background: rgba(255, 0, 0, 0.1); border: 1px solid rgba(255, 0, 0, 0.3); border-radius: 8px; color: #ff6b6b;';
  form.insertBefore(error, form.querySelector('button[type="submit"]'));
}

function showSuccess(form, message) {
  clearMessages(form);
  const success = document.createElement('div');
  success.className = 'auth-message auth-message--success';
  success.textContent = message;
  success.style.cssText = 'padding: 12px; margin: 16px 0; background: rgba(0, 255, 0, 0.1); border: 1px solid rgba(0, 255, 0, 0.3); border-radius: 8px; color: #51cf66;';
  form.insertBefore(success, form.querySelector('button[type="submit"]'));
}

function clearMessages(form) {
  const messages = form.querySelectorAll('.auth-message');
  messages.forEach(msg => msg.remove());
}

function setupTabLinks() {
  const links = document.querySelectorAll("[data-tab-link]");
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = link.dataset.tabLink;
      const tabButton = document.querySelector(`[data-tab="${target}"]`);
      tabButton?.click();
    });
  });
}
