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

  // Load users after we have cachedUser so we can filter it out
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
    const normalized = normalizeUsers(remoteUsers);
    
    // Filter out current user if still present (double check on frontend)
    const currentUserId = cachedUser?.user_id;
    if (currentUserId) {
      return normalized.filter(user => user.id !== currentUserId && user.userId !== currentUserId);
    }
    
    return normalized;
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
    id: user.id ?? user.userId ?? user.user_id ?? `user-${index}`,
    userId: user.userId ?? user.user_id ?? user.id,
    user_id: user.user_id ?? user.userId ?? user.id,
    username: user.username ?? user.name ?? "User",
    profileImage: user.profileImage ?? user.profile_image ?? fallbackUserData.profileImage,
    reputation: Number(user.reputation ?? user.reputationScore ?? 0),
    role: user.role ?? user.title ?? user.Roles?.role_name ?? "User",
    isFollowed: Boolean(user.isFollowed ?? user.followed ?? false),
    questionsCount: user.questionsCount ?? user._count?.AuthoredQuestions ?? 0,
    answersCount: user.answersCount ?? user._count?.Answers ?? 0,
    isActive: user.isActive ?? user.is_active !== false,
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
    // Check if click is on follow button or its children
    const button = event.target.closest("[data-follow-user]");
    if (!button) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const userId = button.dataset.followUser;
    if (!userId) {
      console.error('No user ID found on follow button');
      return;
    }
    
    console.log('Follow button clicked for user:', userId);
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
  // Filter out current user as a final safety check
  const currentUserId = cachedUser?.user_id ?? cachedUser?.id;
  let usersToShow = allUsers;
  
  if (currentUserId) {
    usersToShow = allUsers.filter(user => 
      user.id !== currentUserId && 
      user.userId !== currentUserId && 
      user.user_id !== currentUserId
    );
  }
  
  const filtered = filterUsers(usersToShow, searchTerm, activeFilter);
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
  
  // Status indicator dot - green for active, red for inactive
  const isActive = user.isActive !== false; // Default to true if not specified
  const statusDotColor = isActive ? '#51cf66' : '#ff6b6b'; // Green for active, red for inactive
  const statusDot = `<span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${statusDotColor}; margin-left: 8px; vertical-align: middle; box-shadow: 0 0 0 2px rgba(255,255,255,0.3);"></span>`;

  const header = document.createElement("div");
  header.className = "user-card__header";
  header.innerHTML = `
    <div class="avatar avatar--lg user-card__avatar" style="position: relative;">
      <img src="${user.profileImage}" alt="${user.username} profile" onerror="this.src='../signin,login/ghost.png'" />
      <span style="position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px; border-radius: 50%; background: ${statusDotColor}; border: 2px solid white; box-shadow: 0 0 0 1px rgba(0,0,0,0.1);"></span>
    </div>
    <div class="user-card__info">
      <span class="user-card__name">${user.username}${statusDot}</span>
      <div class="user-card__row">
        <span class="user-card__reputation" style="color: #ffd43b;">⭐ ${formatNumber(user.reputation)}</span>
        <span class="user-card__role" style="background: ${roleColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: capitalize;">
          ${user.role ?? "User"}
        </span>
      </div>
      <span class="user-card__id" style="font-size: 12px; opacity: 0.6;">ID: #${user.id}</span>
    </div>
  `;

  const actions = document.createElement("div");
  actions.className = "user-card__actions";

  // Follow button (current user should already be filtered out, but just in case)
  const currentUserId = cachedUser?.user_id ?? cachedUser?.id;
  const userId = user.id ?? user.userId ?? user.user_id;
  
  if (String(userId) !== String(currentUserId)) {
    const followBtn = document.createElement("button");
    followBtn.type = "button";
    followBtn.dataset.followUser = String(userId);
    followBtn.className = `user-card__follow-btn${user.isFollowed ? " user-card__follow-btn--checked" : ""}`;
    followBtn.setAttribute("aria-pressed", String(Boolean(user.isFollowed)));
    followBtn.style.cssText = `
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid ${user.isFollowed ? '#51cf66' : 'rgba(255,255,255,0.2)'};
      background: ${user.isFollowed ? 'rgba(81, 207, 102, 0.2)' : 'rgba(255,255,255,0.05)'};
      color: ${user.isFollowed ? '#51cf66' : 'white'};
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 13px;
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    `;
    followBtn.innerHTML = user.isFollowed ? '<span style="font-size: 16px;">✓</span> Following' : '<span style="font-size: 16px;">+</span> Follow';
    
    // Add direct click handler as backup
    followBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Direct click handler triggered for user:', userId);
      toggleUserFollow(String(userId));
    });
    
    followBtn.addEventListener('mouseenter', () => {
      if (user.isFollowed && !followBtn.disabled) {
        followBtn.style.background = 'rgba(255, 107, 107, 0.2)';
        followBtn.style.borderColor = '#ff6b6b';
        followBtn.style.color = '#ff6b6b';
        followBtn.innerHTML = '<span style="font-size: 16px;">✕</span> Unfollow';
      }
    });
    
    followBtn.addEventListener('mouseleave', () => {
      if (user.isFollowed && !followBtn.disabled) {
        followBtn.style.background = 'rgba(81, 207, 102, 0.2)';
        followBtn.style.borderColor = '#51cf66';
        followBtn.style.color = '#51cf66';
        followBtn.innerHTML = '<span style="font-size: 16px;">✓</span> Following';
      }
    });
    
    actions.appendChild(followBtn);
  }

  card.append(header, actions);
  
  // Click card to view user profile
  card.addEventListener('click', (e) => {
    // Don't navigate if clicking the follow button or its children
    if (e.target.closest('[data-follow-user]')) {
      e.stopPropagation();
      return;
    }
    window.location.href = `../profile/index.html?id=${user.id ?? user.userId ?? user.user_id}`;
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
  if (!userId) {
    console.error('toggleUserFollow: No userId provided');
    return;
  }
  
  const userIdStr = String(userId);
  console.log('toggleUserFollow called with userId:', userIdStr);
  console.log('All users before update:', allUsers.map(u => ({ id: u.id, userId: u.userId, user_id: u.user_id, isFollowed: u.isFollowed })));
  
  const current = allUsers.find((user) => 
    String(user.id) === userIdStr || 
    String(user.userId) === userIdStr || 
    String(user.user_id) === userIdStr
  );
  
  if (!current) {
    console.error('User not found in allUsers:', userIdStr, 'Available IDs:', allUsers.map(u => ({ id: u.id, userId: u.userId, user_id: u.user_id })));
    showToast('User not found', 'error');
    return;
  }

  const targetState = !current.isFollowed;
  console.log('Found user:', { id: current.id, userId: current.userId, user_id: current.user_id, currentState: current.isFollowed, targetState });
  
  // Optimistically update local state immediately
  updateLocalUser(userIdStr, { isFollowed: targetState });
  console.log('Updated local user state. All users after update:', allUsers.map(u => ({ id: u.id, userId: u.userId, user_id: u.user_id, isFollowed: u.isFollowed })));
  
  // Update button immediately (before API call) - find it first
  const followBtn = document.querySelector(`[data-follow-user="${userIdStr}"]`);
  if (followBtn) {
    console.log('Found button for user:', userIdStr);
    followBtn.disabled = true;
    followBtn.innerHTML = '<span style="opacity: 0.6;">...</span>';
  } else {
    console.warn('Button not found for user:', userIdStr, 'Available buttons:', Array.from(document.querySelectorAll('[data-follow-user]')).map(b => b.dataset.followUser));
  }
  
  // Re-render the view with updated state
  applyUserView();
  
  // Find the button again after re-render and update it immediately with optimistic state
  // Use requestAnimationFrame to ensure DOM is updated
  requestAnimationFrame(() => {
    const updatedBtn = document.querySelector(`[data-follow-user="${userIdStr}"]`);
    if (updatedBtn) {
      console.log('Found updated button for user:', userIdStr);
      updatedBtn.disabled = true;
      if (targetState) {
        updatedBtn.innerHTML = '<span style="font-size: 16px;">✓</span> Following';
        updatedBtn.style.background = 'rgba(81, 207, 102, 0.2)';
        updatedBtn.style.borderColor = '#51cf66';
        updatedBtn.style.color = '#51cf66';
      } else {
        updatedBtn.innerHTML = '<span style="font-size: 16px;">+</span> Follow';
        updatedBtn.style.background = 'rgba(255,255,255,0.05)';
        updatedBtn.style.borderColor = 'rgba(255,255,255,0.2)';
        updatedBtn.style.color = 'white';
      }
      
      // Re-attach hover handlers with current state
      const currentFollowState = targetState;
      updatedBtn.addEventListener('mouseenter', function hoverEnter() {
        if (currentFollowState && !updatedBtn.disabled) {
          updatedBtn.style.background = 'rgba(255, 107, 107, 0.2)';
          updatedBtn.style.borderColor = '#ff6b6b';
          updatedBtn.style.color = '#ff6b6b';
          updatedBtn.innerHTML = '<span style="font-size: 16px;">✕</span> Unfollow';
        }
      });
      
      updatedBtn.addEventListener('mouseleave', function hoverLeave() {
        if (currentFollowState && !updatedBtn.disabled) {
          updatedBtn.style.background = 'rgba(81, 207, 102, 0.2)';
          updatedBtn.style.borderColor = '#51cf66';
          updatedBtn.style.color = '#51cf66';
          updatedBtn.innerHTML = '<span style="font-size: 16px;">✓</span> Following';
        }
      });
    }
  });
  
  try {
    console.log('Calling API to toggle follow for user:', userIdStr);
    // Call API to follow/unfollow
    const response = await api.toggleFollowUser(userIdStr);
    console.log('API response:', response);
    
    if (response.success) {
      // Update local state with actual response
      const actualState = response.status === 'followed';
      updateLocalUser(userIdStr, { isFollowed: actualState });
      console.log('Updated local user after API response. All users:', allUsers.map(u => ({ id: u.id, userId: u.userId, user_id: u.user_id, isFollowed: u.isFollowed })));
      applyUserView();
      
      // Update button after API response
      requestAnimationFrame(() => {
        const finalBtn = document.querySelector(`[data-follow-user="${userIdStr}"]`);
        if (finalBtn) {
          console.log('Found final button for user:', userIdStr);
          finalBtn.disabled = false;
          if (actualState) {
            finalBtn.innerHTML = '<span style="font-size: 16px;">✓</span> Following';
            finalBtn.style.background = 'rgba(81, 207, 102, 0.2)';
            finalBtn.style.borderColor = '#51cf66';
            finalBtn.style.color = '#51cf66';
          } else {
            finalBtn.innerHTML = '<span style="font-size: 16px;">+</span> Follow';
            finalBtn.style.background = 'rgba(255,255,255,0.05)';
            finalBtn.style.borderColor = 'rgba(255,255,255,0.2)';
            finalBtn.style.color = 'white';
          }
        }
      });
      
      // Show feedback
      const message = actualState ? 'Now following!' : 'Unfollowed';
      showToast(message);
    } else {
      // Revert on failure
      updateLocalUser(userIdStr, { isFollowed: !targetState });
      applyUserView();
      throw new Error(response.message || 'Failed to update follow status');
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    // Revert optimistic update
    updateLocalUser(userIdStr, { isFollowed: !targetState });
    applyUserView();
    
    // Revert button on error
    requestAnimationFrame(() => {
      const errorBtn = document.querySelector(`[data-follow-user="${userIdStr}"]`);
      if (errorBtn) {
        errorBtn.disabled = false;
        const revertedState = !targetState;
        if (revertedState) {
          errorBtn.innerHTML = '<span style="font-size: 16px;">✓</span> Following';
          errorBtn.style.background = 'rgba(81, 207, 102, 0.2)';
          errorBtn.style.borderColor = '#51cf66';
          errorBtn.style.color = '#51cf66';
        } else {
          errorBtn.innerHTML = '<span style="font-size: 16px;">+</span> Follow';
          errorBtn.style.background = 'rgba(255,255,255,0.05)';
          errorBtn.style.borderColor = 'rgba(255,255,255,0.2)';
          errorBtn.style.color = 'white';
        }
      }
    });
    
    showToast(error.message || 'Failed to update follow status', 'error');
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
  const userIdStr = String(userId);
  allUsers = allUsers.map((user) => {
    // Check all possible ID fields to find the correct user
    const userMatches = 
      String(user.id) === userIdStr || 
      String(user.userId) === userIdStr || 
      String(user.user_id) === userIdStr;
    
    if (!userMatches) return user;
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

