import { fetchUserData, fallbackUserData } from "./data.js";
import api from '../js/api.js';

const QUESTIONS_PER_PAGE = 7;
const questionViewState = {
  sort: "newest",
  tag: null,
  page: 1,
};

let cachedUser = null;

document.addEventListener("DOMContentLoaded", async () => {
  cachedUser = await loadUser();
  applyUserData(cachedUser);
  setupPanelSwitching();
  setupFilters();
  setupNotificationDropdown();
  setupTagRemoval();
  setupQuestionsPage();
  setupLogout();
  renderAnswers(cachedUser.answers, "newest");
});

function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await api.logout();
    });
  }
}

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
  setImage("profile-image-side", user.profileImage);

  // Render followed tags in the right sidebar
  if (user.followedTags && user.followedTags.length > 0) {
    renderFollowedTags("[data-tags]", user.followedTags);
  } else {
    renderList("[data-tags]", user.tags || [], buildTagPill);
  }

  renderList("[data-notifications]", user.notifications, buildNotificationItem);
  renderList("[data-notifications-dropdown]", user.notifications, buildNotificationItem);
}

function renderFollowedTags(selector, tags) {
  const container = document.querySelector(selector);
  if (!container) return;
  container.innerHTML = "";

  if (!tags || tags.length === 0) {
    container.innerHTML = '<span style="opacity: 0.6; padding: 10px; display: block;">No followed tags yet</span>';
    return;
  }

  tags.forEach(tag => {
    const pill = document.createElement("span");
    pill.className = "tag";
    pill.style.cursor = 'pointer';
    pill.textContent = tag.name || tag.tag_name;
    pill.title = tag.description || tag.name;

    pill.addEventListener('click', () => {
      questionViewState.tag = tag.name || tag.tag_name;
      questionViewState.page = 1;
      renderQuestionsList();
    });

    container.appendChild(pill);
  });
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
        if (scope === "questions") {
          questionViewState.sort = sort;
          questionViewState.page = 1;
          renderQuestionsList();
        }
        if (scope === "answers") renderAnswers(cachedUser.answers, sort);
      });
    });
  });
}

function setupQuestionsPage() {
  setupQuestionTagClicks();
  setupPagination();
  setupAskQuestionButtons();
  renderQuestionsList();
}

function setupAskQuestionButtons() {
  document.querySelectorAll("[data-ask-question]").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.href = "../ask/index.html";
    });
  });
}

function setupQuestionTagClicks() {
  const list = document.querySelector("[data-questions-list]");
  const activeTag = document.querySelector("[data-active-tag]");
  if (list) {
    list.addEventListener("click", (event) => {
      const tagEl = event.target.closest("[data-tag]");
      if (!tagEl) return;
      const selectedTag = tagEl.dataset.tag;
      questionViewState.tag = selectedTag;
      questionViewState.page = 1;
      renderQuestionsList();
    });
  }
  if (activeTag) {
    activeTag.addEventListener("click", () => {
      if (!questionViewState.tag) return;
      questionViewState.tag = null;
      questionViewState.page = 1;
      renderQuestionsList();
    });
  }
}

function setupPagination() {
  const pagination = document.querySelector("[data-pagination]");
  if (!pagination) return;

  pagination.addEventListener("click", (event) => {
    const pageBtn = event.target.closest("[data-page]");
    if (!pageBtn) return;
    const page = Number(pageBtn.dataset.page);
    if (!Number.isNaN(page)) {
      questionViewState.page = page;
      renderQuestionsList();
    }
  });
}

function renderQuestionsList() {
  const container = document.querySelector("[data-questions-list]");
  const pagination = document.querySelector("[data-pagination]");
  if (!container || !cachedUser) return;

  const items = cachedUser.questions || [];
  const filtered = questionViewState.tag
    ? items.filter((q) => Array.isArray(q.tags) && q.tags.includes(questionViewState.tag))
    : items;
  const sorted = sortItems(filtered, questionViewState.sort);
  const totalPages = Math.max(1, Math.ceil(sorted.length / QUESTIONS_PER_PAGE));
  questionViewState.page = Math.min(questionViewState.page, totalPages);
  const start = (questionViewState.page - 1) * QUESTIONS_PER_PAGE;
  const visible = sorted.slice(start, start + QUESTIONS_PER_PAGE);

  container.innerHTML = "";
  visible.forEach((q) => container.appendChild(buildQuestionCard(q)));

  renderPagination(pagination, totalPages);
  updateQuestionsHero();
}

function renderPagination(container, totalPages) {
  if (!container) return;
  container.innerHTML = "";
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i += 1) {
    const btn = document.createElement("button");
    btn.className = `pagination__page${i === questionViewState.page ? " pagination__page--active" : ""}`;
    btn.type = "button";
    btn.dataset.page = i;
    btn.textContent = i;
    container.appendChild(btn);
  }
}

function updateQuestionsHero() {
  const accent = document.querySelector("[data-questions-title-accent]");
  const tagChip = document.querySelector("[data-active-tag]");
  const hero = document.querySelector("[data-questions-top]");

  const accentCopy = {
    newest: "My Recent",
    votes: "My Popular",
    oldest: "My Previous",
  };

  if (accent) {
    accent.textContent = accentCopy[questionViewState.sort] ?? "My Recent";
    accent.style.color = "#8567BA";
  }

  if (tagChip) {
    tagChip.textContent = questionViewState.tag ? `#${questionViewState.tag}` : "All tags";
  }

  applyTopBackground(hero, questionViewState.tag);
}

function applyTopBackground(heroEl, tag) {
  if (!heroEl) return;
  const colors = cachedUser?.tagBackgrounds || {};
  const defaultBg = "linear-gradient(135deg, rgba(38, 37, 57, 0.9), rgba(22, 22, 32, 0.9))";
  const background = tag && colors[tag] ? colors[tag] : defaultBg;
  heroEl.style.setProperty("--questions-top-bg", background);
  heroEl.classList.toggle("questions-top--tagged", Boolean(tag));
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

function buildQuestionCard(question) {
  const card = document.createElement("article");
  card.className = "question-card glass question-card--inline";

  const votes = formatNumber(question.votes ?? 0);
  const answers = formatNumber(question.answers ?? 0);
  const views = formatNumber(question.views ?? 0);
  const isClosed = question.is_closed || false;
  const closedBadge = isClosed ? '<span class="pill pill--muted" style="background: #ff6b6b; color: white; margin-left: 8px;">[Closed]</span>' : '';
  const summary = question.summary || '';
  const createdDate = question.created_at ? new Date(question.created_at).toLocaleDateString() : '';

  card.innerHTML = `
    <div class="question-card__stats">
      <div class="question-card__stat question-card__stat--votes">
        <span class="question-card__stat-number">${votes}</span>
        <span class="question-card__stat-label">votes</span>
      </div>
      <div class="question-card__stat question-card__stat--answers">
        <span class="question-card__stat-number">${answers}</span>
        <span class="question-card__stat-label">answers</span>
      </div>
      <div class="question-card__stat question-card__stat--views">
        <span class="question-card__stat-number">${views}</span>
        <span class="question-card__stat-label">views</span>
      </div>
    </div>
    <div class="question-card__body">
      <div class="question-card__title-row">
        <h3>${question.title}</h3>
        ${closedBadge}
      </div>
      ${summary ? `<p class="question-card__excerpt" style="margin: 8px 0; opacity: 0.8; font-size: 14px;">${summary}</p>` : ''}
      <div class="qa-card__tags" style="margin-top: 8px;">
        ${(question.tags || [])
      .map((tag) => `<span class="tag tag--pill" data-tag="${tag}">${tag}</span>`)
      .join("")}
      </div>
      ${createdDate ? `<div style="font-size: 12px; opacity: 0.6; margin-top: 8px;">Asked on ${createdDate}</div>` : ''}
    </div>
  `;

  if (question.url) {
    card.addEventListener("click", (event) => {
      const isTag = event.target.closest(".tag");
      if (isTag) {
        const tagName = isTag.dataset.tag;
        questionViewState.tag = tagName;
        questionViewState.page = 1;
        renderQuestionsList();
        return;
      }
      window.location.href = question.url;
    });
  }

  return card;
}

