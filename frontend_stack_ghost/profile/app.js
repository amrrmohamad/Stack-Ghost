/**
 * @file app.js
 * @description Profile page with 4 tabs: Profile, Activity, Questions, Answers
 */

import { fetchUserData, fallbackUserData } from "./data.js";
import api from '../js/api.js';

let cachedUser = null;
let currentUserId = null;
let isOwnProfile = false;
const profileState = {
  questions: [],
  answers: [],
  filterTag: null,
  sort: { questions: "newest", answers: "newest" },
};
let activatePanel = () => {};

document.addEventListener("DOMContentLoaded", async () => {
  showLoadingState();
  
  try {
    cachedUser = await loadUser();
    currentUserId = cachedUser.user_id;
    
    // Check if viewing own profile
    const loggedInUser = api.getUser();
    isOwnProfile = loggedInUser?.user_id === currentUserId;
    
    applyUserData(cachedUser);
    
    // Setup all handlers
    activatePanel = setupTabs();
    setupNavigationShortcuts();
    setupSortControls();
    setupNotificationsDropdown();
    setupTagFilterBehavior();
    setupFollowButton();
    setupNavigation();
    setupLogout();
    
    hideLoadingState();
  } catch (error) {
    console.error('Error loading profile:', error);
    hideLoadingState();
  }
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

function showLoadingState() {
  const panels = document.querySelectorAll('.profile-panel');
  panels.forEach(panel => {
    panel.style.opacity = '0.5';
  });
}

function hideLoadingState() {
  const panels = document.querySelectorAll('.profile-panel');
  panels.forEach(panel => {
    panel.style.opacity = '1';
  });
}

function setupFollowButton() {
  const followBtn = document.querySelector('.profile-header__follow');
  if (!followBtn) return;
  
  if (isOwnProfile) {
    followBtn.style.display = 'none';
    return;
  }

  followBtn.style.display = 'block';
  
  // Update button state
  if (cachedUser.isFollowing === true) {
    followBtn.textContent = 'UNFOLLOW';
    followBtn.classList.add('btn--primary');
  } else {
    followBtn.textContent = 'FOLLOW';
    followBtn.classList.remove('btn--primary');
  }

  followBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    followBtn.disabled = true;
    followBtn.textContent = '...';

    try {
      const response = await api.toggleFollowUser(currentUserId);
      if (response.success) {
        cachedUser.isFollowing = response.status === 'followed';
        cachedUser.followers += response.status === 'followed' ? 1 : -1;
        
        // Update button
        if (cachedUser.isFollowing) {
          followBtn.textContent = 'UNFOLLOW';
          followBtn.classList.add('btn--primary');
        } else {
          followBtn.textContent = 'FOLLOW';
          followBtn.classList.remove('btn--primary');
        }
        
        // Update followers count
        document.querySelectorAll('[data-followers]').forEach(el => {
          animateNumber(el, parseInt(el.textContent.replace(/,/g, '')) || 0, cachedUser.followers, 500);
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to update follow status');
    } finally {
      followBtn.disabled = false;
    }
  });
}

function setupNavigation() {
  const homeLink = document.querySelector('[data-nav="home"]');
  if (homeLink) {
    homeLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '../home/index.html';
    });
  }
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

function applyUserData(user) {
  // Update username
  document.querySelectorAll("[data-username]").forEach((el) => {
    el.textContent = user.username;
  });

  // Update reputation with animation
  document.querySelectorAll("[data-reputation]").forEach((el) => {
    animateNumber(el, 0, user.reputation, 1000);
  });

  // Update stats
  document.querySelectorAll("[data-asked]").forEach((el) => {
    animateNumber(el, 0, user.asked, 1000);
  });

  document.querySelectorAll("[data-answered]").forEach((el) => {
    animateNumber(el, 0, user.answered, 1000);
  });

  document.querySelectorAll("[data-followers]").forEach((el) => {
    animateNumber(el, 0, user.followers, 1000);
  });

  document.querySelectorAll("[data-following]").forEach((el) => {
    animateNumber(el, 0, user.following, 1000);
  });

  // Update profile images
  setImage("profile-image", user.profileImage);
  setImage("profile-image-header", user.profileImage);

  // Update bio
  const aboutEl = document.querySelector("[data-about]");
  if (aboutEl) {
    aboutEl.textContent = user.bio || 'No bio yet.';
  }

  // Render badges
  renderBadges(user.badges);

  // Render question titles (posts)
  renderPosts(user.posts);

  // Render activity questions and answers (top 5)
  renderActivityQuestions((user.questions || []).slice(0, 5));
  renderActivityAnswers((user.answers || []).slice(0, 5));

  // Render followed tags
  renderFollowedTags(user.tagCards);

  // Store full lists for questions/answers tabs
  profileState.questions = user.questions || [];
  profileState.answers = user.answers || [];

  // Render full lists
  renderQuestionCards(profileState.questions, profileState.sort.questions);
  renderAnswerCards(profileState.answers, profileState.sort.answers);
  
  // Load and render notifications
  loadNotifications();
}

async function loadNotifications() {
  try {
    if (!currentUserId) return;
    
    const notificationsResponse = await api.getNotifications(currentUserId, 1, 5);
    if (notificationsResponse.success && notificationsResponse.data) {
      const notifications = notificationsResponse.data.map(n => n.content);
      renderNotifications(notifications);
    }
  } catch (error) {
    console.warn('Could not load notifications:', error);
  }
}

function renderNotifications(notifications) {
  const container = document.querySelector("[data-notifications-dropdown]");
  if (!container) return;
  container.innerHTML = '';
  
  if (!notifications || notifications.length === 0) {
    container.innerHTML = '<li class="list__item" style="opacity: 0.6;">No notifications</li>';
    return;
  }
  
  notifications.forEach(note => {
    const li = document.createElement("li");
    li.className = "list__item";
    li.textContent = note;
    container.appendChild(li);
  });
}

function animateNumber(element, start, end, duration) {
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      element.textContent = formatNumber(end);
      clearInterval(timer);
    } else {
      element.textContent = formatNumber(Math.floor(current));
    }
  }, 16);
}

function renderBadges(badges) {
  const container = document.querySelector("[data-badges]");
  if (!container) return;
  container.innerHTML = '';

  if (!badges || badges.length === 0) {
    container.innerHTML = '<p style="opacity: 0.6; padding: 20px; text-align: center;">No badges yet</p>';
    return;
  }

  badges.forEach(badge => {
    const wrapper = document.createElement("div");
    wrapper.className = "badge";

    const img = document.createElement("img");
    img.src = badge.icon || '../signin,login/ghost.png';
    img.alt = badge.badge_name;
    img.onerror = function() { this.style.display = 'none'; };

    const label = document.createElement("span");
    label.className = "badge__label";
    label.textContent = badge.badge_name;

    // Add badge type color
    const typeColors = {
      BRONZE: '#cd7f32',
      SILVER: '#c0c0c0',
      GOLD: '#ffd700'
    };
    wrapper.style.borderColor = typeColors[badge.badge_type] || '#8567BA';

    wrapper.append(img, label);
    container.appendChild(wrapper);
  });
}

function renderPosts(posts) {
  const container = document.querySelector("[data-posts]");
  if (!container) return;
  container.innerHTML = '';

  if (!posts || posts.length === 0) {
    container.innerHTML = '<p style="opacity: 0.6; padding: 20px; text-align: center;">No questions yet</p>';
    return;
  }

  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "post-card";
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="post-card__title">${post.title}</div>
      <div class="post-card__meta">by ${cachedUser.username}</div>
    `;
    if (post.url) {
      card.addEventListener("click", () => {
        window.location.href = post.url;
      });
    }
    container.appendChild(card);
  });
}

function renderFollowedTags(tags) {
  const container = document.querySelector("[data-tag-cards]");
  if (!container) return;
  container.innerHTML = '';

  if (!tags || tags.length === 0) {
    container.innerHTML = '<p style="opacity: 0.6; padding: 20px; text-align: center;">Not following any tags</p>';
    return;
  }

  tags.forEach(tag => {
    const link = document.createElement("a");
    link.className = "tag-card tag-card--vertical";
    link.href = tag.url || "#";
    link.dataset.tagName = tag.name;
    link.innerHTML = `
      <span class="tag-card__name">${tag.name}</span>
      <span class="tag-card__count-box">
        <span class="tag-card__count-number">${formatNumber(tag.posts)}</span>
        <span class="tag-card__count-label">Posts</span>
      </span>
    `;
    container.appendChild(link);
  });
}

function setImage(id, src) {
  const el = document.getElementById(id);
  if (el) {
    el.src = src;
    el.onerror = function() { this.style.display = 'none'; };
  }
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString() : value;
}

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

  if (sorted.length === 0) {
    container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; opacity: 0.6;">No questions yet</div>';
    return;
  }

  sorted.forEach((item) => {
    const card = document.createElement("article");
    card.className = "question-card glass";
    card.style.cursor = 'pointer';
    
    const closedBadge = item.is_closed ? '<span class="pill pill--muted" style="background: #ff6b6b;">[closed]</span>' : '';
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const tagsHtml = tags.map(tag => `<span class="pill pill--muted">${tag}</span>`).join('');

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
          ${closedBadge}
        </div>
        <p class="question-card__excerpt">${item.summary || ''}</p>
        <div class="question-card__tags">${tagsHtml}</div>
      </div>
    `;

    if (item.url) {
      card.addEventListener("click", () => {
        window.location.href = item.url;
      });
    }
    container.appendChild(card);
  });
}

function renderAnswerCards(items, sortKey = "newest") {
  const container = document.querySelector("[data-answers-full]");
  if (!container) return;

  const sorted = sortItems(items, sortKey);
  container.innerHTML = "";

  if (sorted.length === 0) {
    container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; opacity: 0.6;">No answers yet</div>';
    return;
  }

  sorted.forEach((item) => {
    const card = document.createElement("article");
    card.className = "question-card glass";
    card.style.cursor = 'pointer';
    
    const acceptedBadge = item.is_accepted ? '<span class="pill pill--muted" style="background: #51cf66;">✓ Accepted</span>' : '';

    card.innerHTML = `
      <div class="question-card__stats">
        <div class="question-card__stat question-card__stat--votes">
          <span class="question-card__stat-number">${formatNumber(item.votes ?? 0)}</span>
          <span class="question-card__stat-label">votes</span>
        </div>
      </div>
      <div class="question-card__body">
        <div class="question-card__title-row">
          <h3>${item.snippet || item.excerpt || 'Answer'}</h3>
          ${acceptedBadge}
        </div>
        <p class="question-card__excerpt">${item.excerpt || item.snippet || ''}</p>
        <div class="question-card__tags">
          <span class="pill pill--muted">Related: ${item.questionTitle || 'Question'}</span>
        </div>
      </div>
    `;

    if (item.url) {
      card.addEventListener("click", () => {
        window.location.href = item.url;
      });
    }
    container.appendChild(card);
  });
}

function sortItems(items, sortKey) {
  const clone = [...items];
  if (sortKey === "votes") {
    return clone.sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
  }

  const getDate = (item) => item.createdAt || new Date(item.created_at || 0).getTime();

  if (sortKey === "oldest") {
    return clone.sort((a, b) => getDate(a) - getDate(b));
  }

  // default newest
  return clone.sort((a, b) => getDate(b) - getDate(a));
}

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

function renderActivityQuestions(items = []) {
  const container = document.querySelector("[data-questions]");
  if (!container) return;
  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = '<div style="padding: 20px; text-align: center; opacity: 0.6;">No questions yet</div>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "qa-card qa-card--compact";
    card.style.cursor = 'pointer';
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
    if (item.url) {
      card.addEventListener("click", () => {
        window.location.href = item.url;
      });
    }
    container.appendChild(card);
  });
}

function renderActivityAnswers(items = []) {
  const container = document.querySelector("[data-answers]");
  if (!container) return;
  container.innerHTML = "";

  if (items.length === 0) {
    container.innerHTML = '<div style="padding: 20px; text-align: center; opacity: 0.6;">No answers yet</div>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "qa-card qa-card--compact";
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="qa-card__votes">
        <span class="qa-card__stat-number">${formatNumber(item.votes ?? 0)}</span>
        <span class="qa-card__stat-label">Votes</span>
      </div>
      <div class="qa-card__content">
        <div class="qa-card__title">${item.snippet || item.excerpt || 'Answer'}</div>
        <div class="qa-card__meta">${item.questionTitle || 'Question'}</div>
      </div>
    `;
    if (item.url) {
      card.addEventListener("click", () => {
        window.location.href = item.url;
      });
    }
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
