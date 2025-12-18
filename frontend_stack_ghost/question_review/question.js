// Question Page JavaScript

import { fetchUserData, fallbackUserData, fetchQuestionData } from "./data.js";

let currentQuestionId = null;
let cachedUser = null;
let questionData = null;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Get question ID from URL (e.g., question.html?id=123)
    const urlParams = new URLSearchParams(window.location.search);
    currentQuestionId = urlParams.get("id") || "1"; // Default to 1 if no ID provided

    console.log("Loading user data...");
    cachedUser = await loadUser();
    applyUserData(cachedUser);
    setupNotificationDropdown();
    
    console.log("Loading question data...", currentQuestionId);
    questionData = await loadQuestionData(currentQuestionId);
    console.log("Question data loaded:", questionData);
    
    if (!questionData) {
      console.error("No question data received!");
      return;
    }
    
    renderQuestionData(questionData);
    
    // Parse question and answer content (must be after rendering)
    parseAllContent();
    
    // Setup interactive features (must be after rendering dynamic content)
    setupVoting();
    setupComments();
    setupAddAnswer();
    
    console.log("Page initialized successfully");
  } catch (error) {
    console.error("Error initializing page:", error);
    // Show error message to user
    const content = document.querySelector(".content");
    if (content) {
      content.innerHTML = `
        <div class="glass" style="padding: 24px; text-align: center;">
          <h2>Error Loading Page</h2>
          <p>${error.message}</p>
          <p>Please check the console for more details.</p>
        </div>
      `;
    }
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
  document.querySelectorAll("[data-asked]").forEach((el) => {
    el.textContent = formatNumber(user.asked);
  });
  document.querySelectorAll("[data-answered]").forEach((el) => {
    el.textContent = formatNumber(user.answered);
  });

  setImage("profile-image", user.profileImage);
  setImage("profile-image-side", user.profileImage);

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

/**
 * Parse custom format tags: [BB]... [!BB], [UL]... [!UL], [CODE]... [!CODE]
 * Converts them to HTML: <strong>, <u>, <code>
 */
function parseContent(text) {
  if (!text) return "";
  
  // Parse [CODE]... [!CODE] blocks first (multiline)
  text = text.replace(/\[CODE\]([\s\S]*?)\[!CODE\]/g, (match, code) => {
    return `<code>${escapeHtml(code.trim())}</code>`;
  });
  
  // Parse [BB]... [!BB] (bold)
  text = text.replace(/\[BB\](.*?)\[!BB\]/g, '<strong>$1</strong>');
  
  // Parse [UL]... [!UL] (underline)
  text = text.replace(/\[UL\](.*?)\[!UL\]/g, '<u>$1</u>');
  
  return text;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function parseAllContent() {
  // Parse question body
  const questionBody = document.querySelector("[data-question-body]");
  if (questionBody) {
    const originalText = questionBody.textContent || questionBody.innerHTML;
    const parsed = parseContent(originalText);
    questionBody.innerHTML = `<div data-parsed>${parsed}</div>`;
  }
  
  // Parse all answer bodies
  document.querySelectorAll("[data-answer-body]").forEach((el) => {
    const originalText = el.textContent || el.innerHTML;
    const parsed = parseContent(originalText);
    el.innerHTML = `<div data-parsed>${parsed}</div>`;
  });
}

// Track vote states: 'up', 'down', or null
const voteStates = {
  question: null,
  answers: {}
};

/**
 * Setup voting functionality for questions and answers
 * Only allows one vote (upvote OR downvote) and highlights the selected button
 */
function setupVoting() {
  // Question voting - static elements, attach directly
  const questionUpvote = document.querySelector("[data-question-upvote]");
  const questionDownvote = document.querySelector("[data-question-downvote]");
  const questionVotes = document.querySelector("[data-question-votes]");
  
  if (questionUpvote && questionDownvote && questionVotes) {
    questionUpvote.addEventListener("click", () => {
      // If already upvoted, do nothing
      if (voteStates.question === 'up') return;
      
      // If downvoted, remove downvote first
      if (voteStates.question === 'down') {
        const current = parseInt(questionVotes.textContent) || 0;
        questionVotes.textContent = current + 1; // Remove downvote (+1) and add upvote (+1) = +2 total
        questionDownvote.classList.remove("vote-btn--active");
      } else {
        // New upvote
        const current = parseInt(questionVotes.textContent) || 0;
        questionVotes.textContent = current + 1;
      }
      
      // Set state and highlight
      voteStates.question = 'up';
      questionUpvote.classList.add("vote-btn--active");
      questionDownvote.classList.remove("vote-btn--active");
      questionDownvote.disabled = false;
      
      // Backend: Send upvote request for question ID
      // Example: fetch(`/api/questions/${currentQuestionId}/upvote`, { method: 'POST' })
    });
    
    questionDownvote.addEventListener("click", () => {
      // If already downvoted, do nothing
      if (voteStates.question === 'down') return;
      
      // If upvoted, remove upvote first
      if (voteStates.question === 'up') {
        const current = parseInt(questionVotes.textContent) || 0;
        questionVotes.textContent = current - 1; // Remove upvote (-1) and add downvote (-1) = -2 total
        questionUpvote.classList.remove("vote-btn--active");
      } else {
        // New downvote
        const current = parseInt(questionVotes.textContent) || 0;
        questionVotes.textContent = Math.max(0, current - 1);
      }
      
      // Set state and highlight
      voteStates.question = 'down';
      questionDownvote.classList.add("vote-btn--active");
      questionUpvote.classList.remove("vote-btn--active");
      questionUpvote.disabled = false;
      
      // Backend: Send downvote request for question ID
      // Example: fetch(`/api/questions/${currentQuestionId}/downvote`, { method: 'POST' })
    });
  }
  
  // Answer voting - use event delegation on answers container for dynamic elements
  const answersContainer = document.querySelector("[data-answers-list]");
  if (answersContainer) {
    // Use event delegation for answer voting (works with dynamically created elements)
    answersContainer.addEventListener("click", (e) => {
      const upvoteBtn = e.target.closest("[data-answer-upvote]");
      const downvoteBtn = e.target.closest("[data-answer-downvote]");
      
      if (upvoteBtn) {
        const answerId = upvoteBtn.getAttribute("data-answer-upvote");
        const votesEl = document.querySelector(`[data-answer-votes="${answerId}"]`);
        const downvoteBtnForAnswer = document.querySelector(`[data-answer-downvote="${answerId}"]`);
        
        if (votesEl) {
          // If already upvoted, do nothing
          if (voteStates.answers[answerId] === 'up') return;
          
          // If downvoted, remove downvote first
          if (voteStates.answers[answerId] === 'down') {
            const current = parseInt(votesEl.textContent) || 0;
            votesEl.textContent = current + 1; // Remove downvote (+1) and add upvote (+1) = +2 total
            if (downvoteBtnForAnswer) {
              downvoteBtnForAnswer.classList.remove("vote-btn--active");
            }
          } else {
            // New upvote
            const current = parseInt(votesEl.textContent) || 0;
            votesEl.textContent = current + 1;
          }
          
          // Set state and highlight
          voteStates.answers[answerId] = 'up';
          upvoteBtn.classList.add("vote-btn--active");
          if (downvoteBtnForAnswer) {
            downvoteBtnForAnswer.classList.remove("vote-btn--active");
          }
          
          // Backend: Send upvote request for answer ID
          // Example: fetch(`/api/answers/${answerId}/upvote`, { method: 'POST' })
        }
      }
      
      if (downvoteBtn) {
        const answerId = downvoteBtn.getAttribute("data-answer-downvote");
        const votesEl = document.querySelector(`[data-answer-votes="${answerId}"]`);
        const upvoteBtnForAnswer = document.querySelector(`[data-answer-upvote="${answerId}"]`);
        
        if (votesEl) {
          // If already downvoted, do nothing
          if (voteStates.answers[answerId] === 'down') return;
          
          // If upvoted, remove upvote first
          if (voteStates.answers[answerId] === 'up') {
            const current = parseInt(votesEl.textContent) || 0;
            votesEl.textContent = current - 1; // Remove upvote (-1) and add downvote (-1) = -2 total
            if (upvoteBtnForAnswer) {
              upvoteBtnForAnswer.classList.remove("vote-btn--active");
            }
          } else {
            // New downvote
            const current = parseInt(votesEl.textContent) || 0;
            votesEl.textContent = Math.max(0, current - 1);
          }
          
          // Set state and highlight
          voteStates.answers[answerId] = 'down';
          downvoteBtn.classList.add("vote-btn--active");
          if (upvoteBtnForAnswer) {
            upvoteBtnForAnswer.classList.remove("vote-btn--active");
          }
          
          // Backend: Send downvote request for answer ID
          // Example: fetch(`/api/answers/${answerId}/downvote`, { method: 'POST' })
        }
      }
    });
  }
}

/**
 * Setup comments show/hide functionality
 */
function setupComments() {
  // Question comments
  const showAllBtn = document.querySelector("[data-show-all-comments]");
  const questionComments = document.querySelector("[data-question-comments]");
  
  if (showAllBtn && questionComments && questionData) {
    let allCommentsShown = false;
    const originalComments = Array.from(questionComments.children);
    const allComments = questionData.comments || [];
    
    showAllBtn.addEventListener("click", () => {
      if (!allCommentsShown) {
        // Show all remaining comments
        const remainingComments = allComments.slice(2);
        remainingComments.forEach(commentData => {
          const commentEl = createCommentElement(commentData);
          questionComments.appendChild(commentEl);
        });
        showAllBtn.textContent = "Show less";
        allCommentsShown = true;
      } else {
        // Show only first 2 comments
        questionComments.innerHTML = "";
        originalComments.forEach(comment => {
          questionComments.appendChild(comment);
        });
        showAllBtn.textContent = "Show all";
        allCommentsShown = false;
      }
    });
  }
  
  // Answer comments - use event delegation
  const answersContainer = document.querySelector("[data-answers-list]");
  if (answersContainer) {
    answersContainer.addEventListener("click", (e) => {
      const showAllBtn = e.target.closest("[data-show-all-answer-comments]");
      if (!showAllBtn) return;
      
      const answerId = showAllBtn.getAttribute("data-show-all-answer-comments");
      const answerComments = document.querySelector(`[data-answer-comments="${answerId}"]`);
      
      if (answerComments && questionData) {
        const answer = questionData.answers.find(a => a.id === answerId);
        if (!answer) return;
        
        const isExpanded = showAllBtn.dataset.expanded === "true";
        
        if (!isExpanded) {
          // Show all comments
          const allAnswerComments = answer.comments || [];
          const remainingComments = allAnswerComments.slice(2);
          remainingComments.forEach(commentData => {
            const commentEl = createCommentElement(commentData);
            answerComments.appendChild(commentEl);
          });
          showAllBtn.textContent = "Show less";
          showAllBtn.dataset.expanded = "true";
        } else {
          // Show only first 2 comments
          const allComments = Array.from(answerComments.children);
          answerComments.innerHTML = "";
          allComments.slice(0, 2).forEach(comment => {
            answerComments.appendChild(comment);
          });
          showAllBtn.textContent = "Show all";
          showAllBtn.dataset.expanded = "false";
        }
      }
    });
  }
  
  // Setup comment submission
  setupCommentSubmission();
}

/**
 * Setup comment submission for questions and answers
 */
function setupCommentSubmission() {
  // Question comment submission
  const questionCommentInput = document.querySelector("[data-question-comment-input]");
  const questionCommentSubmit = document.querySelector("[data-submit-question-comment]");
  
  if (questionCommentInput && questionCommentSubmit) {
    const submitQuestionComment = () => {
      const commentText = questionCommentInput.value.trim();
      if (!commentText) return;
      
      // Backend: Submit comment
      // Example: fetch(`/api/questions/${currentQuestionId}/comments`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ text: commentText })
      // })
      
      // Add comment to UI
      const questionComments = document.querySelector("[data-question-comments]");
      const questionCommentsCount = document.querySelector("[data-question-comments-count]");
      
      const commentEl = document.createElement("div");
      commentEl.className = "comment";
      const now = new Date();
      commentEl.innerHTML = `
        <div class="comment-author">
          <span class="comment-author-name">${cachedUser?.username || "You"}</span>
          <span class="comment-time">just now</span>
        </div>
        <p class="comment-text">${escapeHtml(commentText)}</p>
      `;
      questionComments.insertBefore(commentEl, questionComments.firstChild);
      
      // Update count
      if (questionCommentsCount) {
        const currentCount = parseInt(questionCommentsCount.textContent.match(/\d+/)?.[0] || "0");
        questionCommentsCount.textContent = `${currentCount + 1} Comments`;
      }
      
      questionCommentInput.value = "";
    };
    
    questionCommentSubmit.addEventListener("click", submitQuestionComment);
    questionCommentInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        submitQuestionComment();
      }
    });
  }
  
  // Answer comment submission - use event delegation
  const answersContainer = document.querySelector("[data-answers-list]");
  if (answersContainer) {
    // Handle submit button clicks
    answersContainer.addEventListener("click", (e) => {
      const submitBtn = e.target.closest("[data-submit-answer-comment]");
      if (!submitBtn) return;
      
      const answerId = submitBtn.getAttribute("data-submit-answer-comment");
      const commentInput = document.querySelector(`[data-answer-comment-input="${answerId}"]`);
      const answerComments = document.querySelector(`[data-answer-comments="${answerId}"]`);
      const answerCommentsCount = document.querySelector(`[data-answer-comments-count="${answerId}"]`);
      
      if (commentInput && answerComments) {
        const commentText = commentInput.value.trim();
        if (!commentText) return;
        
        // Backend: Submit comment
        // Example: fetch(`/api/answers/${answerId}/comments`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ text: commentText })
        // })
        
        // Add comment to UI
        const commentEl = document.createElement("div");
        commentEl.className = "comment";
        commentEl.innerHTML = `
          <div class="comment-author">
            <span class="comment-author-name">${cachedUser?.username || "You"}</span>
            <span class="comment-time">just now</span>
          </div>
          <p class="comment-text">${escapeHtml(commentText)}</p>
        `;
        answerComments.insertBefore(commentEl, answerComments.firstChild);
        
        // Update count
        if (answerCommentsCount) {
          const currentCount = parseInt(answerCommentsCount.textContent.match(/\d+/)?.[0] || "0");
          answerCommentsCount.textContent = `${currentCount + 1} Comments`;
        }
        
        commentInput.value = "";
      }
    });
    
    // Handle Enter key for answer comment inputs
    answersContainer.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && e.target.matches("[data-answer-comment-input]")) {
        const answerId = e.target.getAttribute("data-answer-comment-input");
        const submitBtn = document.querySelector(`[data-submit-answer-comment="${answerId}"]`);
        if (submitBtn) {
          submitBtn.click();
        }
      }
    });
  }
}

/**
 * Setup Add Answer form with formatting tools
 */
function setupAddAnswer() {
  const toggleBtn = document.querySelector("[data-add-answer-toggle]");
  const form = document.querySelector("[data-add-answer-form]");
  const answerInput = document.querySelector("[data-answer-input]");
  const submitBtn = document.querySelector("[data-submit-answer]");
  const cancelBtn = document.querySelector("[data-cancel-answer]");
  const formatBtns = document.querySelectorAll("[data-format]");
  
  if (!toggleBtn || !form || !answerInput) return;
  
  // Toggle form visibility
  toggleBtn.addEventListener("click", () => {
    form.classList.toggle("add-answer-form--open");
    if (form.classList.contains("add-answer-form--open")) {
      answerInput.focus();
    }
  });
  
  // Formatting tools
  formatBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const format = btn.getAttribute("data-format");
      const start = answerInput.selectionStart;
      const end = answerInput.selectionEnd;
      const selectedText = answerInput.value.substring(start, end);
      const before = answerInput.value.substring(0, start);
      const after = answerInput.value.substring(end);
      
      let replacement = "";
      let newCursorPos = start;
      
      switch (format) {
        case "bold":
          replacement = `[BB]${selectedText}[!BB]`;
          newCursorPos = start + (selectedText ? replacement.length : 4);
          break;
        case "underline":
          replacement = `[UL]${selectedText}[!UL]`;
          newCursorPos = start + (selectedText ? replacement.length : 4);
          break;
        case "code":
          replacement = `[CODE]\n${selectedText}\n[!CODE]`;
          newCursorPos = start + (selectedText ? replacement.length : 7);
          break;
      }
      
      answerInput.value = before + replacement + after;
      answerInput.focus();
      answerInput.setSelectionRange(newCursorPos, newCursorPos);
    });
  });
  
  // Submit answer
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const answerText = answerInput.value.trim();
      if (!answerText) {
        alert("Please write an answer before submitting.");
        return;
      }
      
      // Backend: Submit answer
      // Example: 
      // fetch(`/api/questions/${currentQuestionId}/answers`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ body: answerText })
      // })
      
      console.log("Submitting answer:", answerText);
      alert("Answer submitted! (Backend integration needed)");
      
      // Reset form
      answerInput.value = "";
      form.classList.remove("add-answer-form--open");
    });
  }
  
  // Cancel
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      answerInput.value = "";
      form.classList.remove("add-answer-form--open");
    });
  }
}

/**
 * Load question data from backend
 */
async function loadQuestionData(questionId) {
  return await fetchQuestionData(questionId);
}

/**
 * Render question data to the page
 */
function renderQuestionData(data) {
  if (!data) {
    console.error("No data provided to renderQuestionData");
    return;
  }
  
  // Question title
  const titleEl = document.querySelector("[data-question-title]");
  if (titleEl && data.title) {
    titleEl.textContent = data.title;
  }
  
  // Question body
  const bodyEl = document.querySelector("[data-question-body]");
  if (bodyEl && data.body) {
    bodyEl.textContent = data.body;
  }
  
  // Question votes
  const votesEl = document.querySelector("[data-question-votes]");
  if (votesEl && data.votes !== undefined) {
    votesEl.textContent = formatNumber(data.votes);
  }
  
  // Question author
  const authorImageEl = document.querySelector("[data-question-author-image]");
  if (authorImageEl) authorImageEl.src = data.author.image;
  
  const authorNameEl = document.querySelector("[data-question-author-name]");
  if (authorNameEl) authorNameEl.textContent = data.author.name;
  
  const authorReputationEl = document.querySelector("[data-question-author-reputation]");
  if (authorReputationEl) authorReputationEl.textContent = formatNumber(data.author.reputation);
  
  const authorRoleEl = document.querySelector("[data-question-author-role]");
  if (authorRoleEl) {
    if (data.author.role) {
      authorRoleEl.textContent = data.author.role;
      authorRoleEl.style.display = "inline-block";
    } else {
      authorRoleEl.style.display = "none";
    }
  }
  
  // Question comments
  renderQuestionComments(data.comments);
  
  // Answers
  renderAnswers(data.answers);
  
  // Popular questions
  renderPopularQuestions(data.popularQuestions);
  
  // Sidebar tags (same as question tags)
  const sidebarTagsContainer = document.querySelector("[data-question-sidebar-tags]");
  if (sidebarTagsContainer) {
    sidebarTagsContainer.innerHTML = "";
    data.tags.forEach(tag => {
      const tagEl = document.createElement("a");
      tagEl.href = `questions.html?tag=${encodeURIComponent(tag)}`;
      tagEl.className = "tag tag--link";
      tagEl.textContent = tag;
      sidebarTagsContainer.appendChild(tagEl);
    });
  }
}

/**
 * Render question comments
 */
function renderQuestionComments(comments) {
  const commentsContainer = document.querySelector("[data-question-comments]");
  const commentsCountEl = document.querySelector("[data-question-comments-count]");
  const showAllBtn = document.querySelector("[data-show-all-comments]");
  
  if (!commentsContainer) return;
  
  commentsContainer.innerHTML = "";
  
  if (comments && comments.length > 0) {
    // Show first 2 comments
    const visibleComments = comments.slice(0, 2);
    visibleComments.forEach(comment => {
      const commentEl = createCommentElement(comment);
      commentsContainer.appendChild(commentEl);
    });
    
    // Update count
    if (commentsCountEl) {
      commentsCountEl.textContent = `${comments.length} Comment${comments.length !== 1 ? 's' : ''}`;
    }
    
    // Show "Show all" button if there are more than 2 comments
    if (showAllBtn && comments.length > 2) {
      showAllBtn.style.display = "inline-block";
    } else if (showAllBtn) {
      showAllBtn.style.display = "none";
    }
  } else {
    if (commentsCountEl) commentsCountEl.textContent = "0 Comments";
    if (showAllBtn) showAllBtn.style.display = "none";
  }
}

/**
 * Render answers
 */
function renderAnswers(answers) {
  const answersContainer = document.querySelector("[data-answers-list]");
  const answersCountEl = document.querySelector("[data-answers-count]");
  
  if (!answersContainer) return;
  
  answersContainer.innerHTML = "";
  
  if (answers && answers.length > 0) {
    // Update count
    if (answersCountEl) {
      answersCountEl.textContent = `${answers.length} Answer${answers.length !== 1 ? 's' : ''}`;
    }
    
    // Render first 3 answers
    const visibleAnswers = answers.slice(0, 3);
    visibleAnswers.forEach((answer) => {
      const answerEl = createAnswerElement(answer);
      answersContainer.appendChild(answerEl);
    });
  } else {
    if (answersCountEl) answersCountEl.textContent = "0 Answers";
  }
}

/**
 * Create answer element
 */
function createAnswerElement(answer) {
  const article = document.createElement("article");
  article.className = `answer-card glass${answer.accepted ? ' answer-card--accepted' : ''}`;
  
  const votesHtml = `
    <div class="answer-votes">
      <button class="vote-btn vote-btn--up" aria-label="Upvote" data-answer-upvote="${answer.id}">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 5L15 10H12V15H8V10H5L10 5Z" fill="currentColor"/>
        </svg>
      </button>
      <span class="vote-count" data-answer-votes="${answer.id}">${formatNumber(answer.votes)}</span>
      <button class="vote-btn vote-btn--down" aria-label="Downvote" data-answer-downvote="${answer.id}">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 15L5 10H8V5H12V10H15L10 15Z" fill="currentColor"/>
        </svg>
      </button>
      ${answer.accepted ? '<div class="accepted-badge">✓ Accepted</div>' : ''}
    </div>
  `;
  
  const commentsHtml = renderAnswerComments(answer.comments, answer.id);
  
  const contentHtml = `
    <div class="answer-content">
      <div class="answer-body" data-answer-body="${answer.id}">${escapeHtml(answer.body)}</div>
      <div class="answer-author">
        <div class="author-info">
          <div class="avatar avatar--sm">
            <img src="${answer.author.image}" alt="Author" data-answer-author-image="${answer.id}" />
          </div>
          <div class="author-details">
            <span class="author-name" data-answer-author-name="${answer.id}">${escapeHtml(answer.author.name)}</span>
            <div class="author-meta">
              <span class="author-reputation" data-answer-author-reputation="${answer.id}">${formatNumber(answer.author.reputation)}</span>
              ${answer.author.role ? `<span class="author-role">${escapeHtml(answer.author.role)}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
      <div class="answer-comments">
        <div class="comments-header">
          <span class="comments-count" data-answer-comments-count="${answer.id}">${answer.comments.length} Comment${answer.comments.length !== 1 ? 's' : ''}</span>
          ${answer.comments.length > 2 ? `<button class="btn btn--ghost btn--sm" data-show-all-answer-comments="${answer.id}">Show all</button>` : ''}
        </div>
        <div class="comments-list" data-answer-comments="${answer.id}">
          ${commentsHtml}
        </div>
        <div class="add-comment-form">
          <input 
            type="text" 
            class="comment-input" 
            placeholder="Add a comment..." 
            data-answer-comment-input="${answer.id}"
          />
          <button class="btn btn--primary btn--sm" data-submit-answer-comment="${answer.id}">Add</button>
        </div>
      </div>
    </div>
  `;
  
  article.innerHTML = votesHtml + contentHtml;
  return article;
}

/**
 * Render answer comments (first 2-3)
 */
function renderAnswerComments(comments, answerId) {
  if (!comments || comments.length === 0) return "";
  
  const visibleCount = comments.length > 2 ? 2 : comments.length;
  const visibleComments = comments.slice(0, visibleCount);
  
  return visibleComments.map(comment => {
    return `
      <div class="comment">
        <div class="comment-author">
          <span class="comment-author-name">${escapeHtml(comment.author)}</span>
          <span class="comment-time">${escapeHtml(comment.time)}</span>
        </div>
        <p class="comment-text">${escapeHtml(comment.text)}</p>
      </div>
    `;
  }).join("");
}

/**
 * Create comment element
 */
function createCommentElement(comment) {
  const div = document.createElement("div");
  div.className = "comment";
  div.innerHTML = `
    <div class="comment-author">
      <span class="comment-author-name">${escapeHtml(comment.author)}</span>
      <span class="comment-time">${escapeHtml(comment.time)}</span>
    </div>
    <p class="comment-text">${escapeHtml(comment.text)}</p>
  `;
  return div;
}

/**
 * Render popular questions
 */
function renderPopularQuestions(questions) {
  const container = document.querySelector("[data-popular-questions]");
  if (!container) return;
  
  container.innerHTML = "";
  
  if (questions && questions.length > 0) {
    questions.forEach(q => {
      const card = document.createElement("a");
      card.href = `question.html?id=${encodeURIComponent(q.id)}`;
      card.className = "popular-question-card";
      card.innerHTML = `<h4>${escapeHtml(q.title)}</h4>`;
      container.appendChild(card);
    });
  }
}


