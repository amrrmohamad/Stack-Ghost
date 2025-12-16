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
  const forms = document.querySelectorAll(".auth-form");
  forms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const submit = form.querySelector("button[type='submit']");
      if (!submit) return;
      const original = submit.textContent;
      submit.disabled = true;
      submit.textContent = "Verifying...";
      submit.classList.add("is-loading");

      setTimeout(() => {
        submit.disabled = false;
        submit.textContent = original;
        submit.classList.remove("is-loading");
      }, 900);
    });
  });
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
