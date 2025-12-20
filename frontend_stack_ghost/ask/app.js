/**
 * @file app.js
 * @description Ask Question page functionality
 */
import api from '../js/api.js';

// State
let selectedTags = [];
let allTags = [];
const MAX_TAGS = 5;

// DOM Elements
let form, titleInput, bodyInput, tagsDropdown, selectedTagsContainer;
let titleCounter, bodyCounter, previewContent, submitBtn, successModal, errorToast, errorMessage;

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is authenticated
    if (!api.isAuthenticated()) {
        window.location.href = '/signin,login/index.html';
        return;
    }

    initializeElements();
    setupEventListeners();
    await loadTags();
    setupLogout();
    updateProfileImage();
});

function initializeElements() {
    form = document.getElementById('ask-form');
    titleInput = document.getElementById('question-title');
    bodyInput = document.getElementById('question-body');
    tagsDropdown = document.getElementById('tags-dropdown');
    selectedTagsContainer = document.getElementById('selected-tags');
    titleCounter = document.getElementById('title-counter');
    bodyCounter = document.getElementById('body-counter');
    previewContent = document.getElementById('preview-content');
    submitBtn = document.getElementById('submit-btn');
    successModal = document.getElementById('success-modal');
    errorToast = document.getElementById('error-toast');
    errorMessage = document.getElementById('error-message');

    // Add toolbar data attribute to textarea
    bodyInput.setAttribute('data-has-toolbar', 'true');
}

function setupEventListeners() {
    // Form submission
    form.addEventListener('submit', handleSubmit);

    // Character counters
    titleInput.addEventListener('input', () => {
        titleCounter.textContent = titleInput.value.length;
        updatePreview();
        validateForm();
    });

    bodyInput.addEventListener('input', () => {
        bodyCounter.textContent = bodyInput.value.length;
        updatePreview();
        validateForm();
    });

    // Toolbar buttons
    document.querySelectorAll('.toolbar-btn').forEach(btn => {
        btn.addEventListener('click', () => handleToolbarAction(btn.dataset.format));
    });

    // Keyboard shortcuts
    bodyInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'b') {
                e.preventDefault();
                handleToolbarAction('bold');
            } else if (e.key === 'i') {
                e.preventDefault();
                handleToolbarAction('italic');
            }
        }
    });
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

function updateProfileImage() {
    const user = api.getUser();
    if (user && user.profile_image) {
        const profileImg = document.getElementById('profile-image');
        if (profileImg) {
            profileImg.src = user.profile_image;
        }
    }
}

async function loadTags() {
    try {
        const response = await api.getTags(1, 100);
        console.log('Tags API response:', response);
        // API returns { success, tags: [...], totalTags, ... }
        if (response.success && response.tags) {
            allTags = response.tags;
            renderTagsList();
            renderSelectedTags();
        } else if (response.success && response.data) {
            // Fallback in case API structure changes
            allTags = response.data;
            renderTagsList();
            renderSelectedTags();
        } else {
            console.warn('No tags in response:', response);
            tagsDropdown.innerHTML = '<div class="no-tags">No tags available</div>';
        }
    } catch (error) {
        console.error('Failed to load tags:', error);
        if (tagsDropdown) {
            tagsDropdown.innerHTML = '<div class="no-tags">Failed to load tags. Please refresh.</div>';
        }
    }
}

function renderTagsList() {
    if (!tagsDropdown) return;

    tagsDropdown.innerHTML = '';

    if (allTags.length === 0) {
        tagsDropdown.innerHTML = '<div class="no-tags">No tags available</div>';
        return;
    }

    allTags.forEach(tag => {
        const isSelected = selectedTags.some(t => t.tag_id === tag.tag_id);

        const tagOption = document.createElement('div');
        tagOption.className = `tag-option ${isSelected ? 'tag-option--selected' : ''}`;
        tagOption.dataset.tagId = tag.tag_id;

        tagOption.innerHTML = `
            <span class="tag-option__checkbox">${isSelected ? '✓' : ''}</span>
            <span class="tag-option__name">${tag.tag_name}</span>
            ${tag.description ? `<span class="tag-option__desc">${tag.description.substring(0, 50)}${tag.description.length > 50 ? '...' : ''}</span>` : ''}
            <span class="tag-option__count">${tag._count?.Questions || 0}</span>
        `;

        tagOption.addEventListener('click', () => toggleTag(tag));
        tagsDropdown.appendChild(tagOption);
    });
}

function toggleTag(tag) {
    const isSelected = selectedTags.some(t => t.tag_id === tag.tag_id);

    if (isSelected) {
        // Remove tag
        selectedTags = selectedTags.filter(t => t.tag_id !== tag.tag_id);
    } else {
        // Add tag
        if (selectedTags.length >= MAX_TAGS) {
            showError(`You can only select up to ${MAX_TAGS} tags`);
            return;
        }
        selectedTags.push(tag);
    }

    renderTagsList();
    renderSelectedTags();
    updatePreview();
    validateForm();
}

function removeTag(tagId) {
    selectedTags = selectedTags.filter(t => t.tag_id !== tagId);
    renderTagsList();
    renderSelectedTags();
    updatePreview();
    validateForm();
}

function renderSelectedTags() {
    if (!selectedTagsContainer) return;

    selectedTagsContainer.innerHTML = '';

    if (selectedTags.length === 0) {
        selectedTagsContainer.innerHTML = '<span class="no-selection">No tags selected (select from list below)</span>';
        return;
    }

    selectedTags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'selected-tag';
        tagEl.innerHTML = `
            <span>${tag.tag_name}</span>
            <button type="button" class="selected-tag__remove" aria-label="Remove ${tag.tag_name}">&times;</button>
        `;
        tagEl.querySelector('.selected-tag__remove').addEventListener('click', () => removeTag(tag.tag_id));
        selectedTagsContainer.appendChild(tagEl);
    });
}

function handleToolbarAction(format) {
    const start = bodyInput.selectionStart;
    const end = bodyInput.selectionEnd;
    const selectedText = bodyInput.value.substring(start, end);
    let newText = '';

    switch (format) {
        case 'bold':
            newText = `[BB]${selectedText}[!BB]`;
            break;
        case 'italic':
            // Use underline instead since we don't have italic tag
            newText = `[UL]${selectedText}[!UL]`;
            break;
        case 'code':
            // Inline code - use same as codeblock for consistency
            newText = `[CODE]${selectedText}[!CODE]`;
            break;
        case 'codeblock':
            newText = `\n[CODE]\n${selectedText}\n[!CODE]\n`;
            break;
        case 'link':
            newText = `[${selectedText || 'link text'}](url)`;
            break;
        case 'list':
            const lines = selectedText.split('\n');
            newText = lines.map(line => `- ${line}`).join('\n');
            if (!selectedText) newText = '- ';
            break;
        default:
            return;
    }

    // Insert the formatted text
    bodyInput.setRangeText(newText, start, end, 'end');
    bodyInput.focus();

    // Update counter and preview
    bodyCounter.textContent = bodyInput.value.length;
    updatePreview();
}

function updatePreview() {
    if (!previewContent) return;

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (!title && !body) {
        previewContent.innerHTML = '<p class="preview-placeholder">Your question preview will appear here...</p>';
        return;
    }

    // Parse custom tags: [BB], [UL], [CODE]
    let formattedBody = escapeHtml(body)
        .replace(/\[CODE\]([\s\S]*?)\[!CODE\]/g, '<pre class="code-block"><code>$1</code></pre>')
        .replace(/\[BB\](.*?)\[!BB\]/g, '<strong>$1</strong>')
        .replace(/\[UL\](.*?)\[!UL\]/g, '<u>$1</u>')
        .replace(/\n/g, '<br>');

    previewContent.innerHTML = `
        ${title ? `<h2>${escapeHtml(title)}</h2>` : ''}
        <p>${formattedBody || '<span class="preview-placeholder">No body content yet...</span>'}</p>
        ${selectedTags.length > 0 ? `
            <div style="margin-top: 16px; display: flex; gap: 8px; flex-wrap: wrap;">
                ${selectedTags.map(t => `<span class="selected-tag" style="cursor: default;">${t.tag_name}</span>`).join('')}
            </div>
        ` : ''}
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function validateForm() {
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    const isValid = title.length >= 10 && body.length >= 30;
    submitBtn.disabled = !isValid;

    return isValid;
}

async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
        showError('Please fill in all required fields. Title must be at least 10 characters and body at least 30 characters.');
        return;
    }

    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();
    const tagIds = selectedTags.map(t => t.tag_id);

    // Disable submit button and show loading state
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="btn__icon">⏳</span> Posting...';

    try {
        const response = await api.createQuestion(title, body, tagIds);

        if (response.success) {
            // Show success modal
            successModal.classList.add('active');

            // Update view question button with the new question URL
            const viewBtn = document.getElementById('view-question-btn');
            if (viewBtn && response.data && response.data.question_id) {
                viewBtn.href = `../questions/index.html?id=${response.data.question_id}`;
            }

            // Auto redirect after 2 seconds
            setTimeout(() => {
                window.location.href = '../questions/index.html';
            }, 2000);
        } else {
            showError(response.message || 'Failed to post question');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    } catch (error) {
        console.error('Error posting question:', error);
        showError(error.message || 'Failed to post question. Please try again.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    if (errorToast) {
        errorToast.classList.add('active');
        // Auto hide after 5 seconds
        setTimeout(hideToast, 5000);
    }
}

// Global function for toast close button
window.hideToast = function () {
    if (errorToast) {
        errorToast.classList.remove('active');
    }
};
