import { fetchUserData, fallbackUserData } from "./data.js";

let cachedUser = null;
const profileState = {
  questions: [],
  answers: [],
  filterTag: null,
  sort: { questions: "newest", answers: "newest" },
};
let activatePanel = () => {};

document.addEventListener("DOMContentLoaded", async () => {
  const user = await loadUser();
  applyUserData(user);
});

async function loadUser() {
  if (cachedUser) return cachedUser;

  try {
    cachedUser = await fetchUserData();
  } catch (error) {
    console.warn("Falling back to local user data", error);
    cachedUser = fallbackUserData;
  }

  return cachedUser;
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

  document.querySelectorAll("[data-followers]").forEach((el) => {
    el.textContent = formatNumber(user.followers);
  });

  document.querySelectorAll("[data-following]").forEach((el) => {
    el.textContent = formatNumber(user.following);
  });

  setImage("profile-image", user.profileImage);
  setImage("profile-image-side", user.profileImage);

  renderList("[data-tags]", user.tags, (tag) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    return span;
  });

  renderList("[data-notifications]", user.notifications, (note) => {
    const li = document.createElement("li");
    li.className = "list__item";
    li.textContent = note;
    return li;
  });

  renderList("[data-notifications-dropdown]", user.notifications, buildNotificationItem);

  renderActivityQuestions(user.questions);
  renderActivityAnswers(user.answers);
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

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString() : value;
}

document.addEventListener("DOMContentLoaded", () => {
  activatePanel = setupTabs();
  setupNavigationShortcuts();
  setupSortControls();
  setupNotificationsDropdown();
  setupTagFilterBehavior();
});

function setupTabs() {
  const buttons = Array.from(document.querySelectorAll(".tab-btn"));
  const panels = Array.from(document.querySelectorAll(".profile-panel"));

  const activate = (target) => {
    if (!target) return;
    buttons.forEach((b) => b.classList.toggle("tab-btn--active", b.dataset.tab === target));
    panels.forEach((panel) => {
      panel.classList.toggle("profile-panel--active", panel.dataset.panel === target);
    });
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      activate(btn.dataset.tab);
    });
  });

  return activate;
}

function setupNavigationShortcuts() {
  const navTargets = document.querySelectorAll("[data-nav]");

  navTargets.forEach((trigger) => {
    const target = trigger.dataset.nav;
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      if (typeof activatePanel === "function") activatePanel(target);
    });
    trigger.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (typeof activatePanel === "function") activatePanel(target);
      }
    });
  });
}

// Profile-specific population
document.addEventListener("DOMContentLoaded", async () => {
  const user = await loadUser();

  const aboutEl = document.querySelector("[data-about]");
  if (aboutEl) aboutEl.textContent = user.about;

  renderList("[data-badges]", user.badges, (badge) => {
    const wrapper = document.createElement("div");
    wrapper.className = "badge";

    const img = document.createElement("img");
    img.src = badge.icon;
    img.alt = badge.label;
    // badge image

    const label = document.createElement("span");
    label.className = "badge__label";
    label.textContent = badge.label;

    wrapper.append(img, label);
    return wrapper;
  });

  renderList("[data-posts]", user.posts, (post) => {
    const card = document.createElement("div");
    card.className = "post-card";
    card.innerHTML = `
      <div class="post-card__title">${post.title}</div>
      <div class="post-card__meta">by ${post.username}</div>
    `;
    if (post.url) card.addEventListener("click", () => (window.location.href = post.url));
    return card;
  });

  renderActivityQuestions(user.questions);
  renderActivityAnswers(user.answers);

  renderList("[data-tag-cards]", user.tagCards, (tag) => {
    const link = document.createElement("a");
    link.className = "tag-card tag-card--vertical";
    link.href = tag.url || "#";
    link.dataset.tagName = tag.name;
    link.innerHTML = `
      <span class="tag-card__name"><!-- tag card -->${tag.name}</span>
      <span class="tag-card__count-box">
        <span class="tag-card__count-number">${formatNumber(tag.posts)}</span>
        <span class="tag-card__count-label">Posts</span>
      </span>
    `;
    return link;
  });

  profileState.questions = Array.isArray(user.questions) ? user.questions : [];
  profileState.answers = Array.isArray(user.answers) ? user.answers : [];

  renderQuestionCards(profileState.questions, profileState.sort.questions);
  renderAnswerCards(profileState.answers, profileState.sort.answers);
});

function setupSortControls() {
  const sortButtons = document.querySelectorAll("[data-sort-target]");

  sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const { sortTarget, sort } = button.dataset;
      if (!sortTarget || !sort) return;

      profileState.sort[sortTarget] = sort;
      updateSortSelection(sortTarget, sort);

      if (sortTarget === "questions") {
        renderQuestionCards(profileState.questions, sort);
      }
      if (sortTarget === "answers") {
        renderAnswerCards(profileState.answers, sort);
      }
    });
  });

  updateSortSelection("questions", profileState.sort.questions);
  updateSortSelection("answers", profileState.sort.answers);
}

function updateSortSelection(target, activeSort) {
  document.querySelectorAll(`[data-sort-target="${target}"]`).forEach((btn) => {
    btn.classList.toggle("sort-button--active", btn.dataset.sort === activeSort);
  });
}

function renderQuestionCards(items, sortKey = "newest") {
  const container = document.querySelector("[data-questions-full]");
  if (!container) return;

  const filtered = profileState.filterTag
    ? items.filter((item) => Array.isArray(item.tags) && item.tags.includes(profileState.filterTag))
    : items;
  const sorted = sortItems(filtered, sortKey);
  container.innerHTML = "";

  sorted.forEach((item) => {
    const card = document.createElement("article");
    card.className = "question-card glass qa-card--full";
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const description = item.excerpt || item.description || "";
    const inlineTags = tags.filter((t) => /^\[.*\]$/.test(t));
    const remainingTags = tags.filter((t) => !inlineTags.includes(t));

    const inlineTagsHtml = inlineTags
      .map((tag) => `<span class="pill pill--muted"><!-- inline tag -->${tag}</span>`)
      .join("");
    const tagsHtml = remainingTags
      .map((tag) => `<span class="pill pill--muted"><!-- tag card -->${tag}</span>`)
      .join("");

    card.innerHTML = `
      <div class="question-card__stats">
        <div class="question-card__stat question-card__stat--votes">
          <span class="question-card__stat-number">${formatNumber(item.votes ?? 0)}</span>
          <span class="question-card__stat-label">votes</span>
        </div>
        <div class="question-card__stat question-card__stat--answers">
          <span class="question-card__stat-number">${formatNumber(item.answers ?? 0)}</span>
          <span class="question-card__stat-label">answers</span>
        </div>
        <div class="question-card__stat question-card__stat--views">
          <span class="question-card__stat-number">${formatNumber(item.views ?? 0)}</span>
          <span class="question-card__stat-label">views</span>
        </div>
      </div>
      <div class="question-card__body">
        <div class="question-card__title-row">
          <h3>${item.title}</h3>
          ${inlineTagsHtml}
        </div>
        <p class="question-card__excerpt">${description}</p>
        <div class="question-card__tags">${tagsHtml}</div>
      </div>
    `;

    if (item.url) card.addEventListener("click", () => (window.location.href = item.url));
    container.appendChild(card);
  });
}

function renderAnswerCards(items, sortKey = "newest") {
  const container = document.querySelector("[data-answers-full]");
  if (!container) return;

  const sorted = sortItems(items, sortKey);
  container.innerHTML = "";

  sorted.forEach((item) => {
    const card = document.createElement("article");
    card.className = "question-card glass qa-card--full";

    card.innerHTML = `
      <div class="question-card__stats">
        <div class="question-card__stat question-card__stat--votes">
          <span class="question-card__stat-number">${formatNumber(item.votes ?? 0)}</span>
          <span class="question-card__stat-label">votes</span>
        </div>
        <div class="question-card__stat question-card__stat--views">
          <span class="question-card__stat-number">${formatNumber(item.views ?? 0)}</span>
          <span class="question-card__stat-label">views</span>
        </div>
      </div>
      <div class="question-card__body">
        <h3>${item.snippet || item.title}</h3>
        <p class="question-card__excerpt">${item.excerpt || ""}</p>
        <div class="question-card__tags">
          <span class="pill pill--muted">Related</span>
          <span class="pill pill--muted">${item.questionTitle || ""}</span>
        </div>
      </div>
    `;

    if (item.url) card.addEventListener("click", () => (window.location.href = item.url));
    container.appendChild(card);
  });
}

function sortItems(items, sortKey) {
  const clone = [...items];
  if (sortKey === "votes") {
    return clone.sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
  }

  const getDate = (item) => new Date(item.createdAt || 0).getTime();

  if (sortKey === "oldest") {
    return clone.sort((a, b) => getDate(a) - getDate(b));
  }

  // default newest
  return clone.sort((a, b) => getDate(b) - getDate(a));
}

// Tag Filter Script
function setupTagFilterBehavior() {
  const filterableGrids = document.querySelectorAll("[data-tag-filterable]");
  filterableGrids.forEach((grid) => {
    grid.addEventListener("click", (event) => {
      const tagCard = event.target.closest(".tag-card");
      if (!tagCard || !tagCard.dataset.tagName) return;
      event.preventDefault();
      profileState.filterTag = tagCard.dataset.tagName;
      if (typeof activatePanel === "function") activatePanel("questions");
      renderQuestionCards(profileState.questions, profileState.sort.questions);
    });
  });
}

function buildNotificationItem(note) {
  const li = document.createElement("li");
  li.className = "list__item";
  li.textContent = note;
  return li;
}

function renderActivityQuestions(items = []) {
  const container = document.querySelector("[data-questions]");
  if (!container) return;
  container.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "qa-card qa-card--compact";
    card.innerHTML = `
      <div class="qa-card__votes">
        <span class="qa-card__stat-number">${formatNumber(item.votes ?? 0)}</span>
        <span class="qa-card__stat-label">Votes</span>
      </div>
      <div class="qa-card__content">
        <div class="qa-card__title">${item.title}</div>
        <div class="qa-card__meta">${formatNumber(item.views ?? 0)} views</div>
      </div>
    `;
    if (item.url) card.addEventListener("click", () => (window.location.href = item.url));
    container.appendChild(card);
  });
}

function renderActivityAnswers(items = []) {
  const container = document.querySelector("[data-answers]");
  if (!container) return;
  container.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "qa-card qa-card--compact";
    card.innerHTML = `
      <div class="qa-card__votes">
        <span class="qa-card__stat-number">${formatNumber(item.votes ?? 0)}</span>
        <span class="qa-card__stat-label">Votes</span>
      </div>
      <div class="qa-card__content">
        <div class="qa-card__title">${item.snippet || item.title}</div>
        <div class="qa-card__meta">${item.questionTitle || ""}</div>
      </div>
    `;
    if (item.url) card.addEventListener("click", () => (window.location.href = item.url));
    container.appendChild(card);
  });
}

function setupNotificationsDropdown() {
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

