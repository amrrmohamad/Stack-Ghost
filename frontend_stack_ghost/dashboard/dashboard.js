// Dashboard Page JavaScript

import { fetchUserData, fallbackUserData } from "./data.js";

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
    cachedUser = await loadUser();
    applyUserData(cachedUser);
    setupNotificationDropdown();
    
    // Setup tabs
    setupTabs();
    
    // Render question queue
    renderQuestionQueue();
    
    // Render reports
    renderReports();
    
    console.log("Dashboard initialized successfully");
  } catch (error) {
    console.error("Error initializing dashboard:", error);
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
 * Render question queue
 */
let questionsCurrentPage = 1;
let questionsData = [];

function renderQuestionQueue(page = 1) {
  const container = document.querySelector("[data-questions-list]");
  const paginationContainer = document.querySelector("[data-questions-pagination]");
  if (!container) return;

  if (questionsData.length === 0) {
    questionsData = generateMockQuestions(12);
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
  card.addEventListener("click", () => {
    window.location.href = ROUTES.questionDetails(question.id);
  });

  card.innerHTML = `
    <div class="question-card__header">
      <h3 class="question-card__title">${escapeHtml(question.title)}</h3>
      <div class="question-card__actions">
        <button class="card-action-btn card-action-btn--accept" aria-label="Accept">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 4.5L6.75 12.75L3 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="card-action-btn card-action-btn--reject" aria-label="Reject">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="question-card__body">
      ${escapeHtml(question.body)}
    </div>
    <div class="question-card__user">
      <a href="${ROUTES.userProfile(question.userId)}" class="question-card__user-avatar question-card__user-link" onclick="event.stopPropagation()">
        <img src="${question.userImage}" alt="${escapeHtml(question.username)}" />
      </a>
      <div class="question-card__user-info">
        <span class="question-card__user-id">ID: ${escapeHtml(question.userId)}</span>
        <a href="${ROUTES.userProfile(question.userId)}" class="question-card__username question-card__user-link" onclick="event.stopPropagation()">${escapeHtml(question.username)}</a>
      </div>
    </div>
  `;

  // Prevent card click when clicking action buttons or user links
  const actionBtns = card.querySelectorAll(".card-action-btn");
  actionBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Visual only - no real logic
    });
  });

  // User links already have onclick="event.stopPropagation()" in HTML
  // But add it here too for safety
  const userLinks = card.querySelectorAll(".question-card__user-link");
  userLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  });

  return card;
}

/**
 * Generate mock report data
 */
function generateMockReports(count = 12) {
  const reports = [];
  const reasons = [
    "Inappropriate content",
    "Spam or promotional content",
    "Harassment or bullying",
    "Plagiarism",
    "Off-topic or irrelevant",
    "Duplicate question",
    "Low quality or unclear",
    "Violates community guidelines",
    "Contains personal information",
    "Misleading or false information",
    "Copyright violation",
    "Other violation",
  ];

  const reportingUsers = ["moderator1", "admin_user", "community_mod", "staff_member", "supervisor", "reviewer1", "moderator2", "admin2", "community_staff", "reviewer2", "moderator3", "admin3"];
  const reportedUsers = ["user123", "spammer_99", "troll_user", "violator_1", "bad_actor", "problem_user", "rule_breaker", "inappropriate_user", "spam_account", "harasser_1", "plagiarizer", "fake_account"];

  for (let i = 0; i < count; i++) {
    reports.push({
      id: `r${i + 1}`,
      questionId: `q${i + 1}`,
      reportingUser: reportingUsers[i % reportingUsers.length],
      reportedUser: reportedUsers[i % reportedUsers.length],
      reason: reasons[i % reasons.length],
      body: `This content violates our community guidelines. ${reasons[i % reasons.length]}. Please review and take appropriate action.`,
    });
  }

  return reports;
}

/**
 * Render reports
 */
let reportsCurrentPage = 1;
let reportsData = [];

function renderReports(page = 1) {
  const container = document.querySelector("[data-reports-list]");
  const paginationContainer = document.querySelector("[data-reports-pagination]");
  if (!container) return;

  if (reportsData.length === 0) {
    reportsData = generateMockReports(12);
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
  card.addEventListener("click", () => {
    window.location.href = ROUTES.questionDetails(report.questionId);
  });

  card.innerHTML = `
    <div class="report-card__header">
      <div class="report-card__users">
        <div class="report-card__user-row">
          <span class="report-card__user-label">Reporting:</span>
          <a href="${ROUTES.userProfile(report.reportingUser)}" class="report-card__user-value report-card__user-link" onclick="event.stopPropagation()">${escapeHtml(report.reportingUser)}</a>
        </div>
        <div class="report-card__user-row">
          <span class="report-card__user-label">Reported:</span>
          <a href="${ROUTES.userProfile(report.reportedUser)}" class="report-card__user-value report-card__user-link" onclick="event.stopPropagation()">${escapeHtml(report.reportedUser)}</a>
        </div>
      </div>
      <div class="report-card__action">
        <button class="card-action-btn card-action-btn--seen" aria-label="Mark as Seen">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 4.5L6.75 12.75L3 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="report-card__body">
      <strong>Reason:</strong> ${escapeHtml(report.reason)}<br />
      ${escapeHtml(report.body)}
    </div>
  `;

  // Prevent card click when clicking action button or user links
  const actionBtn = card.querySelector(".card-action-btn");
  if (actionBtn) {
    actionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Visual only - no real logic
    });
  }

  // User links already have onclick="event.stopPropagation()" in HTML
  // But add it here too for safety
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

