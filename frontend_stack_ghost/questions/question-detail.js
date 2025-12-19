/**
 * @file question-detail.js
 * @description Question detail page functionality with voting, answers, and comments
 */
import api from '../js/api.js';

// State
let currentQuestion = null;
let currentAnswers = [];
let currentUser = null;
let userVoteStatus = null; // 1, -1, or null

// DOM Elements
const elements = {};

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!api.isAuthenticated()) {
        window.location.href = '../signin,login/index.html';
        return;
    }

    initializeElements();
    setupEventListeners();

    // Get question ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const questionId = urlParams.get('id');

    if (!questionId) {
        showError('No question ID provided');
        return;
    }

    await loadCurrentUser();
    await loadQuestion(parseInt(questionId));
});

function initializeElements() {
    elements.loadingState = document.getElementById('loading-state');
    elements.errorState = document.getElementById('error-state');
    elements.questionDetail = document.getElementById('question-detail');
    elements.answersSection = document.getElementById('answers-section');
    elements.postAnswerSection = document.getElementById('post-answer-section');

    // Question elements
    elements.questionTitle = document.getElementById('question-title');
    elements.questionBody = document.getElementById('question-body');
    elements.questionTags = document.getElementById('question-tags');
    elements.questionDate = document.getElementById('question-date');
    elements.questionViews = document.getElementById('question-views');
    elements.voteCount = document.getElementById('vote-count');
    elements.voteUpBtn = document.getElementById('vote-up-btn');
    elements.voteDownBtn = document.getElementById('vote-down-btn');

    // Author elements
    elements.authorName = document.getElementById('author-name');
    elements.authorImage = document.getElementById('author-image');
    elements.authorReputation = document.getElementById('author-reputation');

    // Comments
    elements.questionComments = document.getElementById('question-comments');
    elements.addQuestionCommentBtn = document.getElementById('add-question-comment-btn');
    elements.questionCommentForm = document.getElementById('question-comment-form');
    elements.questionCommentInput = document.getElementById('question-comment-input');
    elements.cancelQuestionComment = document.getElementById('cancel-question-comment');
    elements.submitQuestionComment = document.getElementById('submit-question-comment');

    // Answers
    elements.answersCount = document.getElementById('answers-count');
    elements.answersList = document.getElementById('answers-list');
    elements.answerBody = document.getElementById('answer-body');
    elements.submitAnswerBtn = document.getElementById('submit-answer-btn');

    // Action buttons
    elements.editQuestionBtn = document.getElementById('edit-question-btn');
    elements.shareBtn = document.getElementById('share-btn');
    elements.reportBtn = document.getElementById('report-btn');

    // Profile
    elements.profileImage = document.getElementById('profile-image');
    elements.logoutBtn = document.getElementById('logout-btn');
}

function setupEventListeners() {
    // Voting
    elements.voteUpBtn?.addEventListener('click', () => handleVote(1));
    elements.voteDownBtn?.addEventListener('click', () => handleVote(-1));

    // Question comments
    elements.addQuestionCommentBtn?.addEventListener('click', () => {
        elements.questionCommentForm.style.display = 'block';
        elements.addQuestionCommentBtn.style.display = 'none';
    });

    elements.cancelQuestionComment?.addEventListener('click', () => {
        elements.questionCommentForm.style.display = 'none';
        elements.addQuestionCommentBtn.style.display = 'inline';
        elements.questionCommentInput.value = '';
    });

    elements.submitQuestionComment?.addEventListener('click', () => submitQuestionComment());

    // Submit answer
    elements.submitAnswerBtn?.addEventListener('click', () => submitAnswer());

    // Answer sorting
    document.querySelectorAll('.answers-sort .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.answers-sort .filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
            btn.classList.add('filter-btn--active');
            const sort = btn.dataset.sort;
            renderAnswers(sort);
        });
    });

    // Toolbar buttons
    document.querySelectorAll('.post-answer-toolbar .toolbar-btn').forEach(btn => {
        btn.addEventListener('click', () => handleToolbarAction(btn.dataset.format));
    });

    // Action buttons
    elements.shareBtn?.addEventListener('click', handleShare);
    elements.editQuestionBtn?.addEventListener('click', handleEditQuestion);
    elements.reportBtn?.addEventListener('click', handleReport);

    // Logout
    elements.logoutBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        await api.logout();
    });
}

async function loadCurrentUser() {
    try {
        const response = await api.getCurrentUser();
        if (response.success) {
            currentUser = response.data;
            if (currentUser.profile_image) {
                elements.profileImage.src = currentUser.profile_image;
            }
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

async function loadQuestion(questionId) {
    try {
        showLoading();

        // Fetch question
        const response = await api.getQuestionById(questionId);

        if (!response.success || !response.data) {
            showError(response.message || 'Question not found');
            return;
        }

        currentQuestion = response.data;

        // Check vote status
        try {
            const voteResponse = await api.checkVoteStatus(questionId, null);
            userVoteStatus = voteResponse.data?.vote_type || null;
        } catch (e) {
            userVoteStatus = null;
        }

        // Fetch answers
        try {
            const answersResponse = await api.getAnswers(questionId, 1, 100);
            // API returns { success, data: [...answers...] }
            currentAnswers = answersResponse.data || [];
        } catch (e) {
            console.error('Error fetching answers:', e);
            currentAnswers = [];
        }

        // Fetch question comments
        try {
            const commentsResponse = await api.getComments(questionId, null);
            currentQuestion.comments = commentsResponse.data || [];
        } catch (e) {
            currentQuestion.comments = [];
        }

        renderQuestion();
        renderAnswers('votes');
        hideLoading();

    } catch (error) {
        console.error('Error loading question:', error);
        showError(error.message || 'Failed to load question');
    }
}

function renderQuestion() {
    if (!currentQuestion) return;

    // Title
    elements.questionTitle.textContent = currentQuestion.title;
    document.title = `${currentQuestion.title} - Stack Ghost`;

    // Body (render with basic markdown)
    elements.questionBody.innerHTML = renderMarkdown(currentQuestion.body || '');

    // Meta
    const createdDate = currentQuestion.created_at
        ? new Date(currentQuestion.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        })
        : 'Unknown date';
    elements.questionDate.textContent = `Asked on ${createdDate}`;
    elements.questionViews.textContent = `${currentQuestion.views_count || 0} views`;

    // Votes
    const voteScore = calculateVoteScore(currentQuestion.Votes || []);
    elements.voteCount.textContent = voteScore;
    updateVoteButtons();

    // Tags
    const tags = currentQuestion.Question_Tags || [];
    elements.questionTags.innerHTML = tags.map(qt =>
        `<span class="tag">${qt.Tags?.tag_name || qt.tag_name || 'tag'}</span>`
    ).join('');

    // Author
    const author = currentQuestion.Author || {};
    elements.authorName.textContent = author.username || 'Anonymous';
    elements.authorReputation.textContent = `${author.reputation || 0} reputation`;
    if (author.profile_image) {
        elements.authorImage.src = author.profile_image;
    }

    // Show edit button only for question owner
    const isOwner = currentUser && author.user_id === currentUser.user_id;
    if (elements.editQuestionBtn) {
        elements.editQuestionBtn.style.display = isOwner ? 'inline-flex' : 'none';
    }

    // Comments
    renderQuestionComments();
}

function calculateVoteScore(votes) {
    if (!Array.isArray(votes)) return 0;
    return votes.reduce((sum, vote) => sum + (vote.vote_type || 0), 0);
}

function updateVoteButtons() {
    elements.voteUpBtn.classList.toggle('vote-btn--active', userVoteStatus === 1);
    elements.voteDownBtn.classList.toggle('vote-btn--active', userVoteStatus === -1);
}

function renderQuestionComments() {
    const comments = currentQuestion.comments || currentQuestion.Comments || [];

    if (comments.length === 0) {
        elements.questionComments.innerHTML = '';
        return;
    }

    elements.questionComments.innerHTML = comments.map(comment => `
        <div class="comment-item">
            <div class="comment-item__body">${escapeHtml(comment.body || comment.content || '')}</div>
            <div class="comment-item__meta">
                – <span class="comment-item__author">${comment.Users?.username || comment.username || 'Anonymous'}</span>
                ${comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ''}
            </div>
        </div>
    `).join('');
}

function renderAnswers(sortKey = 'votes') {
    const sorted = sortAnswers([...currentAnswers], sortKey);

    elements.answersCount.textContent = sorted.length;

    if (sorted.length === 0) {
        elements.answersList.innerHTML = '<p style="opacity: 0.6; text-align: center; padding: 24px;">No answers yet. Be the first to answer!</p>';
        return;
    }

    elements.answersList.innerHTML = sorted.map(answer => renderAnswerItem(answer)).join('');

    // Setup answer event listeners
    setupAnswerEventListeners();
}

function renderAnswerItem(answer) {
    const isAccepted = answer.is_accepted || false;
    // Backend returns vote_count instead of Votes array
    const voteScore = answer.vote_count ?? calculateVoteScore(answer.Votes || []);
    const author = answer.Users || {};
    const comments = answer.Comments || [];
    const canAccept = currentUser && currentQuestion.Author?.user_id === currentUser.user_id && !isAccepted;

    return `
        <div class="answer-item ${isAccepted ? 'answer-item--accepted' : ''}" data-answer-id="${answer.answer_id}">
            <div class="answer-vote-column">
                <button class="vote-btn vote-btn--up answer-vote-up" data-answer-id="${answer.answer_id}" aria-label="Vote up">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                    </svg>
                </button>
                <span class="vote-count">${voteScore}</span>
                <button class="vote-btn vote-btn--down answer-vote-down" data-answer-id="${answer.answer_id}" aria-label="Vote down">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14M5 12l7 7 7-7"/>
                    </svg>
                </button>
                ${isAccepted ? '<button class="accept-btn accept-btn--accepted" disabled title="Accepted answer">✓</button>' : ''}
                ${canAccept ? `<button class="accept-btn accept-answer-btn" data-answer-id="${answer.answer_id}" title="Accept this answer">✓</button>` : ''}
            </div>
            <div class="answer-content">
                <div class="answer-body">${renderMarkdown(answer.body || '')}</div>
                <div class="answer-meta">
                    <div class="author-card">
                        <img src="${author.profile_image || '../signin,login/ghost.png'}" alt="" class="author-card__avatar" />
                        <div class="author-card__info">
                            <span class="author-card__name">${author.username || 'Anonymous'}</span>
                            <span class="author-card__rep">${author.reputation || 0} reputation</span>
                        </div>
                    </div>
                </div>
                
                <!-- Answer Comments -->
                <div class="comments-section">
                    <div class="comments-list">
                        ${comments.map(c => `
                            <div class="comment-item">
                                <div class="comment-item__body">${escapeHtml(c.body || '')}</div>
                                <div class="comment-item__meta">
                                    – <span class="comment-item__author">${c.Users?.username || 'Anonymous'}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="add-comment">
                        <button class="add-comment-toggle add-answer-comment-btn" data-answer-id="${answer.answer_id}">Add a comment</button>
                        <div class="add-comment-form answer-comment-form" data-answer-id="${answer.answer_id}" style="display: none;">
                            <textarea class="answer-comment-input" data-answer-id="${answer.answer_id}" placeholder="Write your comment..." rows="2"></textarea>
                            <div class="add-comment-actions">
                                <button class="btn btn--ghost btn--sm cancel-answer-comment" data-answer-id="${answer.answer_id}">Cancel</button>
                                <button class="btn btn--primary btn--sm submit-answer-comment" data-answer-id="${answer.answer_id}">Post Comment</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function setupAnswerEventListeners() {
    // Answer voting
    document.querySelectorAll('.answer-vote-up').forEach(btn => {
        btn.addEventListener('click', () => handleAnswerVote(parseInt(btn.dataset.answerId), 1));
    });

    document.querySelectorAll('.answer-vote-down').forEach(btn => {
        btn.addEventListener('click', () => handleAnswerVote(parseInt(btn.dataset.answerId), -1));
    });

    // Accept answer
    document.querySelectorAll('.accept-answer-btn').forEach(btn => {
        btn.addEventListener('click', () => handleAcceptAnswer(parseInt(btn.dataset.answerId)));
    });

    // Answer comments toggle
    document.querySelectorAll('.add-answer-comment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const answerId = btn.dataset.answerId;
            const form = document.querySelector(`.answer-comment-form[data-answer-id="${answerId}"]`);
            if (form) {
                form.style.display = 'block';
                btn.style.display = 'none';
            }
        });
    });

    // Cancel answer comment
    document.querySelectorAll('.cancel-answer-comment').forEach(btn => {
        btn.addEventListener('click', () => {
            const answerId = btn.dataset.answerId;
            const form = document.querySelector(`.answer-comment-form[data-answer-id="${answerId}"]`);
            const toggle = document.querySelector(`.add-answer-comment-btn[data-answer-id="${answerId}"]`);
            if (form) form.style.display = 'none';
            if (toggle) toggle.style.display = 'inline';
        });
    });

    // Submit answer comment
    document.querySelectorAll('.submit-answer-comment').forEach(btn => {
        btn.addEventListener('click', () => submitAnswerComment(parseInt(btn.dataset.answerId)));
    });
}

function sortAnswers(answers, sortKey) {
    if (sortKey === 'newest') {
        return answers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    if (sortKey === 'oldest') {
        return answers.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
    // Default: votes (highest first), accepted answers at top
    return answers.sort((a, b) => {
        if (a.is_accepted && !b.is_accepted) return -1;
        if (!a.is_accepted && b.is_accepted) return 1;
        const aScore = a.vote_count ?? calculateVoteScore(a.Votes || []);
        const bScore = b.vote_count ?? calculateVoteScore(b.Votes || []);
        return bScore - aScore;
    });
}

// Vote on question
async function handleVote(voteType) {
    if (!currentQuestion) return;

    try {
        const response = await api.vote(currentQuestion.question_id, null, voteType);

        if (response.success) {
            if (response.data?.action === 'unvote') {
                userVoteStatus = null;
            } else {
                userVoteStatus = voteType;
            }

            // Update vote count based on action
            let currentVoteCount = parseInt(elements.voteCount.textContent) || 0;
            if (response.data?.action === 'unvote') {
                currentVoteCount -= voteType === 1 ? 1 : -1;
            } else if (response.data?.action === 'flip') {
                currentVoteCount += voteType * 2;
            } else {
                currentVoteCount += voteType;
            }
            elements.voteCount.textContent = currentVoteCount;

            updateVoteButtons();
            showToast(response.data?.message || 'Vote recorded!', 'success');
        } else {
            showToast(response.message || 'Failed to vote', 'error');
        }
    } catch (error) {
        console.error('Vote error:', error);
        showToast(error.message || 'Failed to vote', 'error');
    }
}

// Vote on answer
async function handleAnswerVote(answerId, voteType) {
    try {
        const response = await api.vote(null, answerId, voteType);

        if (response.success) {
            // Reload answers to get updated vote counts
            const answersResponse = await api.getAnswers(currentQuestion.question_id, 1, 100);
            currentAnswers = answersResponse.data || [];
            renderAnswers('votes');
            showToast('Vote recorded!', 'success');
        } else {
            showToast(response.message || 'Failed to vote', 'error');
        }
    } catch (error) {
        console.error('Answer vote error:', error);
        showToast(error.message || 'Failed to vote', 'error');
    }
}

// Accept answer
async function handleAcceptAnswer(answerId) {
    try {
        const response = await api.acceptAnswer(answerId);

        if (response.success) {
            // Reload answers
            const answersResponse = await api.getAnswers(currentQuestion.question_id, 1, 100);
            currentAnswers = answersResponse.data || [];
            renderAnswers('votes');
            showToast('Answer accepted!', 'success');
        } else {
            showToast(response.message || 'Failed to accept answer', 'error');
        }
    } catch (error) {
        console.error('Accept error:', error);
        showToast(error.message || 'Failed to accept answer', 'error');
    }
}

// Submit new answer
async function submitAnswer() {
    const body = elements.answerBody.value.trim();

    if (!body || body.length < 30) {
        showToast('Answer must be at least 30 characters', 'error');
        return;
    }

    try {
        elements.submitAnswerBtn.disabled = true;
        elements.submitAnswerBtn.textContent = 'Posting...';

        const response = await api.createAnswer(currentQuestion.question_id, body);

        if (response.success) {
            elements.answerBody.value = '';

            // Reload answers
            const answersResponse = await api.getAnswers(currentQuestion.question_id, 1, 100);
            currentAnswers = answersResponse.data || [];
            renderAnswers('votes');

            showToast('Answer posted successfully!', 'success');
        } else {
            showToast(response.message || 'Failed to post answer', 'error');
        }
    } catch (error) {
        console.error('Submit answer error:', error);
        showToast(error.message || 'Failed to post answer', 'error');
    } finally {
        elements.submitAnswerBtn.disabled = false;
        elements.submitAnswerBtn.textContent = 'Post Your Answer';
    }
}

// Submit comment on question
async function submitQuestionComment() {
    const body = elements.questionCommentInput.value.trim();

    if (!body) {
        showToast('Comment cannot be empty', 'error');
        return;
    }

    try {
        const response = await api.createComment(body, currentQuestion.question_id, null);

        if (response.success) {
            elements.questionCommentInput.value = '';
            elements.questionCommentForm.style.display = 'none';
            elements.addQuestionCommentBtn.style.display = 'inline';

            // Reload comments
            const commentsResponse = await api.getComments(currentQuestion.question_id, null);
            currentQuestion.comments = commentsResponse.data || [];
            renderQuestionComments();

            showToast('Comment added!', 'success');
        } else {
            showToast(response.message || 'Failed to add comment', 'error');
        }
    } catch (error) {
        console.error('Comment error:', error);
        showToast(error.message || 'Failed to add comment', 'error');
    }
}

// Submit comment on answer
async function submitAnswerComment(answerId) {
    const input = document.querySelector(`.answer-comment-input[data-answer-id="${answerId}"]`);
    const body = input?.value.trim();

    if (!body) {
        showToast('Comment cannot be empty', 'error');
        return;
    }

    try {
        const response = await api.createComment(body, null, answerId);

        if (response.success) {
            // Reload answers with comments
            const answersResponse = await api.getAnswers(currentQuestion.question_id, 1, 100);
            currentAnswers = answersResponse.data || [];
            renderAnswers('votes');

            showToast('Comment added!', 'success');
        } else {
            showToast(response.message || 'Failed to add comment', 'error');
        }
    } catch (error) {
        console.error('Answer comment error:', error);
        showToast(error.message || 'Failed to add comment', 'error');
    }
}

// Toolbar actions for answer textarea
function handleToolbarAction(format) {
    const textarea = elements.answerBody;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let newText = '';

    switch (format) {
        case 'bold':
            newText = `**${selectedText}**`;
            break;
        case 'italic':
            newText = `*${selectedText}*`;
            break;
        case 'code':
            newText = selectedText.includes('\n')
                ? `\n\`\`\`\n${selectedText}\n\`\`\`\n`
                : `\`${selectedText}\``;
            break;
        case 'link':
            newText = `[${selectedText || 'link text'}](url)`;
            break;
        default:
            return;
    }

    textarea.setRangeText(newText, start, end, 'end');
    textarea.focus();
}

// Render markdown (basic)
function renderMarkdown(text) {
    if (!text) return '';

    return escapeHtml(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Action button handlers
function handleShare() {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            showToast('Link copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopyToClipboard(url);
        });
    } else {
        fallbackCopyToClipboard(url);
    }
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        showToast('Link copied to clipboard!', 'success');
    } catch (err) {
        showToast('Failed to copy link', 'error');
    }
    document.body.removeChild(textArea);
}

function handleEditQuestion() {
    if (!currentQuestion) return;
    // Navigate to ask page with edit mode
    window.location.href = `../ask/index.html?edit=${currentQuestion.question_id}`;
}

function handleReport() {
    showToast('Report feature coming soon!', 'info');
}

// UI helpers
function showLoading() {
    elements.loadingState.style.display = 'flex';
    elements.errorState.style.display = 'none';
    elements.questionDetail.style.display = 'none';
    elements.answersSection.style.display = 'none';
    elements.postAnswerSection.style.display = 'none';
}

function hideLoading() {
    elements.loadingState.style.display = 'none';
    elements.questionDetail.style.display = 'block';
    elements.answersSection.style.display = 'block';
    elements.postAnswerSection.style.display = 'block';
}

function showError(message) {
    elements.loadingState.style.display = 'none';
    elements.errorState.style.display = 'flex';
    elements.questionDetail.style.display = 'none';
    document.getElementById('error-message').textContent = message;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    toast.className = `toast toast--${type}`;
    toastMessage.textContent = message;
    toast.style.display = 'flex';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 4000);
}

// Global function for toast close
window.hideToast = function () {
    document.getElementById('toast').style.display = 'none';
};
