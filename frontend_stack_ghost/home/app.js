import { fetchUserData, fallbackUserData } from "./data.js";

let cachedUser = null;

document.addEventListener("DOMContentLoaded", async () => {
  cachedUser = await loadUser();
  applyUserData(cachedUser);
  setupPanelSwitching();
  setupFilters();
  setupNotificationDropdown();
  setupTagRemoval();
  renderQuestions(cachedUser.questions, "newest");
  renderAnswers(cachedUser.answers, "newest");
});

async function loadUser() {
  try {
    return await fetchUserData();
  } catch (error) {
    console.warn("Falling back to local user data", error);
    return fallbackUserData;
  }
}

function applyUserData(user) {
  document.querySelectorAll("[data-username]").forEach((el) => {
    el.textContent = user.username;
  });
  document.querySelectorAll("[data-reputation]").forEach((el) => {
    el.textContent = formatNumber(user.reputation);
  });
  document.querySelectorAll("[data-asked]").forEach((el) => {
    el.textContent = formatNumber(user.asked);
  });
  document.querySelectorAll("[data-answered]").forEach((el) => {
    el.textContent = formatNumber(user.answered);
  });

  setImage("profile-image", user.profileImage);

  renderList("[data-tags]", user.tags, buildTagPill);

  renderList("[data-notifications]", user.notifications, buildNotificationItem);
  renderList("[data-notifications-dropdown]", user.notifications, buildNotificationItem);
}

function setImage(id, src) {
  const el = document.getElementById(id);
  if (el) {
    el.src = src;
  }
}

function renderList(selector, items, builder) {
  const container = document.querySelector(selector);
  if (!container) return;
  container.innerHTML = "";
  items.forEach((item) => container.appendChild(builder(item)));
}

function buildNotificationItem(note) {
  const li = document.createElement("li");
  li.className = "list__item";
  li.textContent = note;
  return li;
}

function buildTagPill(tag) {
  const pill = document.createElement("span");
  pill.className = "tag";
  pill.textContent = tag;

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "tag-remove-btn";
  removeBtn.setAttribute("aria-label", `Remove ${tag}`);
  removeBtn.textContent = "×";

  pill.appendChild(removeBtn);
  return pill;
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString() : value;
}

function setupPanelSwitching() {
  const triggers = document.querySelectorAll("[data-panel-target]");
  const panels = document.querySelectorAll(".profile-panel");

  triggers.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = btn.dataset.panelTarget;
      panels.forEach((panel) => {
        panel.classList.toggle("profile-panel--active", panel.dataset.panel === target);
      });
    });
  });
}

function setupFilters() {
  document.querySelectorAll("[data-filter-group]").forEach((group) => {
    const scope = group.dataset.filterGroup;
    group.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        group.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("filter-btn--active"));
        btn.classList.add("filter-btn--active");
        const sort = btn.dataset.sort;
        if (scope === "questions") renderQuestions(cachedUser.questions, sort);
        if (scope === "answers") renderAnswers(cachedUser.answers, sort);
      });
    });
  });
}

function renderQuestions(items, sortKey) {
  const container = document.querySelector("[data-questions-full]");
  if (!container) return;
  const sorted = sortItems(items, sortKey);
  container.innerHTML = "";

  sorted.forEach((q) => {
    const card = document.createElement("article");
    card.className = "qa-card qa-card--full";

    const header = document.createElement("div");
    header.className = "qa-card__header";
    header.innerHTML = `
      <div class="qa-card__title"><!-- question card: title -->${q.title}</div>
      <div class="qa-card__meta">
        <span class="pill pill--muted"><!-- question card: votes -->${formatNumber(q.votes)} votes</span>
        <span class="pill pill--muted"><!-- question card: views -->${formatNumber(q.views ?? 0)} views</span>
      </div>
    `;

    const tags = document.createElement("div");
    tags.className = "qa-card__tags";
    (q.tags || []).forEach((tag) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = tag;
      tags.appendChild(span);
    });

    card.append(header, tags);
    if (q.url) card.addEventListener("click", () => (window.location.href = q.url));
    container.appendChild(card);
  });
}

function renderAnswers(items, sortKey) {
  const container = document.querySelector("[data-answers-full]");
  if (!container) return;
  const sorted = sortItems(items, sortKey);
  container.innerHTML = "";

  sorted.forEach((a) => {
    const card = document.createElement("article");
    card.className = "qa-card qa-card--full";

    card.innerHTML = `
      <div class="qa-card__header">
        <div class="qa-card__title"><!-- answer card: excerpt -->${a.excerpt || a.title}</div>
        <div class="qa-card__meta">
          <span class="pill pill--muted"><!-- answer card: votes -->${formatNumber(a.votes)} votes</span>
          <span class="pill pill--muted"><!-- answer card: views -->${formatNumber(a.views ?? 0)} views</span>
        </div>
      </div>
      <p class="qa-card__excerpt">
        ${a.excerpt || ""}
      </p>
      <div class="qa-card__footer">
        <span class="qa-card__question">
          <!-- answer card: question title -->
          Related question: ${a.questionTitle || ""}
        </span>
      </div>
    `;

    if (a.url) card.addEventListener("click", () => (window.location.href = a.url));
    container.appendChild(card);
  });
}

function sortItems(items, sortKey) {
  const copy = [...items];
  if (sortKey === "votes") {
    return copy.sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
  }
  if (sortKey === "oldest") {
    return copy.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  }
  // default newest
  return copy.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

function setupNotificationDropdown() {
  const toggle = document.querySelector("[data-notifications-toggle]");
  const panel = document.querySelector("[data-notifications-panel]");
  if (!toggle || !panel) return;

  const closePanel = () => {
    panel.classList.remove("notifications__dropdown--open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = panel.classList.toggle("notifications__dropdown--open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (e) => {
    if (panel.contains(e.target) || toggle.contains(e.target)) return;
    closePanel();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
  });
}

function setupTagRemoval() {
  const container = document.querySelector("[data-tags]");
  if (!container) return;

  container.addEventListener("click", (event) => {
    const button = event.target.closest(".tag-remove-btn");
    if (!button) return;

    const tagEl = button.closest(".tag");
    if (tagEl) {
      tagEl.classList.add("tag--hidden");
      setTimeout(() => tagEl.remove(), 180);
    }
  });
}

