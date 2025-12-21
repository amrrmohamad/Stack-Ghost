import { fetchUserData, fallbackUserData } from "./data.js";
import api from '../js/api.js';

let cachedUser = null;
let allQuestions = [];

document.addEventListener("DOMContentLoaded", async () => {
  // Show loading state
  showLoadingState();

  cachedUser = await loadUser();
  applyUserData(cachedUser);

  // Load questions
  await loadQuestions();

  setupPanelSwitching();
  setupFilters();
  setupNotificationDropdown();
  setupTagRemoval();
  setupLogout();
  setupNavigation();
  setupSearch();

  // Hide loading state
  hideLoadingState();
});

async function loadUser() {
  try {
    return await fetchUserData();
  } catch (error) {
    console.warn("Falling back to local user data", error);
    return fallbackUserData;
  }
}

async function loadQuestions() {
  try {
    const response = await api.getQuestions(1, 20);
    if (response.success && response.data) {
      allQuestions = response.data.map(q => {
        // Handle author object from API
        const authorObj = q.author || q.Author || {};
        const authorUsername = authorObj.username || 'Unknown';
        const authorId = authorObj.user_id || null;

        return {
          question_id: q.question_id,
          title: q.title,
          summary: q.summary,
          votes: q.score || 0,
          answers: q.answers_count || 0,
          views: q.views || 0,
          tags: q.tags || [],
          author: authorUsername,
          author_id: authorId,
          author_username: authorUsername,
          is_closed: q.is_closed,
          created_at: q.created_at,
          url: `../question_review/question.html?id=${q.question_id}`
        };
      });

      renderQuestionsGrid(allQuestions);
    }
  } catch (error) {
    console.error('Error loading questions:', error);
  }
}

function showLoadingState() {
  const main = document.querySelector('.content');
  if (main) {
    main.style.opacity = '0.5';
  }
}

function hideLoadingState() {
  const main = document.querySelector('.content');
  if (main) {
    main.style.opacity = '1';
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

function setupNavigation() {
  // Navigate to questions page
  const exploreBtn = document.querySelector('[data-nav="questions"]');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', () => {
      window.location.href = '../questions/index.html';
    });
  }

  // Navigate to ask question page
  const askBtn = document.querySelector('[data-nav="ask"]');
  if (askBtn) {
    askBtn.addEventListener('click', () => {
      window.location.href = '../ask/index.html';
    });
  }
}

function applyUserData(user) {
  // Update username in multiple places
  document.querySelectorAll("[data-username]").forEach((el) => {
    el.textContent = user.username;
  });

  // Update email
  document.querySelectorAll("[data-email]").forEach((el) => {
    el.textContent = user.email || 'Ghost explorer';
  });

  // Update reputation with animation
  document.querySelectorAll("[data-reputation]").forEach((el) => {
    animateNumber(el, 0, user.reputation, 1000);
  });

  // Update asked questions count
  document.querySelectorAll("[data-asked]").forEach((el) => {
    animateNumber(el, 0, user.asked, 1000);
  });

  // Update answered count
  document.querySelectorAll("[data-answered]").forEach((el) => {
    animateNumber(el, 0, user.answered, 1000);
  });

  // Set profile images
  setImage("profile-image", user.profileImage);
  setImage("profile-image-side", user.profileImage);

  // Render tags with follow functionality
  renderTagList("[data-tags]", user.tags);

  // Render notifications
  renderNotificationsList("[data-notifications]", user.notifications);
  renderNotificationsList("[data-notifications-dropdown]", user.notifications);
}

function animateNumber(element, start, end, duration) {
  const range = end - start;
  const increment = range / (duration / 16); // 60fps
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

function renderTagList(selector, tags) {
  const container = document.querySelector(selector);
  if (!container) return;
  container.innerHTML = '';

  tags.forEach(tag => {
    const pill = buildTagPill(tag);
    container.appendChild(pill);
  });
}

function renderNotificationsList(selector, notifications) {
  const container = document.querySelector(selector);
  if (!container) return;
  container.innerHTML = '';

  notifications.slice(0, 5).forEach(notification => {
    const item = buildNotificationItem(notification);
    container.appendChild(item);
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

function buildNotificationItem(notification) {
  const li = document.createElement("li");
  li.className = "list__item notification-item";
  li.style.cursor = "pointer";
  li.style.padding = "10px";
  li.style.borderRadius = "8px";
  li.style.transition = "background-color 0.2s ease";

  // Handle the notification content - it can be a string or JSON object
  let displayMessage = '';
  let notificationData = null;
  const content = notification.content || notification;

  try {
    // Try to parse as JSON (for structured notifications like follow)
    notificationData = typeof content === 'string' ? JSON.parse(content) : content;
    displayMessage = notificationData.message || content;
  } catch (e) {
    // It's a plain string notification
    displayMessage = content;
  }

  li.textContent = displayMessage;

  // Add hover effect
  li.addEventListener('mouseenter', () => {
    li.style.backgroundColor = 'rgba(133, 103, 186, 0.2)';
  });
  li.addEventListener('mouseleave', () => {
    li.style.backgroundColor = 'transparent';
  });

  // Add click handler for navigation and deletion
  li.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const notificationId = notification.notification_id;

    try {
      // Delete the notification
      if (notificationId) {
        await api.clickNotification(notificationId);
      }

      // Navigate based on notification type
      if (notificationData && notificationData.type === 'follow' && notificationData.follower_id) {
        window.location.href = `../profile/index.html?id=${notificationData.follower_id}`;
      } else if (notificationData && notificationData.question_id &&
        (notificationData.type === 'comment_on_question' ||
          notificationData.type === 'comment_on_answer' ||
          notificationData.type === 'new_answer')) {
        window.location.href = `../question_review/question.html?id=${notificationData.question_id}`;
      }

      // Remove the notification item from the UI
      li.remove();
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  });

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

function renderQuestionsGrid(questions) {
  const container = document.querySelector('.card-list');
  if (!container) return;

  container.innerHTML = '';

  // Show max 5 questions on home page
  const questionsToShow = questions.slice(0, 5);

  questionsToShow.forEach(q => {
    const card = buildQuestionCard(q);
    container.appendChild(card);
  });

  // If no questions, show empty state
  if (questionsToShow.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; opacity: 0.6;">
        <p>No questions yet. Be the first to ask!</p>
      </div>
    `;
  }
}

function buildQuestionCard(q) {
  const card = document.createElement('article');
  card.className = 'question-card glass';
  card.style.cursor = 'pointer';

  const statusBadge = q.is_closed ? ' <span style="color: #ff6b6b; font-size: 12px;">[closed]</span>' : '';
  const authorName = q.author_username || q.author || 'Unknown';
  const authorLink = q.author_id ? `../profile/index.html?id=${q.author_id}` : '#';
  const createdDate = q.created_at ? new Date(q.created_at).toLocaleDateString() : '';

  card.innerHTML = `
    <div class="question-card__stats">
      <div class="question-card__stat question-card__stat--votes">
        <span class="question-card__stat-number">${formatNumber(q.votes)}</span>
        <span class="question-card__stat-label">votes</span>
      </div>
      <div class="question-card__stat question-card__stat--answers">
        <span class="question-card__stat-number">${formatNumber(q.answers)}</span>
        <span class="question-card__stat-label">answers</span>
      </div>
      <div class="question-card__stat question-card__stat--views">
        <span class="question-card__stat-number">${formatNumber(q.views)}</span>
        <span class="question-card__stat-label">views</span>
      </div>
    </div>
    <div class="question-card__body">
      <h3>${q.title}${statusBadge}</h3>
      ${q.summary ? `<p style="margin: 8px 0; opacity: 0.8;">${q.summary}</p>` : ''}
      ${q.tags && q.tags.length > 0 ? `
        <div class="qa-card__tags" style="margin-top: 12px;">
          ${q.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      ` : ''}
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 8px; font-size: 13px; opacity: 0.7;">
        <span>👤</span>
        <a href="${authorLink}" style="color: #8567BA; text-decoration: none; font-weight: 500;" onclick="event.stopPropagation();">${authorName}</a>
        ${createdDate ? `<span style="margin-left: auto;">📅 ${createdDate}</span>` : ''}
      </div>
    </div>
  `;

  card.addEventListener('click', (e) => {
    // Don't navigate if clicking on author link
    if (e.target.closest('a')) {
      return;
    }
    window.location.href = q.url;
  });

  return card;
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

  container.addEventListener("click", async (event) => {
    const button = event.target.closest(".tag-remove-btn");
    if (!button) return;

    const tagEl = button.closest(".tag");
    if (tagEl && cachedUser) {
      const tagName = tagEl.textContent.replace('×', '').trim();

      try {
        // Find tag ID (would need to fetch from API in real implementation)
        // For now, just remove from UI
        tagEl.classList.add("tag--hidden");
        setTimeout(() => tagEl.remove(), 180);

        // Show feedback
        console.log(`Unfollowed tag: ${tagName}`);
      } catch (error) {
        console.error('Error unfollowing tag:', error);
        alert('Failed to unfollow tag. Please try again.');
      }
    }
  });
}

// Add search functionality with prefix-based search
// - question:keyword - searches questions by title
// - tag:keyword - searches tags
// - just keyword (no prefix) - searches users
function setupSearch() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  // Update placeholder to show syntax
  searchInput.placeholder = 'Search users, or question:title, tag:name';

  // Create search results dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'search-dropdown glass';
  dropdown.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 400px;
    overflow-y: auto;
    background: rgba(30, 25, 45, 0.98);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    z-index: 1000;
    display: none;
    margin-top: 8px;
  `;

  // Position the search container relatively
  const searchContainer = searchInput.closest('.search');
  if (searchContainer) {
    searchContainer.style.position = 'relative';
    searchContainer.appendChild(dropdown);
  }

  let searchTimeout;

  // Parse the search query for prefixes
  function parseSearchQuery(input) {
    const trimmed = input.trim();

    // Check for question: prefix
    if (trimmed.toLowerCase().startsWith('question:')) {
      return { type: 'question', query: trimmed.slice(9).trim() };
    }

    // Check for tag: prefix
    if (trimmed.toLowerCase().startsWith('tag:')) {
      return { type: 'tag', query: trimmed.slice(4).trim() };
    }

    // Default: search users
    return { type: 'user', query: trimmed };
  }

  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const rawQuery = e.target.value.trim();

    if (rawQuery.length < 2) {
      dropdown.style.display = 'none';
      renderQuestionsGrid(allQuestions);
      return;
    }

    const { type, query } = parseSearchQuery(rawQuery);

    if (query.length < 1) {
      dropdown.style.display = 'none';
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        let html = '';

        if (type === 'question') {
          // Search questions only
          const questionsRes = await api.searchQuestions(query, 1, 10).catch(err => {
            console.error('Questions search error:', err);
            return { success: false, data: [] };
          });

          const questions = questionsRes.success && questionsRes.data ? questionsRes.data : [];

          if (questions.length > 0) {
            html += `<div class="search-section">
              <div class="search-section-header" style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.1); color: #8567BA; font-weight: 600; font-size: 12px; text-transform: uppercase;">
                <span>📝 Questions matching "${query}"</span>
              </div>`;
            questions.forEach(q => {
              html += `<div class="search-item" data-type="question" data-id="${q.question_id}" style="padding: 12px 16px; cursor: pointer; transition: background 0.2s; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div style="font-weight: 500; color: white;">${q.title}</div>
                <div style="font-size: 12px; opacity: 0.6; margin-top: 4px;">
                  ${q.score || 0} votes · ${q.answers_count || 0} answers
                </div>
              </div>`;
            });
            html += `<div class="search-item search-view-all" data-type="questions-all" style="padding: 12px 16px; cursor: pointer; text-align: center; color: #8567BA; font-weight: 500;">
              View all questions →
            </div></div>`;

            // Also update main content
            const searchResults = questions.map(q => {
              const authorObj = q.author || q.Author || {};
              return {
                question_id: q.question_id,
                title: q.title,
                summary: q.summary,
                votes: q.score || 0,
                answers: q.answers_count || 0,
                views: q.views || 0,
                tags: q.tags || [],
                author: authorObj.username || 'Unknown',
                author_id: authorObj.user_id || null,
                author_username: authorObj.username || 'Unknown',
                is_closed: q.is_closed,
                created_at: q.created_at,
                url: `../question_review/question.html?id=${q.question_id}`
              };
            });
            renderQuestionsGrid(searchResults);
          } else {
            html = `<div style="padding: 24px; text-align: center; opacity: 0.6;">
              No questions found for "${query}"
            </div>`;
          }

        } else if (type === 'tag') {
          // Search tags only
          const tagsRes = await api.getTags(1, 10, query).catch(err => {
            console.error('Tags search error:', err);
            return { success: false, tags: [] };
          });

          // API returns tags in 'tags' field, not 'data'
          const tags = tagsRes.success && tagsRes.tags ? tagsRes.tags : [];

          if (tags.length > 0) {
            html += `<div class="search-section">
              <div class="search-section-header" style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.1); color: #ffd43b; font-weight: 600; font-size: 12px; text-transform: uppercase;">
                <span>🏷️ Tags matching "${query}"</span>
              </div>`;
            tags.forEach(t => {
              const count = t._count?.Question_Tags || t.question_count || 0;
              html += `<div class="search-item" data-type="tag" data-id="${t.tag_id}" data-name="${t.tag_name}" style="padding: 12px 16px; cursor: pointer; transition: background 0.2s; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div style="font-weight: 500; color: white;">#${t.tag_name}</div>
                <div style="font-size: 12px; opacity: 0.6; margin-top: 4px;">
                  ${count} questions · ${t.description || 'No description'}
                </div>
              </div>`;
            });
            html += `<div class="search-item search-view-all" data-type="tags-all" style="padding: 12px 16px; cursor: pointer; text-align: center; color: #ffd43b; font-weight: 500;">
              View all tags →
            </div></div>`;
          } else {
            html = `<div style="padding: 24px; text-align: center; opacity: 0.6;">
              No tags found for "${query}"
            </div>`;
          }

        } else {
          // Default: search users
          const usersRes = await api.searchUsers(query, 1, 10).catch(err => {
            console.error('Users search error:', err);
            return { success: false, data: [] };
          });

          const users = usersRes.success && usersRes.data ? usersRes.data : [];

          if (users.length > 0) {
            html += `<div class="search-section">
              <div class="search-section-header" style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.1); color: #51cf66; font-weight: 600; font-size: 12px; text-transform: uppercase;">
                <span>👤 Users matching "${query}"</span>
              </div>`;
            users.forEach(u => {
              const reputation = u.reputation || 0;
              const role = u.Roles?.role_name || 'user';
              html += `<div class="search-item" data-type="user" data-id="${u.user_id}" style="padding: 12px 16px; cursor: pointer; transition: background 0.2s; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 12px;">
                <img src="${u.profile_image || '../signin,login/ghost.png'}" alt="${u.username}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;" onerror="this.src='../signin,login/ghost.png'">
                <div>
                  <div style="font-weight: 500; color: white;">${u.username}</div>
                  <div style="font-size: 12px; opacity: 0.6;">⭐ ${reputation} · ${role}</div>
                </div>
              </div>`;
            });
            html += `<div class="search-item search-view-all" data-type="users-all" style="padding: 12px 16px; cursor: pointer; text-align: center; color: #51cf66; font-weight: 500;">
              View all users →
            </div></div>`;
          } else {
            html = `<div style="padding: 24px; text-align: center; opacity: 0.6;">
              No users found for "${query}"
              <div style="margin-top: 8px; font-size: 12px;">
                Try <span style="color: #8567BA;">question:${query}</span> or <span style="color: #ffd43b;">tag:${query}</span>
              </div>
            </div>`;
          }
        }

        dropdown.innerHTML = html;
        dropdown.style.display = 'block';

        // Add hover effects
        dropdown.querySelectorAll('.search-item').forEach(item => {
          item.addEventListener('mouseenter', () => {
            item.style.background = 'rgba(133, 103, 186, 0.2)';
          });
          item.addEventListener('mouseleave', () => {
            item.style.background = 'transparent';
          });
        });

      } catch (error) {
        console.error('Search error:', error);
      }
    }, 300); // Debounce 300ms
  });

  // Handle search item clicks
  dropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.search-item');
    if (!item) return;

    const type = item.dataset.type;
    const id = item.dataset.id;
    const { query } = parseSearchQuery(searchInput.value);

    switch (type) {
      case 'question':
        window.location.href = `../question_review/question.html?id=${id}`;
        break;
      case 'user':
        window.location.href = `../profile/index.html?id=${id}`;
        break;
      case 'tag':
        window.location.href = `../tages/index.html?tag=${item.dataset.name}`;
        break;
      case 'questions-all':
        window.location.href = `../questions/index.html?q=${encodeURIComponent(query)}`;
        break;
      case 'users-all':
        window.location.href = `../users/index.html?q=${encodeURIComponent(query)}`;
        break;
      case 'tags-all':
        window.location.href = `../tages/index.html?q=${encodeURIComponent(query)}`;
        break;
    }

    dropdown.style.display = 'none';
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });

  // Close dropdown on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown.style.display = 'none';
      searchInput.blur();
    }
  });
}

