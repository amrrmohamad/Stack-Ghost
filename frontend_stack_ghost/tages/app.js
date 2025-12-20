import { fetchUserData, fallbackUserData, fetchTags, fallbackTags, updateFollowStatus } from "./data.js";
import api from '../js/api.js';

let cachedUser = null;
let allTags = [];
let activeSort = "popular";
let searchTerm = "";

document.addEventListener("DOMContentLoaded", async () => {
  showLoadingState();
  
  try {
    cachedUser = await loadUser();
    applyUserData(cachedUser);
    setupNotificationDropdown();
    setupLogout();
    setupNavigation();

    allTags = await loadTags();
    initializeTagExperience();
    
    hideLoadingState();
  } catch (error) {
    console.error('Error loading tags page:', error);
    hideLoadingState();
  }
});

function showLoadingState() {
  const grid = document.querySelector("[data-tag-grid]");
  if (grid) {
    grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; opacity: 0.6;">Loading tags...</div>';
  }
}

function hideLoadingState() {
  // Loading state will be replaced by actual tags
}

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
  // Render followed tags in sidebar
  renderFollowedTags();
}

// -------------------------------
// Data helpers
// -------------------------------
function normalizeTags(tags) {
  return (tags ?? []).map((tag, index) => ({
    id: tag.id ?? tag.tag_id ?? tag.name ?? `tag-${index}`,
    tag_id: tag.tag_id ?? tag.id,
    name: tag.name ?? tag.tag_name ?? tag.id ?? "tag",
    description: tag.description ?? "",
    questionCount: Number(tag.questionCount ?? tag.questions ?? 0),
    followers: Number(tag.followers ?? tag.followerCount ?? 0),
    isFollowed: Boolean(tag.isFollowed ?? tag.followed ?? false),
    createdAt: Number(tag.createdAt ?? tag.created_at ? new Date(tag.created_at).getTime() : Date.now() - index * 60000),
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
  
  // Render followed tags in the right sidebar
  renderFollowedTags();
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
    if (!button) {
      console.log('Click was not on follow button, target:', event.target);
      return;
    }
    
    event.preventDefault();
    event.stopPropagation();
    
    const tagId = button.dataset.followBtn;
    console.log('Follow button clicked for tag (from grid listener):', tagId);
    await toggleFollow(tagId);
  });
  
  console.log('Tag grid interactions set up');
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
      <span class="tag-card__name">🏷️ ${tag.name}</span>
      ${tag.isFollowed ? '<span class="tag-card__check" aria-hidden="true">✓</span>' : ""}
    </div>
    <div class="tag-card__meta">
      <span class="pill pill--muted">❓ ${formatNumber(tag.questionCount)} questions</span>
      <span class="pill pill--muted">👥 ${formatNumber(tag.followers)} followers</span>
    </div>
  `;

  const description = document.createElement("p");
  description.className = "tag-card__description";
  description.textContent = tag.description || "No description available.";

  const follow = document.createElement("div");
  follow.className = "tag-card__actions";

  const followBtn = document.createElement("button");
  followBtn.type = "button";
  followBtn.dataset.followBtn = tag.id ?? tag.tag_id;
  followBtn.className = `tag-card__follow-btn${tag.isFollowed ? " tag-card__follow-btn--checked" : ""}`;
  followBtn.setAttribute("aria-pressed", String(tag.isFollowed));
  followBtn.style.cssText = `
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid ${tag.isFollowed ? '#b38cf5' : 'rgba(255,255,255,0.2)'};
    background: ${tag.isFollowed ? 'rgba(179, 140, 245, 0.2)' : 'rgba(255,255,255,0.05)'};
    color: ${tag.isFollowed ? '#b38cf5' : 'white'};
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
  followBtn.innerHTML = tag.isFollowed ? '<span style="font-size: 16px;">✓</span> Following' : '<span style="font-size: 16px;">+</span> Follow';
  
  // Add direct click handler as backup
  followBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Direct click handler triggered for tag:', tag.id || tag.tag_id);
    await toggleFollow(tag.id || tag.tag_id);
  });
  
  // Add hover handlers
  if (tag.isFollowed) {
    followBtn.addEventListener('mouseenter', () => {
      if (!followBtn.disabled) {
        followBtn.style.background = 'rgba(255, 107, 107, 0.2)';
        followBtn.style.borderColor = '#ff6b6b';
        followBtn.style.color = '#ff6b6b';
        followBtn.innerHTML = '<span style="font-size: 16px;">✕</span> Unfollow';
      }
    });
    
    followBtn.addEventListener('mouseleave', () => {
      if (!followBtn.disabled) {
        followBtn.style.background = 'rgba(179, 140, 245, 0.2)';
        followBtn.style.borderColor = '#b38cf5';
        followBtn.style.color = '#b38cf5';
        followBtn.innerHTML = '<span style="font-size: 16px;">✓</span> Following';
      }
    });
  }

  follow.appendChild(followBtn);

  card.append(header, description, follow);
  return card;
}

async function toggleFollow(tagId) {
  if (!tagId) {
    console.error('toggleFollow: No tagId provided');
    return;
  }
  
  const tagIdStr = String(tagId);
  console.log('toggleFollow called with tagId:', tagIdStr);
  
  const current = allTags.find((tag) => 
    String(tag.id) === tagIdStr || 
    String(tag.tag_id) === tagIdStr
  );
  
  if (!current) {
    console.error('Tag not found in allTags:', tagIdStr);
    return;
  }

  const targetState = !current.isFollowed;
  console.log('Current follow state:', current.isFollowed, 'Target state:', targetState);
  
  // Optimistically update local state immediately
  updateLocalTag(tagIdStr, { isFollowed: targetState });
  
  // Update button immediately (before API call)
  const followBtn = document.querySelector(`[data-follow-btn="${tagIdStr}"]`);
  if (followBtn) {
    followBtn.disabled = true;
    followBtn.innerHTML = '<span style="opacity: 0.6;">...</span>';
  }
  
  // Re-render the view with updated state
  applyTagView();
  
  // Update followed tags in sidebar immediately
  renderFollowedTags();
  
  // Find the button again after re-render and update it immediately
  requestAnimationFrame(() => {
    const updatedBtn = document.querySelector(`[data-follow-btn="${tagIdStr}"]`);
    if (updatedBtn) {
      updatedBtn.disabled = true;
      if (targetState) {
        updatedBtn.innerHTML = '<span style="font-size: 16px;">✓</span> Following';
        updatedBtn.style.background = 'rgba(179, 140, 245, 0.2)';
        updatedBtn.style.borderColor = '#b38cf5';
        updatedBtn.style.color = '#b38cf5';
      } else {
        updatedBtn.innerHTML = '<span style="font-size: 16px;">+</span> Follow';
        updatedBtn.style.background = 'rgba(255,255,255,0.05)';
        updatedBtn.style.borderColor = 'rgba(255,255,255,0.2)';
        updatedBtn.style.color = 'white';
      }
      
      // Re-attach hover handlers
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
          updatedBtn.style.background = 'rgba(179, 140, 245, 0.2)';
          updatedBtn.style.borderColor = '#b38cf5';
          updatedBtn.style.color = '#b38cf5';
          updatedBtn.innerHTML = '<span style="font-size: 16px;">✓</span> Following';
        }
      });
    }
  });

  try {
    console.log('Calling API to toggle follow for tag:', tagIdStr);
    const updated = await updateFollowStatus(tagIdStr, targetState);
    console.log('Update follow status result:', updated);
    
    if (updated && updated.isFollowed !== undefined) {
      // Update with actual response state
      const actualState = updated.isFollowed;
      const patch = { isFollowed: actualState };
      if (updated.followers !== undefined) {
        patch.followers = updated.followers;
      }
      updateLocalTag(tagIdStr, patch);
      applyTagView();
      
      // Update button after API response
      requestAnimationFrame(() => {
        const finalBtn = document.querySelector(`[data-follow-btn="${tagIdStr}"]`);
        if (finalBtn) {
          finalBtn.disabled = false;
          if (actualState) {
            finalBtn.innerHTML = '<span style="font-size: 16px;">✓</span> Following';
            finalBtn.style.background = 'rgba(179, 140, 245, 0.2)';
            finalBtn.style.borderColor = '#b38cf5';
            finalBtn.style.color = '#b38cf5';
          } else {
            finalBtn.innerHTML = '<span style="font-size: 16px;">+</span> Follow';
            finalBtn.style.background = 'rgba(255,255,255,0.05)';
            finalBtn.style.borderColor = 'rgba(255,255,255,0.2)';
            finalBtn.style.color = 'white';
          }
        }
      });
      
      // Update sidebar
      renderFollowedTags();
    } else {
      throw new Error('Invalid response from API');
    }
  } catch (error) {
    console.error("Failed to update follow status, reverting", error);
    // Revert optimistic update
    updateLocalTag(tagIdStr, { isFollowed: !targetState });
    applyTagView();
    
    // Revert button on error
    requestAnimationFrame(() => {
      const errorBtn = document.querySelector(`[data-follow-btn="${tagIdStr}"]`);
      if (errorBtn) {
        errorBtn.disabled = false;
        const revertedState = !targetState;
        if (revertedState) {
          errorBtn.innerHTML = '<span style="font-size: 16px;">✓</span> Following';
          errorBtn.style.background = 'rgba(179, 140, 245, 0.2)';
          errorBtn.style.borderColor = '#b38cf5';
          errorBtn.style.color = '#b38cf5';
        } else {
          errorBtn.innerHTML = '<span style="font-size: 16px;">+</span> Follow';
          errorBtn.style.background = 'rgba(255,255,255,0.05)';
          errorBtn.style.borderColor = 'rgba(255,255,255,0.2)';
          errorBtn.style.color = 'white';
        }
      }
    });
    
    // Revert sidebar update on error
    renderFollowedTags();
  }
}

function updateLocalTag(tagId, patch) {
  const tagIdStr = String(tagId);
  allTags = allTags.map((tag) => {
    // Check all possible ID fields to find the correct tag
    const tagMatches = 
      String(tag.id) === tagIdStr || 
      String(tag.tag_id) === tagIdStr;
    
    if (!tagMatches) return tag;
    return { ...tag, ...patch };
  });
}

function renderFollowedTags() {
  const container = document.querySelector("[data-followed-tags]");
  if (!container) return;
  
  // Get all tags that are being followed
  const followedTags = allTags.filter(tag => tag.isFollowed === true);
  
  container.innerHTML = "";
  
  if (!followedTags || followedTags.length === 0) {
    container.innerHTML = '<span style="opacity: 0.6; padding: 10px; display: block;">No followed tags yet</span>';
    return;
  }
  
  followedTags.forEach(tag => {
    const pill = document.createElement("span");
    pill.className = "tag";
    pill.style.cursor = 'pointer';
    pill.textContent = tag.name;
    pill.title = tag.description || tag.name;
    
    // Click to scroll to tag in main grid (optional)
    pill.addEventListener('click', () => {
      // You could add functionality to scroll to the tag or filter by it
      const tagCard = document.querySelector(`[data-follow-btn="${tag.id || tag.tag_id}"]`)?.closest('.tag-card');
      if (tagCard) {
        tagCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight briefly
        tagCard.style.transition = 'box-shadow 0.3s';
        tagCard.style.boxShadow = '0 0 20px rgba(133, 103, 186, 0.5)';
        setTimeout(() => {
          tagCard.style.boxShadow = '';
        }, 2000);
      }
    });
    
    container.appendChild(pill);
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

function setupLogout() {
  const logoutBtn = document.getElementById("logout-btn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    api.clearTokens();
    window.location.href = "../signin,login/index.html";
  });
}

function setupNavigation() {
  // Navigation links are already set in HTML
  // This function can be used for additional navigation logic if needed
}

