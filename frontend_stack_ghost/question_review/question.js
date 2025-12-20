// Question Page JavaScript

import { fetchUserData, fallbackUserData, fetchQuestionData } from "./data.js";
import api from '../js/api.js';

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
    console.log("Vote count in questionData:", questionData?.votes);

    if (!questionData) {
      console.error("No question data received!");
      return;
    }

    // Ensure vote count is set before rendering
    if (questionData.votes === undefined || questionData.votes === null) {
      console.warn('Vote count is missing, setting to 0');
      questionData.votes = 0;
    }

    renderQuestionData(questionData);

    // Initialize vote states from question data
    if (questionData && questionData.voteStatus) {
      voteStates.question = questionData.voteStatus;
    }

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

  // Prevent multiple rapid clicks
  let isVotingInProgress = false;

  if (questionUpvote && questionDownvote && questionVotes) {
    questionUpvote.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Check if already upvoted
      if (voteStates.question === 'up') {
        alert('You already voted up on this question');
        return;
      }

      // Prevent multiple rapid clicks
      if (isVotingInProgress || questionUpvote.disabled) {
        return;
      }

      // Disable both buttons immediately
      isVotingInProgress = true;
      questionUpvote.disabled = true;
      questionDownvote.disabled = true;

      const previousState = voteStates.question;

      // Backend: Send upvote request
      try {
        await api.vote(currentQuestionId, null, 1);

        // Fetch updated vote count from backend after voting
        const questionResponse = await api.getQuestionById(currentQuestionId);
        if (questionResponse.success && questionResponse.data) {
          const newVoteCount = questionResponse.data.vote_count || 0;
          questionVotes.textContent = newVoteCount;

          // Update vote state - now upvoted
          voteStates.question = 'up';
          questionUpvote.classList.add("vote-btn--active");
          questionDownvote.classList.remove("vote-btn--active");
        }
      } catch (error) {
        console.error('Error voting:', error);
        alert('Failed to vote. Please try again.');

        // Restore previous state on error
        voteStates.question = previousState;
        if (previousState === 'up') {
          questionUpvote.classList.add("vote-btn--active");
          questionDownvote.classList.remove("vote-btn--active");
        } else if (previousState === 'down') {
          questionDownvote.classList.add("vote-btn--active");
          questionUpvote.classList.remove("vote-btn--active");
        } else {
          questionUpvote.classList.remove("vote-btn--active");
          questionDownvote.classList.remove("vote-btn--active");
        }

        // Reload vote count from backend on error
        try {
          const questionResponse = await api.getQuestionById(currentQuestionId);
          if (questionResponse.success && questionResponse.data) {
            questionVotes.textContent = questionResponse.data.vote_count || 0;
          }
        } catch (reloadError) {
          console.error('Error reloading vote count:', reloadError);
        }
      } finally {
        isVotingInProgress = false;
        questionUpvote.disabled = false;
        questionDownvote.disabled = false;
      }
    });

    questionDownvote.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Check if already downvoted
      if (voteStates.question === 'down') {
        alert('You already voted down on this question');
        return;
      }

      // Prevent multiple rapid clicks
      if (isVotingInProgress || questionDownvote.disabled) {
        return;
      }

      // Disable both buttons immediately
      isVotingInProgress = true;
      questionUpvote.disabled = true;
      questionDownvote.disabled = true;

      const previousState = voteStates.question;

      // Backend: Send downvote request
      try {
        await api.vote(currentQuestionId, null, -1);

        // Fetch updated vote count from backend after voting
        const questionResponse = await api.getQuestionById(currentQuestionId);
        if (questionResponse.success && questionResponse.data) {
          const newVoteCount = questionResponse.data.vote_count || 0;
          questionVotes.textContent = newVoteCount;

          // Update vote state - now downvoted
          voteStates.question = 'down';
          questionDownvote.classList.add("vote-btn--active");
          questionUpvote.classList.remove("vote-btn--active");
        }
      } catch (error) {
        console.error('Error voting:', error);
        alert('Failed to vote. Please try again.');

        // Restore previous state on error
        voteStates.question = previousState;
        if (previousState === 'up') {
          questionUpvote.classList.add("vote-btn--active");
          questionDownvote.classList.remove("vote-btn--active");
        } else if (previousState === 'down') {
          questionDownvote.classList.add("vote-btn--active");
          questionUpvote.classList.remove("vote-btn--active");
        } else {
          questionUpvote.classList.remove("vote-btn--active");
          questionDownvote.classList.remove("vote-btn--active");
        }

        // Reload vote count from backend on error
        try {
          const questionResponse = await api.getQuestionById(currentQuestionId);
          if (questionResponse.success && questionResponse.data) {
            questionVotes.textContent = questionResponse.data.vote_count || 0;
          }
        } catch (reloadError) {
          console.error('Error reloading vote count:', reloadError);
        }
      } finally {
        isVotingInProgress = false;
        questionUpvote.disabled = false;
        questionDownvote.disabled = false;
      }
    });
  }

  // Answer voting - use event delegation on answers container for dynamic elements
  const answersContainer = document.querySelector("[data-answers-list]");
  if (answersContainer) {
    // Track voting in progress per answer to prevent multiple rapid clicks
    const answerVotingInProgress = {};

    // Use event delegation for answer voting (works with dynamically created elements)
    answersContainer.addEventListener("click", async (e) => {
      const upvoteBtn = e.target.closest("[data-answer-upvote]");
      const downvoteBtn = e.target.closest("[data-answer-downvote]");

      if (upvoteBtn) {
        e.preventDefault();
        e.stopPropagation();

        const answerId = upvoteBtn.getAttribute("data-answer-upvote");
        const downvoteBtnForAnswer = document.querySelector(`[data-answer-downvote="${answerId}"]`);

        // Prevent multiple rapid clicks
        if (answerVotingInProgress[answerId] || upvoteBtn.disabled) {
          return;
        }

        // Disable buttons immediately
        answerVotingInProgress[answerId] = true;
        upvoteBtn.disabled = true;
        if (downvoteBtnForAnswer) {
          downvoteBtnForAnswer.disabled = true;
        }

        const votesEl = document.querySelector(`[data-answer-votes="${answerId}"]`);

        if (votesEl) {
          const current = parseInt(votesEl.textContent) || 0;
          const previousState = voteStates.answers[answerId];
          let newCount = current;
          let newState = null;

          // If already upvoted, unvote (remove the vote)
          if (voteStates.answers[answerId] === 'up') {
            newCount = current - 1;
            newState = null;
            upvoteBtn.classList.remove("vote-btn--active");
          }
          // If downvoted, flip to upvote (+2 total: remove -1, add +1)
          else if (voteStates.answers[answerId] === 'down') {
            newCount = current + 2;
            newState = 'up';
            if (downvoteBtnForAnswer) {
              downvoteBtnForAnswer.classList.remove("vote-btn--active");
            }
            upvoteBtn.classList.add("vote-btn--active");
          }
          // New upvote
          else {
            newCount = current + 1;
            newState = 'up';
            upvoteBtn.classList.add("vote-btn--active");
            if (downvoteBtnForAnswer) {
              downvoteBtnForAnswer.classList.remove("vote-btn--active");
            }
          }

          // Optimistic UI update
          votesEl.textContent = newCount;
          voteStates.answers[answerId] = newState;

          // Backend: Send upvote request (backend handles unvote if same vote type)
          try {
            await api.vote(null, answerId, 1);
          } catch (error) {
            console.error('Error voting on answer:', error);
            // Revert UI on error
            votesEl.textContent = current;
            voteStates.answers[answerId] = previousState;
            if (previousState === 'up') {
              upvoteBtn.classList.add("vote-btn--active");
              if (downvoteBtnForAnswer) {
                downvoteBtnForAnswer.classList.remove("vote-btn--active");
              }
            } else if (previousState === 'down') {
              if (downvoteBtnForAnswer) {
                downvoteBtnForAnswer.classList.add("vote-btn--active");
              }
              upvoteBtn.classList.remove("vote-btn--active");
            } else {
              upvoteBtn.classList.remove("vote-btn--active");
              if (downvoteBtnForAnswer) {
                downvoteBtnForAnswer.classList.remove("vote-btn--active");
              }
            }
          } finally {
            answerVotingInProgress[answerId] = false;
            upvoteBtn.disabled = false;
            if (downvoteBtnForAnswer) {
              downvoteBtnForAnswer.disabled = false;
            }
          }
        }
      }

      if (downvoteBtn) {
        e.preventDefault();
        e.stopPropagation();

        const answerId = downvoteBtn.getAttribute("data-answer-downvote");

        // Prevent multiple rapid clicks
        if (answerVotingInProgress[answerId] || downvoteBtn.disabled) {
          return;
        }

        // Disable buttons immediately
        answerVotingInProgress[answerId] = true;
        downvoteBtn.disabled = true;
        const upvoteBtnForAnswer = document.querySelector(`[data-answer-upvote="${answerId}"]`);
        if (upvoteBtnForAnswer) {
          upvoteBtnForAnswer.disabled = true;
        }

        const votesEl = document.querySelector(`[data-answer-votes="${answerId}"]`);

        if (votesEl) {
          const current = parseInt(votesEl.textContent) || 0;
          const previousState = voteStates.answers[answerId];
          let newCount = current;
          let newState = null;

          // If already downvoted, unvote (remove the vote)
          if (voteStates.answers[answerId] === 'down') {
            newCount = Math.max(0, current + 1); // Remove downvote = +1
            newState = null;
            downvoteBtn.classList.remove("vote-btn--active");
          }
          // If upvoted, flip to downvote (-2 total: remove +1, add -1)
          else if (voteStates.answers[answerId] === 'up') {
            newCount = Math.max(0, current - 2);
            newState = 'down';
            if (upvoteBtnForAnswer) {
              upvoteBtnForAnswer.classList.remove("vote-btn--active");
            }
            downvoteBtn.classList.add("vote-btn--active");
          }
          // New downvote
          else {
            newCount = Math.max(0, current - 1);
            newState = 'down';
            downvoteBtn.classList.add("vote-btn--active");
            if (upvoteBtnForAnswer) {
              upvoteBtnForAnswer.classList.remove("vote-btn--active");
            }
          }

          // Optimistic UI update
          votesEl.textContent = newCount;
          voteStates.answers[answerId] = newState;

          // Backend: Send downvote request (backend handles unvote if same vote type)
          try {
            await api.vote(null, answerId, -1);
          } catch (error) {
            console.error('Error voting on answer:', error);
            // Revert UI on error
            votesEl.textContent = current;
            voteStates.answers[answerId] = previousState;
            if (previousState === 'up') {
              if (upvoteBtnForAnswer) {
                upvoteBtnForAnswer.classList.add("vote-btn--active");
              }
              downvoteBtn.classList.remove("vote-btn--active");
            } else if (previousState === 'down') {
              downvoteBtn.classList.add("vote-btn--active");
              if (upvoteBtnForAnswer) {
                upvoteBtnForAnswer.classList.remove("vote-btn--active");
              }
            } else {
              downvoteBtn.classList.remove("vote-btn--active");
              if (upvoteBtnForAnswer) {
                upvoteBtnForAnswer.classList.remove("vote-btn--active");
              }
            }
          } finally {
            answerVotingInProgress[answerId] = false;
            downvoteBtn.disabled = false;
            if (upvoteBtnForAnswer) {
              upvoteBtnForAnswer.disabled = false;
            }
          }
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
    const submitQuestionComment = async () => {
      const commentText = questionCommentInput.value.trim();
      if (!commentText) return;

      // Backend: Submit comment
      try {
        const response = await api.createComment(commentText, currentQuestionId, null);
        if (!response.success) {
          throw new Error(response.message || 'Failed to create comment');
        }
      } catch (error) {
        console.error('Error creating comment:', error);
        alert('Failed to add comment. Please try again.');
        return;
      }
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
    answersContainer.addEventListener("click", async (e) => {
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
        try {
          const response = await api.createComment(commentText, null, answerId);
          if (!response.success) {
            throw new Error(response.message || 'Failed to create comment');
          }
        } catch (error) {
          console.error('Error creating comment:', error);
          alert('Failed to add comment. Please try again.');
          return;
        }
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
 * Setup reporting functionality for questions and answers
 */
function setupReporting() {
  // Add report button to question
  const questionContent = document.querySelector(".question-content");
  if (questionContent) {
    const reportBtn = document.createElement("button");
    reportBtn.className = "btn btn--ghost btn--sm";
    reportBtn.style.marginTop = "12px";
    reportBtn.textContent = "Report";
    reportBtn.addEventListener("click", () => {
      showReportModal(currentQuestionId, null);
    });
    questionContent.appendChild(reportBtn);
  }

  // Add report buttons to answers using event delegation
  const answersContainer = document.querySelector("[data-answers-list]");
  if (answersContainer) {
    answersContainer.addEventListener("click", (e) => {
      const reportBtn = e.target.closest("[data-report-answer]");
      if (!reportBtn) return;

      const answerId = reportBtn.getAttribute("data-report-answer");
      showReportModal(null, answerId);
    });
  }
}

async function showReportModal(questionId, answerId) {
  const reason = prompt("Please provide a reason for reporting:");
  if (!reason || !reason.trim()) {
    return;
  }

  // Get current user
  let currentUser = null;
  try {
    const userResponse = await api.getCurrentUser();
    currentUser = userResponse.data;
  } catch (error) {
    alert("You must be logged in to report.");
    return;
  }

  if (!currentUser || !currentUser.user_id) {
    alert("You must be logged in to report.");
    return;
  }

  // Submit report - API expects userId in body
  try {
    const response = await api.request('/reports', {
      method: 'POST',
      body: JSON.stringify({
        userId: currentUser.user_id,
        reason: reason.trim(),
        questionId: questionId,
        answerId: answerId,
      }),
    });

    if (response.success) {
      alert("Report submitted successfully. Thank you for helping keep the community safe.");
    } else {
      throw new Error(response.message || 'Failed to submit report');
    }
  } catch (error) {
    console.error('Error submitting report:', error);
    alert('Failed to submit report. Please try again.');
  }
}

/**
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
    submitBtn.addEventListener("click", async () => {
      const answerText = answerInput.value.trim();
      if (!answerText) {
        alert("Please write an answer before submitting.");
        return;
      }

      // Backend: Submit answer
      try {
        const response = await api.createAnswer(currentQuestionId, answerText);
        if (!response.success) {
          throw new Error(response.message || 'Failed to submit answer');
        }

        // Reload page to show new answer
        window.location.reload();
      } catch (error) {
        console.error('Error submitting answer:', error);
        alert('Failed to submit answer. Please try again.');
      }
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
  console.log('Rendering question data:', {
    id: data.id,
    title: data.title,
    votes: data.votes,
    voteStatus: data.voteStatus
  });

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

  // Question votes - ensure it's always displayed
  const votesEl = document.querySelector("[data-question-votes]");
  if (votesEl) {
    // Ensure vote count is always a number, default to 0
    let voteCount = 0;
    if (data.votes !== undefined && data.votes !== null) {
      voteCount = Number(data.votes);
      // If conversion fails, default to 0
      if (isNaN(voteCount)) {
        voteCount = 0;
      }
    }
    votesEl.textContent = formatNumber(voteCount);
    console.log('Vote count set to:', voteCount, 'formatted:', formatNumber(voteCount));
  } else {
    console.error('Vote count element [data-question-votes] not found in DOM!');
  }

  // Update vote button states
  if (data.voteStatus) {
    voteStates.question = data.voteStatus;
    const questionUpvote = document.querySelector("[data-question-upvote]");
    const questionDownvote = document.querySelector("[data-question-downvote]");
    if (questionUpvote && questionDownvote) {
      if (data.voteStatus === 'up') {
        questionUpvote.classList.add("vote-btn--active");
      } else if (data.voteStatus === 'down') {
        questionDownvote.classList.add("vote-btn--active");
      }
    }
  }

  // Show views count if available
  if (data.views !== undefined) {
    const questionContent = document.querySelector(".question-content");
    if (questionContent) {
      const viewsEl = document.createElement("div");
      viewsEl.style.cssText = "font-size: 14px; opacity: 0.7; margin-top: 8px;";
      viewsEl.textContent = `${formatNumber(data.views)} views`;
      questionContent.insertBefore(viewsEl, questionContent.firstChild);
    }
  }

  // Show closed status if applicable
  if (data.is_closed) {
    const questionTitle = document.querySelector("[data-question-title]");
    if (questionTitle) {
      const closedBadge = document.createElement("span");
      closedBadge.className = "pill pill--muted";
      closedBadge.style.cssText = "background: #ff6b6b; color: white; margin-left: 12px;";
      closedBadge.textContent = "[Closed]";
      questionTitle.parentElement.appendChild(closedBadge);
    }
  }
  // Question author
  // Question tags
  const tagsContainer = document.querySelector("[data-question-tags]");
  if (tagsContainer && data.tags) {
    tagsContainer.innerHTML = "";
    data.tags.forEach(tag => {
      const tagEl = document.createElement("span");
      tagEl.className = "tag";
      tagEl.textContent = tag;
      tagsContainer.appendChild(tagEl);
    });
  }

  // Question author
  const authorImageEl = document.querySelector("[data-question-author-image]");
  if (authorImageEl && data.author.image) {
    authorImageEl.src = data.author.image;
    authorImageEl.onerror = function () {
      this.src = '../signin,login/ghost.png';
    };
  }

  const authorNameEl = document.querySelector("[data-question-author-name]");
  if (authorNameEl) authorNameEl.textContent = data.author.name || 'Unknown';

  const authorReputationEl = document.querySelector("[data-question-author-reputation]");
  if (authorReputationEl) authorReputationEl.textContent = formatNumber(data.author.reputation || 0);
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
      <div style="margin-top: 12px;">
        <button class="btn btn--ghost btn--sm" data-report-answer="${answer.id}">Report</button>
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


