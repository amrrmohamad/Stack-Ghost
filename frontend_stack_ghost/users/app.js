import { fetchUserData, fallbackUserData, fetchUsers, fallbackUsers } from "./data.js";
import api from '../js/api.js';

let cachedUser = null;
let allUsers = [];
let activeFilter = "name";
let searchTerm = "";
let currentPage = 1;

const PAGE_SIZE = 24;

document.addEventListener("DOMContentLoaded", async () => {
  // Show loading
  showLoadingState();
  
  cachedUser = await loadUser();
  applyUserData(cachedUser);
  setupNotificationDropdown();
  setupNavigation();
  setupLogout();

  allUsers = await loadUsers();
  initializeUserExperience();
  
  hideLoadingState();
});

function showLoadingState() {
  const grid = document.querySelector("[data-user-grid]");
  if (grid) {
    grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px;">Loading users...</div>';
  }
}

function hideLoadingState() {
  // Loading will be replaced by actual content
}

function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await api.logout();
    });
  }
}

function setupNavigation() {
  // Add navigation to other pages
  const homeLink = document.querySelector('[data-nav="home"]');
  if (homeLink) {
    homeLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '../home/index.html';
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
  // Sort by reputation (highest first) by default, then by username
  return copy.sort((a, b) => {
    const repDiff = (b.reputation ?? 0) - (a.reputation ?? 0);
    if (repDiff !== 0) return repDiff;
    return (a.username ?? "").localeCompare(b.username ?? "");
  });
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
  card.style.cursor = 'pointer';

  // Role badge color
  const roleColors = {
    admin: '#ff6b6b',
    moderator: '#51cf66',
    user: '#339af0'
  };
  const roleColor = roleColors[user.role?.toLowerCase()] || roleColors.user;
  
  // Status indicator
  const statusBadge = user.isActive === false 
    ? '<span style="color: #ff6b6b; font-size: 11px; margin-left: 8px;">(Inactive)</span>' 
    : '';

  const header = document.createElement("div");
  header.className = "user-card__header";
  header.innerHTML = `
    <div class="avatar avatar--lg user-card__avatar">
      <img src="${user.profileImage}" alt="${user.username} profile" onerror="this.src='../signin,login/ghost.png'" />
    </div>
    <div class="user-card__info">
      <span class="user-card__name">${user.username}${statusBadge}</span>
      <div class="user-card__row">
        <span class="user-card__reputation" style="color: #ffd43b;">⭐ ${formatNumber(user.reputation)}</span>
        <span class="user-card__role" style="background: ${roleColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: capitalize;">
          ${user.role ?? "User"}
        </span>
      </div>
      <span class="user-card__id" style="font-size: 12px; opacity: 0.6;">ID: #${user.id}</span>
      ${user.questionsCount !== undefined ? `
        <div style="font-size: 12px; margin-top: 4px; opacity: 0.8;">
          <span>📝 ${user.questionsCount} questions</span>
          <span style="margin-left: 12px;">💬 ${user.answersCount} answers</span>
        </div>
      ` : ''}
    </div>
  `;

  const actions = document.createElement("div");
  actions.className = "user-card__actions";

  // Don't show follow button for yourself
  if (user.id !== cachedUser?.user_id) {
    const followBtn = document.createElement("button");
    followBtn.type = "button";
    followBtn.dataset.followUser = user.id;
    followBtn.className = `user-card__follow-btn${user.isFollowed ? " user-card__follow-btn--checked" : ""}`;
    followBtn.setAttribute("aria-pressed", String(Boolean(user.isFollowed)));
    followBtn.textContent = user.isFollowed ? "✓ Following" : "Follow";
    actions.appendChild(followBtn);
  } else {
    const youBadge = document.createElement("span");
    youBadge.style.cssText = 'background: #8567BA; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px;';
    youBadge.textContent = 'You';
    actions.appendChild(youBadge);
  }

  card.append(header, actions);
  
  // Click card to view user profile
  card.addEventListener('click', (e) => {
    // Don't navigate if clicking the follow button
    if (e.target.closest('[data-follow-user]')) return;
    window.location.href = `../profile/index.html?id=${user.id}`;
  });
  
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

async function toggleUserFollow(userId) {
  if (!userId) return;
  const current = allUsers.find((user) => user.id === userId);
  if (!current) return;

  const targetState = !current.isFollowed;
  
  try {
    // Call API to follow/unfollow
    const response = await api.toggleFollowUser(userId);
    
    if (response.success) {
      // Update local state
      updateLocalUser(userId, { isFollowed: targetState });
      applyUserView();
      
      // Show feedback
      const message = response.status === 'followed' ? 'Now following!' : 'Unfollowed';
      showToast(message);
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    showToast('Failed to update follow status', 'error');
  }
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${type === 'error' ? '#ff6b6b' : '#51cf66'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 9999;
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
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

