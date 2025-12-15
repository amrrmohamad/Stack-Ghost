import { fetchUserData, fallbackUserData, fetchTags, fallbackTags, updateFollowStatus } from "./data.js";

let cachedUser = null;
let allTags = [];
let activeSort = "popular";
let searchTerm = "";

document.addEventListener("DOMContentLoaded", async () => {
  cachedUser = await loadUser();
  applyUserData(cachedUser);
  setupNotificationDropdown();

  allTags = await loadTags();
  initializeTagExperience();
});

async function loadUser() {
  try {
    return await fetchUserData();
  } catch (error) {
    console.warn("Falling back to local user data", error);
    return fallbackUserData;
  }
}

async function loadTags() {
  try {
    const remoteTags = await fetchTags();
    return normalizeTags(remoteTags);
  } catch (error) {
    console.warn("Falling back to local tag data", error);
    return normalizeTags(fallbackTags);
  }
}

function initializeTagExperience() {
  setupTagFilters();
  setupTagSearch();
  setupTagGridInteractions();
  applyTagView();
}

// -------------------------------
// Data helpers
// -------------------------------
function normalizeTags(tags) {
  return (tags ?? []).map((tag, index) => ({
    id: tag.id ?? tag.name ?? `tag-${index}`,
    name: tag.name ?? tag.id ?? "tag",
    description: tag.description ?? "",
    questionCount: Number(tag.questionCount ?? tag.questions ?? 0),
    followers: Number(tag.followers ?? tag.followerCount ?? 0),
    isFollowed: Boolean(tag.isFollowed ?? tag.followed ?? false),
    createdAt: Number(tag.createdAt ?? Date.now() - index * 60000),
  }));
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

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString() : value;
}

// -------------------------------
// Tag page interactions
// -------------------------------
function setupTagFilters() {
  const container = document.querySelector("[data-tags-filter]");
  if (!container) return;

  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll("button").forEach((b) => b.classList.remove("filter-chip--active"));
      btn.classList.add("filter-chip--active");
      activeSort = btn.dataset.sort || "popular";
      applyTagView();
    });
  });
}

function setupTagSearch() {
  const input = document.querySelector("[data-tag-search]");
  const suggestions = document.querySelector("[data-tag-suggestions]");
  if (!input || !suggestions) return;

  input.addEventListener("input", () => {
    searchTerm = input.value.trim();
    renderSuggestions(suggestions, searchTerm);
    applyTagView();
  });

  suggestions.addEventListener("click", (event) => {
    const option = event.target.closest("[data-suggestion]");
    if (!option) return;
    const value = option.dataset.suggestion || "";
    searchTerm = value;
    input.value = value;
    renderSuggestions(suggestions, "");
    applyTagView();
  });

  document.addEventListener("click", (event) => {
    if (suggestions.contains(event.target) || input.contains(event.target)) return;
    renderSuggestions(suggestions, "");
  });
}

function setupTagGridInteractions() {
  const grid = document.querySelector("[data-tag-grid]");
  if (!grid) return;

  grid.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-follow-btn]");
    if (!button) return;
    const tagId = button.dataset.followBtn;
    await toggleFollow(tagId);
  });
}

function renderSuggestions(container, query) {
  const normalized = query.toLowerCase();
  if (!normalized) {
    container.innerHTML = "";
    return;
  }

  const matches = allTags
    .filter((tag) => tag.name.toLowerCase().includes(normalized))
    .slice(0, 6);

  if (!matches.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = "";
  matches.forEach((tag) => {
    const item = document.createElement("li");
    item.className = "suggestion";
    item.dataset.suggestion = tag.name;
    item.textContent = tag.name;
    container.appendChild(item);
  });
}

function applyTagView() {
  const filtered = filterTags(allTags, searchTerm);
  const sorted = sortTags(filtered, activeSort);
  renderTagGrid(sorted);
}

function filterTags(tags, query) {
  const normalized = (query || "").toLowerCase();
  if (!normalized) return [...tags];
  return tags.filter((tag) => tag.name.toLowerCase().includes(normalized));
}

function sortTags(tags, sortKey) {
  const copy = [...tags];
  if (sortKey === "name") {
    return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
  if (sortKey === "new") {
    return copy.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }
  // default popular
  return copy.sort((a, b) => (b.questionCount ?? 0) - (a.questionCount ?? 0));
}

function renderTagGrid(tags) {
  const grid = document.querySelector("[data-tag-grid]");
  const emptyState = document.querySelector("[data-tag-empty]");
  if (!grid) return;

  grid.innerHTML = "";
  if (!tags.length) {
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");

  tags.forEach((tag) => {
    grid.appendChild(buildTagCard(tag));
  });
}

function buildTagCard(tag) {
  const card = document.createElement("article");
  card.className = "tag-card glass";

  const header = document.createElement("div");
  header.className = "tag-card__header";
  header.innerHTML = `
    <div class="tag-card__title">
      <span class="tag-card__name">${tag.name}</span>
      ${tag.isFollowed ? '<span class="tag-card__check" aria-hidden="true">✓</span>' : ""}
    </div>
    <div class="tag-card__meta">
      <span class="pill pill--muted">${formatNumber(tag.questionCount)} questions</span>
      <span class="pill pill--muted">${formatNumber(tag.followers)} followers</span>
    </div>
  `;

  const description = document.createElement("p");
  description.className = "tag-card__description";
  description.textContent = tag.description;

  const follow = document.createElement("div");
  follow.className = "tag-card__actions";

  const followBtn = document.createElement("button");
  followBtn.type = "button";
  followBtn.dataset.followBtn = tag.id;
  followBtn.className = `tag-card__follow-btn${tag.isFollowed ? " tag-card__follow-btn--checked" : ""}`;
  followBtn.setAttribute("aria-pressed", String(tag.isFollowed));
  followBtn.textContent = tag.isFollowed ? "✓" : "Follow";

  follow.appendChild(followBtn);

  card.append(header, description, follow);
  return card;
}

async function toggleFollow(tagId) {
  if (!tagId) return;
  const current = allTags.find((tag) => tag.id === tagId);
  if (!current) return;

  const targetState = !current.isFollowed;
  updateLocalTag(tagId, { isFollowed: targetState });
  applyTagView();

  try {
    const updated = await updateFollowStatus(tagId, targetState);
    if (updated) {
      const [normalized] = normalizeTags([updated]);
      updateLocalTag(tagId, normalized);
    }
  } catch (error) {
    console.warn("Failed to update follow status, reverting", error);
    updateLocalTag(tagId, { isFollowed: !targetState });
  }

  applyTagView();
}

function updateLocalTag(tagId, patch) {
  allTags = allTags.map((tag) => {
    if (tag.id !== tagId) return tag;
    return { ...tag, ...patch };
  });
}

// -------------------------------
// Shared UI helpers
// -------------------------------
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

