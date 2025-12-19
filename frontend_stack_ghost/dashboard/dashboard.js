// Dashboard Page JavaScript

import { fetchUserData, fallbackUserData, fetchAllQuestions, fetchAllReports, closeQuestion, updateReportStatus } from "./data.js";
import { showToast, showConfirm } from "../js/toast.js";

let cachedUser = null;

// Route-only navigation (no dependency on existing question/report pages).
// Change these patterns later to match your real router.
const ROUTES = {
  questionDetails: (questionId) => `#/questions/${encodeURIComponent(questionId)}`,
  userProfile: (userId) => `#/users/${encodeURIComponent(userId)}`,
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("Loading user data...");
    
    // Check if user has access (Admin or Moderator only)
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      alert('You must be logged in to access the dashboard.');
      window.location.href = '../signin,login/index.html';
      return;
    }
    
    // Fetch user and check role
    try {
      const userResponse = await fetch('http://localhost:3000/api/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await userResponse.json();
      const user = userData.data || userData;
      
      // Handle nested Roles object or direct role properties
      const userRole = user.Roles?.role_name || user.role_name || user.role || '';
      
      console.log('Dashboard access check - User:', user);
      console.log('Dashboard access check - Role:', userRole);
      
      // Only allow Admin and Moderator (case-insensitive)
      const roleLower = userRole.toLowerCase();
      if (roleLower !== 'admin' && roleLower !== 'moderator') {
        showToast('Access denied. This page is only accessible to Admins and Moderators.', 'error');
        setTimeout(() => {
          window.location.href = '../home/index.html';
        }, 2000);
        return;
      }
      
      console.log('✅ Access granted for role:', userRole);
    } catch (error) {
      console.error('Error checking user role:', error);
      showToast('Failed to verify access permissions.', 'error');
      setTimeout(() => {
        window.location.href = '../home/index.html';
      }, 2000);
      return;
    }
    
    console.log('Loading user data...');
    cachedUser = await loadUser();
    console.log('User data loaded:', cachedUser);
    
    console.log('Applying user data to UI...');
    applyUserData(cachedUser);
    
    console.log('Setting up notification dropdown...');
    setupNotificationDropdown();
    
    console.log('Setting up tabs...');
    setupTabs();
    
    console.log('Rendering question queue...');
    await renderQuestionQueue();
    
    console.log('Rendering reports...');
    await renderReports();
    
    console.log("✅ Dashboard initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing dashboard:", error);
    console.error("Error stack:", error.stack);
    alert(`Failed to initialize dashboard: ${error.message}`);
  }
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

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Setup tabs switching
 */
function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetTab = tab.getAttribute("data-tab");

      // Update active tab
      tabs.forEach((t) => t.classList.remove("tab--active"));
      tab.classList.add("tab--active");

      // Update active content
      tabContents.forEach((content) => {
        content.classList.remove("tab-content--active");
        if (content.getAttribute("data-tab-content") === targetTab) {
          content.classList.add("tab-content--active");
        }
      });
    });
  });
}

/**
 * Generate mock question data
 */
function generateMockQuestions(count = 12) {
  const questions = [];
  const titles = [
    "How to implement authentication in React?",
    "Best practices for TypeScript in Node.js",
    "Understanding React hooks lifecycle",
    "State management: Redux vs Context API",
    "How to optimize database queries?",
    "Docker container networking explained",
    "RESTful API design principles",
    "JavaScript async/await patterns",
    "CSS Grid vs Flexbox: when to use what?",
    "Git workflow for team collaboration",
    "Microservices architecture patterns",
    "Web security best practices",
  ];

  const bodies = [
    "I'm trying to implement authentication in my React application using JWT tokens. I've been following some tutorials but I'm not sure about the best practices.",
    "I want to migrate my Node.js project to TypeScript. What are the key considerations and best practices I should follow?",
    "I'm confused about when React hooks run and how they interact with the component lifecycle. Can someone explain?",
    "I'm starting a new project and need to decide between Redux and Context API for state management. What are the trade-offs?",
    "My database queries are slow. What are some optimization techniques I should consider?",
    "I'm having trouble understanding how Docker containers communicate with each other. Can someone explain the networking?",
    "I'm designing a RESTful API and want to make sure I'm following best practices. What should I consider?",
    "I'm learning async/await in JavaScript but sometimes get confused about error handling. Any tips?",
    "When should I use CSS Grid vs Flexbox? I'm not sure which one to choose for my layout.",
    "My team is having conflicts with Git. What workflow would help us collaborate better?",
    "I'm planning to break down my monolith into microservices. What architecture patterns should I consider?",
    "I want to make sure my web application is secure. What are the most important security practices?",
  ];

  const usernames = ["john_doe", "jane_smith", "mike_johnson", "sarah_williams", "david_lee", "emma_wilson", "chris_taylor", "alex_green", "lisa_brown", "tom_anderson", "amy_martinez", "ryan_clark"];

  for (let i = 0; i < count; i++) {
    questions.push({
      id: `q${i + 1}`,
      title: titles[i % titles.length],
      body: bodies[i % bodies.length],
      userId: `user${i + 1}`,
      username: usernames[i % usernames.length],
      userImage: "img/rafiki.png",
    });
  }

  return questions;
}

/**
 * Fetch questions from backend
 */
async function fetchQuestions() {
  try {
    const questions = await fetchAllQuestions();
    console.log('Fetched questions from backend:', questions.length);
    return questions;
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
}

/**
 * Fetch reports from backend
 */
async function fetchReports() {
  try {
    const reports = await fetchAllReports();
    console.log('Fetched reports from backend:', reports.length);
    return reports;
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
}

/**
 * Render question queue
 */
let questionsCurrentPage = 1;
let questionsData = [];

async function renderQuestionQueue(page = 1) {
  const container = document.querySelector("[data-questions-list]");
  const paginationContainer = document.querySelector("[data-questions-pagination]");
  const headerElement = document.querySelector("[data-tab-content='queue'] .section-header h2");
  
  if (!container) return;

  // Show loading state
  container.innerHTML = '<div style="text-align: center; padding: 40px; opacity: 0.6;">Loading questions...</div>';

  if (questionsData.length === 0) {
    questionsData = await fetchQuestions();
  }

  // Update header with count
  if (headerElement) {
    headerElement.textContent = `${questionsData.length} Questions`;
  }

  if (questionsData.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; opacity: 0.6;">No questions found.</div>';
    return;
  }

  const itemsPerPage = 10;
  const totalPages = Math.ceil(questionsData.length / itemsPerPage);
  questionsCurrentPage = Math.max(1, Math.min(page, totalPages));

  const start = (questionsCurrentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageQuestions = questionsData.slice(start, end);

  container.innerHTML = "";

  pageQuestions.forEach((question) => {
    const card = createQuestionCard(question);
    container.appendChild(card);
  });

  renderPagination(paginationContainer, questionsCurrentPage, totalPages, "questions");
}

/**
 * Create question card element
 */
function createQuestionCard(question) {
  const card = document.createElement("div");
  card.className = "question-card glass";
  
  // Add closed status indicator
  const closedBadge = question.is_closed ? '<span style="color: #ff6b6b; font-size: 12px; margin-left: 10px;">[CLOSED]</span>' : '';
  
  card.addEventListener("click", () => {
    window.location.href = `../question_review/question.html?id=${question.id}`;
  });

  const bodyText = question.body || 'No description available';
  const bodyPreview = bodyText.length > 200 ? bodyText.substring(0, 200) + '...' : bodyText;
  
  card.innerHTML = `
    <div class="question-card__header">
      <h3 class="question-card__title">${escapeHtml(question.title || 'Untitled')}${closedBadge}</h3>
      <div class="question-card__actions">
        <button class="card-action-btn card-action-btn--reject" aria-label="Close Question" data-action="close" data-question-id="${question.id}" ${question.is_closed ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="question-card__body">
      ${escapeHtml(bodyPreview)}
    </div>
    <div class="question-card__user">
      <a href="../profile/index.html?userId=${question.userId}" class="question-card__user-avatar question-card__user-link" onclick="event.stopPropagation()">
        <img src="${question.userImage || '../signin,login/ghost.png'}" alt="${escapeHtml(question.username || 'Unknown')}" onerror="this.src='../signin,login/ghost.png'" />
      </a>
      <div class="question-card__user-info">
        <span class="question-card__user-id">User ID: ${question.userId || 'N/A'}</span>
        <a href="../profile/index.html?userId=${question.userId}" class="question-card__username question-card__user-link" onclick="event.stopPropagation()">${escapeHtml(question.username || 'Unknown')}</a>
      </div>
    </div>
  `;

  // Handle close button click
  const closeBtn = card.querySelector("[data-action='close']");
  if (closeBtn && !question.is_closed) {
    closeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      
      showConfirm(
        `Are you sure you want to close this question: "${question.title}"?`,
        async () => {
          try {
            closeBtn.disabled = true;
            closeBtn.style.opacity = '0.5';
            await closeQuestion(question.id);
            showToast('Question closed successfully! 🔒', 'success');
            // Refresh questions list
            questionsData = [];
            await renderQuestionQueue(questionsCurrentPage);
          } catch (error) {
            showToast('Failed to close question. Please try again.', 'error');
            closeBtn.disabled = false;
            closeBtn.style.opacity = '1';
          }
        }
      );
    });
  }

  // User links already have onclick="event.stopPropagation()" in HTML
  const userLinks = card.querySelectorAll(".question-card__user-link");
  userLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  });

  return card;
}

/**
 * Render reports
 */
let reportsCurrentPage = 1;
let reportsData = [];

async function renderReports(page = 1) {
  const container = document.querySelector("[data-reports-list]");
  const paginationContainer = document.querySelector("[data-reports-pagination]");
  const headerElement = document.querySelector("[data-tab-content='reports'] .section-header h2");
  
  if (!container) return;

  // Show loading state
  container.innerHTML = '<div style="text-align: center; padding: 40px; opacity: 0.6;">Loading reports...</div>';

  if (reportsData.length === 0) {
    reportsData = await fetchReports();
  }

  // Update header with count
  if (headerElement) {
    headerElement.textContent = `${reportsData.length} Reports`;
  }

  if (reportsData.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; opacity: 0.6;">No reports found.</div>';
    return;
  }

  const itemsPerPage = 10;
  const totalPages = Math.ceil(reportsData.length / itemsPerPage);
  reportsCurrentPage = Math.max(1, Math.min(page, totalPages));

  const start = (reportsCurrentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageReports = reportsData.slice(start, end);

  container.innerHTML = "";

  pageReports.forEach((report) => {
    const card = createReportCard(report);
    container.appendChild(card);
  });

  renderPagination(paginationContainer, reportsCurrentPage, totalPages, "reports");
}

/**
 * Create report card element
 */
function createReportCard(report) {
  const card = document.createElement("div");
  card.className = "report-card glass";
  
  // Determine status badge color
  const statusColors = {
    'pending': '#ffa500',
    'reviewed': '#4caf50',
    'resolved': '#2196f3',
    'dismissed': '#9e9e9e'
  };
  const statusColor = statusColors[report.status] || '#ffa500';
  const statusBadge = `<span style="color: ${statusColor}; font-size: 12px; margin-left: 10px;">[${report.status.toUpperCase()}]</span>`;
  
  const targetUrl = report.questionId 
    ? `../question_review/question.html?id=${report.questionId}`
    : '#';
  
  card.addEventListener("click", () => {
    if (targetUrl !== '#') {
      window.location.href = targetUrl;
    }
  });

  card.innerHTML = `
    <div class="report-card__header">
      <div class="report-card__users">
        <div class="report-card__user-row">
          <span class="report-card__user-label">Reporting:</span>
          <span class="report-card__user-value">${escapeHtml(report.reportingUser)}</span>
        </div>
        <div class="report-card__user-row">
          <span class="report-card__user-label">Reported:</span>
          <span class="report-card__user-value">${escapeHtml(report.reportedUser)}</span>
        </div>
        <div class="report-card__user-row">
          <span class="report-card__user-label">Status:</span>
          ${statusBadge}
        </div>
      </div>
      <div class="report-card__action">
        <button class="card-action-btn card-action-btn--seen" aria-label="Mark as Reviewed" data-action="review" data-report-id="${report.id}" ${report.status !== 'pending' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 4.5L6.75 12.75L3 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="report-card__body">
      <strong>Reason:</strong> ${escapeHtml(report.reason)}<br />
      ${escapeHtml(report.body || 'No additional details provided.')}
    </div>
  `;

  // Handle review button click
  const reviewBtn = card.querySelector("[data-action='review']");
  if (reviewBtn && report.status === 'pending') {
    reviewBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      
      showConfirm(
        'Mark this report as reviewed?',
        async () => {
          try {
            reviewBtn.disabled = true;
            reviewBtn.style.opacity = '0.5';
            await updateReportStatus(report.id, 'reviewed');
            showToast('Report marked as reviewed! ✓', 'success');
            // Refresh reports list
            reportsData = [];
            await renderReports(reportsCurrentPage);
          } catch (error) {
            showToast('Failed to update report status. Please try again.', 'error');
            reviewBtn.disabled = false;
            reviewBtn.style.opacity = '1';
          }
        }
      );
    });
  }

  // User links
  const userLinks = card.querySelectorAll(".report-card__user-link");
  userLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  });

  return card;
}

/**
 * Render pagination
 */
function renderPagination(container, currentPage, totalPages, type) {
  if (!container || totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = "";

  // Previous button (if not on first page)
  if (currentPage > 1) {
    const prevBtn = createPaginationButton("←", currentPage - 1, type, false);
    container.appendChild(prevBtn);
  } else {
    const prevBtn = document.createElement("button");
    prevBtn.className = "pagination-btn pagination-btn--disabled";
    prevBtn.textContent = "←";
    prevBtn.type = "button";
    prevBtn.disabled = true;
    container.appendChild(prevBtn);
  }

  // Page numbers
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  // First page and ellipsis
  if (startPage > 1) {
    const firstBtn = createPaginationButton("1", 1, type, false);
    container.appendChild(firstBtn);
    if (startPage > 2) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination-ellipsis";
      ellipsis.textContent = "...";
      container.appendChild(ellipsis);
    }
  }

  // Page number buttons
  for (let i = startPage; i <= endPage; i++) {
    const btn = createPaginationButton(String(i), i, type, i === currentPage);
    container.appendChild(btn);
  }

  // Last page and ellipsis
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination-ellipsis";
      ellipsis.textContent = "...";
      container.appendChild(ellipsis);
    }
    const lastBtn = createPaginationButton(String(totalPages), totalPages, type, false);
    container.appendChild(lastBtn);
  }

  // Next button (if not on last page)
  if (currentPage < totalPages) {
    const nextBtn = createPaginationButton("→", currentPage + 1, type, false);
    container.appendChild(nextBtn);
  } else {
    const nextBtn = document.createElement("button");
    nextBtn.className = "pagination-btn pagination-btn--disabled";
    nextBtn.textContent = "→";
    nextBtn.type = "button";
    nextBtn.disabled = true;
    container.appendChild(nextBtn);
  }
}

/**
 * Create pagination button
 */
function createPaginationButton(text, page, type, isActive) {
  const btn = document.createElement("button");
  btn.className = `pagination-btn ${isActive ? "pagination-btn--active" : ""}`;
  btn.textContent = text;
  btn.type = "button";

  if (!isActive) {
    btn.addEventListener("click", () => {
      if (type === "questions") {
        renderQuestionQueue(page);
      } else if (type === "reports") {
        renderReports(page);
      }
    });
  }

  return btn;
}

