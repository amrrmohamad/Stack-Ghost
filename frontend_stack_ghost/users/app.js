import { fetchUserData, fallbackUserData, fetchUsers, fallbackUsers } from "./data.js";

let cachedUser = null;
let allUsers = [];
let activeFilter = "name";
let searchTerm = "";
let currentPage = 1;

const PAGE_SIZE = 24;

document.addEventListener("DOMContentLoaded", async () => {
  cachedUser = await loadUser();
  applyUserData(cachedUser);
  setupNotificationDropdown();

  allUsers = await loadUsers();
  initializeUserExperience();
});

async function loadUser() {
  try {
    return await fetchUserData();
  } catch (error) {
    console.warn("Falling back to local user data", error);
    return fallbackUserData;
  }
}

async function loadUsers() {
  try {
    const remoteUsers = await fetchUsers();
    return normalizeUsers(remoteUsers);
  } catch (error) {
    console.warn("Falling back to local user list", error);
    return normalizeUsers(fallbackUsers);
  }
}

function initializeUserExperience() {
  setupUserFilters();
  setupUserSearch();
  setupUserGridInteractions();
  applyUserView();
}

// -------------------------------
// Data helpers
// -------------------------------
function normalizeUsers(users) {
  return (users ?? []).map((user, index) => ({
    id: user.id ?? user.userId ?? `user-${index}`,
    username: user.username ?? user.name ?? "User",
    profileImage: user.profileImage ?? fallbackUserData.profileImage,
    reputation: Number(user.reputation ?? user.reputationScore ?? 0),
    role: user.role ?? user.title ?? "User",
    isFollowed: Boolean(user.isFollowed ?? user.followed ?? false),
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
// Users page interactions
// -------------------------------
function setupUserFilters() {
  const container = document.querySelector("[data-users-filter]");
  if (!container) return;

  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll("button").forEach((b) => b.classList.remove("filter-chip--active"));
      btn.classList.add("filter-chip--active");
      activeFilter = btn.dataset.filter || "name";
      currentPage = 1;
      applyUserView();
    });
  });
}

function setupUserSearch() {
  const input = document.querySelector("[data-user-search]");
  const suggestions = document.querySelector("[data-user-suggestions]");
  if (!input || !suggestions) return;

  input.addEventListener("input", () => {
    searchTerm = input.value.trim();
    currentPage = 1;
    renderUserSuggestions(suggestions, searchTerm);
    applyUserView();
  });

  suggestions.addEventListener("click", (event) => {
    const option = event.target.closest("[data-suggestion]");
    if (!option) return;
    const value = option.dataset.suggestion || "";
    const label = option.dataset.label || value;
    searchTerm = value;
    input.value = label;
    currentPage = 1;
    renderUserSuggestions(suggestions, "");
    applyUserView();
  });

  document.addEventListener("click", (event) => {
    if (suggestions.contains(event.target) || input.contains(event.target)) return;
    renderUserSuggestions(suggestions, "");
  });
}

function setupUserGridInteractions() {
  const grid = document.querySelector("[data-user-grid]");
  if (!grid) return;

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-follow-user]");
    if (!button) return;
    const userId = button.dataset.followUser;
    toggleUserFollow(userId);
  });
}

function renderUserSuggestions(container, query) {
  const normalized = (query || "").trim().toLowerCase();
  if (normalized.length < 3) {
    container.innerHTML = "";
    return;
  }

  const matches = allUsers
    .filter((user) => {
      const id = String(user.id ?? "").toLowerCase();
      const name = (user.username ?? "").toLowerCase();
      return name.includes(normalized) || id.includes(normalized);
    })
    .slice(0, 6);

  if (!matches.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = "";
  matches.forEach((user) => {
    const item = document.createElement("li");
    item.className = "suggestion";
    item.dataset.suggestion = String(user.id);
    item.dataset.label = user.username;
    item.textContent = `${user.username} · #${user.id}`;
    container.appendChild(item);
  });
}

function applyUserView() {
  const filtered = filterUsers(allUsers, searchTerm, activeFilter);
  const sorted = sortUsers(filtered);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  currentPage = Math.min(currentPage, totalPages);

  const paged = paginateUsers(sorted, currentPage, PAGE_SIZE);
  renderUserGrid(paged, !sorted.length);
  renderPagination(totalPages);
}

function filterUsers(users, query, filterKey) {
  const normalized = (query || "").trim().toLowerCase();
  return users.filter((user) => {
    const matchesQuery =
      !normalized ||
      (user.username ?? "").toLowerCase().includes(normalized) ||
      String(user.id ?? "").toLowerCase().includes(normalized);

    const role = (user.role ?? "User").toLowerCase();
    const matchesRole =
      filterKey === "moderator"
        ? role === "moderator"
        : filterKey === "admin"
        ? role === "admin"
        : true;

    return matchesQuery && matchesRole;
  });
}

function sortUsers(users) {
  const copy = [...users];
  return copy.sort((a, b) => (a.username ?? "").localeCompare(b.username ?? ""));
}

function paginateUsers(users, page, size) {
  const start = (page - 1) * size;
  const end = start + size;
  return users.slice(start, end);
}

function renderUserGrid(users, isEmpty) {
  const grid = document.querySelector("[data-user-grid]");
  const emptyState = document.querySelector("[data-user-empty]");
  if (!grid) return;

  grid.innerHTML = "";
  if (isEmpty) {
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");
  users.forEach((user) => {
    grid.appendChild(buildUserCard(user));
  });
}

function buildUserCard(user) {
  const card = document.createElement("article");
  card.className = "tag-card user-card glass";

  const header = document.createElement("div");
  header.className = "user-card__header";
  header.innerHTML = `
    <div class="avatar avatar--lg user-card__avatar">
      <img src="${user.profileImage}" alt="${user.username} profile" />
    </div>
    <div class="user-card__info">
      <span class="user-card__name">${user.username}</span>
      <div class="user-card__row">
        <span class="user-card__reputation">${formatNumber(user.reputation)} rep</span>
        <span class="user-card__role user-card__role--${(user.role ?? "user").toLowerCase()}">${user.role ?? "User"}</span>
      </div>
      <span class="user-card__id">id: ${user.id}</span>
    </div>
  `;

  const actions = document.createElement("div");
  actions.className = "user-card__actions";

  const followBtn = document.createElement("button");
  followBtn.type = "button";
  followBtn.dataset.followUser = user.id;
  followBtn.className = `user-card__follow-btn${user.isFollowed ? " user-card__follow-btn--checked" : ""}`;
  followBtn.setAttribute("aria-pressed", String(Boolean(user.isFollowed)));
  followBtn.textContent = user.isFollowed ? "✓ Following" : "Follow";

  actions.appendChild(followBtn);

  card.append(header, actions);
  return card;
}

function renderPagination(totalPages) {
  const container = document.querySelector("[data-user-pagination]");
  if (!container) return;

  container.innerHTML = "";
  if (totalPages <= 1) return;

  for (let page = 1; page <= totalPages; page += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `pagination__button${page === currentPage ? " pagination__button--active" : ""}`;
    button.textContent = page;
    button.addEventListener("click", () => {
      if (page === currentPage) return;
      currentPage = page;
      applyUserView();
    });
    container.appendChild(button);
  }
}

function toggleUserFollow(userId) {
  if (!userId) return;
  const current = allUsers.find((user) => user.id === userId);
  if (!current) return;

  const targetState = !current.isFollowed;
  updateLocalUser(userId, { isFollowed: targetState });
  applyUserView();
}

function updateLocalUser(userId, patch) {
  allUsers = allUsers.map((user) => {
    if (user.id !== userId) return user;
    return { ...user, ...patch };
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

