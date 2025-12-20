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
    await setupFollowingModal(); // Ensure modal is initialized
    setupNavigation();
    setupLogout();
    // setupEditProfile is called inside setupFollowButton if isOwnProfile
    
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

let followingModal = null;

async function setupFollowingModal() {
  // Create modal if it doesn't exist
  if (!document.getElementById('following-modal')) {
    const modal = document.createElement('div');
    modal.id = 'following-modal';
    modal.className = 'modal';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h2>👥 Users You Follow</h2>
          <button id="close-following-modal" class="modal-close-btn" aria-label="Close">&times;</button>
        </div>
        <div id="following-list" style="max-height: 60vh; overflow-y: auto;">
          <div style="padding: 40px; text-align: center; opacity: 0.6;">Loading...</div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    followingModal = modal;
    
    // Close button
    const closeBtn = document.getElementById('close-following-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeFollowingModal);
    }
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeFollowingModal();
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display !== 'none') {
        closeFollowingModal();
      }
    });
  } else {
    followingModal = document.getElementById('following-modal');
  }
}

async function openFollowingModal() {
  if (!followingModal) {
    await setupFollowingModal();
  }
  
  const listContainer = document.getElementById('following-list');
  if (!listContainer) return;
  
  // Show loading state
  listContainer.innerHTML = '<div style="padding: 40px; text-align: center; opacity: 0.6;">Loading users...</div>';
  
  // Show modal
  followingModal.style.display = 'flex';
  followingModal.style.position = 'fixed';
  followingModal.style.zIndex = '99999';
  followingModal.style.top = '0';
  followingModal.style.left = '0';
  followingModal.style.right = '0';
  followingModal.style.bottom = '0';
  followingModal.style.width = '100%';
  followingModal.style.height = '100%';
  document.body.classList.add('modal-open');
  
  try {
    // Get current user ID
    const loggedInUser = api.getUser();
    if (!loggedInUser || !loggedInUser.user_id) {
      throw new Error('Not logged in');
    }
    
    // Fetch following users
    const response = await api.getFollowing(loggedInUser.user_id, 1, 100);
    
    if (response.success && response.data && response.data.length > 0) {
      renderFollowingList(response.data);
    } else {
      listContainer.innerHTML = '<div style="padding: 40px; text-align: center; opacity: 0.6;">You are not following any users yet.</div>';
    }
  } catch (error) {
    console.error('Error loading following users:', error);
    listContainer.innerHTML = '<div style="padding: 40px; text-align: center; opacity: 0.6; color: #ff6b6b;">Failed to load users. Please try again.</div>';
  }
}

// Followers Modal Functions
let followersModal = null;

async function setupFollowersModal() {
  followersModal = document.createElement('div');
  followersModal.id = 'followers-modal';
  followersModal.className = 'modal';
  followersModal.innerHTML = `
    <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
      <div class="modal-header">
        <h2 style="margin: 0; font-size: 24px; color: white;">Your Followers</h2>
        <button class="modal-close" onclick="closeFollowersModal()" style="background: none; border: none; font-size: 28px; color: white; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">&times;</button>
      </div>
      <div id="followers-list" style="padding: 20px;"></div>
    </div>
  `;
  document.body.appendChild(followersModal);
  
  // Close on background click
  followersModal.addEventListener('click', (e) => {
    if (e.target === followersModal) {
      closeFollowersModal();
    }
  });
  
  // Make closeFollowersModal globally accessible
  window.closeFollowersModal = closeFollowersModal;
}

async function openFollowersModal() {
  if (!followersModal) {
    await setupFollowersModal();
  }
  
  const listContainer = document.getElementById('followers-list');
  if (!listContainer) return;
  
  // Show loading state
  listContainer.innerHTML = '<div style="padding: 40px; text-align: center; opacity: 0.6;">Loading followers...</div>';
  
  // Show modal
  followersModal.style.display = 'flex';
  followersModal.style.position = 'fixed';
  followersModal.style.zIndex = '99999';
  followersModal.style.top = '0';
  followersModal.style.left = '0';
  followersModal.style.right = '0';
  followersModal.style.bottom = '0';
  followersModal.style.width = '100%';
  followersModal.style.height = '100%';
  document.body.classList.add('modal-open');
  
  try {
    // Get current user ID
    const loggedInUser = api.getUser();
    if (!loggedInUser || !loggedInUser.user_id) {
      throw new Error('Not logged in');
    }
    
    // Fetch followers
    const response = await api.getFollowers(loggedInUser.user_id, 1, 100);
    
    if (response.success && response.data && response.data.length > 0) {
      renderFollowersList(response.data);
    } else {
      listContainer.innerHTML = '<div style="padding: 40px; text-align: center; opacity: 0.6;">You don\'t have any followers yet.</div>';
    }
  } catch (error) {
    console.error('Error loading followers:', error);
    listContainer.innerHTML = '<div style="padding: 40px; text-align: center; opacity: 0.6; color: #ff6b6b;">Failed to load followers. Please try again.</div>';
  }
}

function renderFollowersList(users) {
  const listContainer = document.getElementById('followers-list');
  if (!listContainer) return;
  
  listContainer.innerHTML = '';
  
  if (!users || users.length === 0) {
    listContainer.innerHTML = '<div style="padding: 40px; text-align: center; opacity: 0.6;">No followers found.</div>';
    return;
  }
  
  users.forEach(user => {
    const card = document.createElement('div');
    card.style.cssText = `
      padding: 16px;
      margin-bottom: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    
    card.addEventListener('click', () => {
      window.location.href = `index.html?userId=${user.user_id}`;
    });
    
    card.addEventListener('mouseenter', () => {
      card.style.background = 'rgba(255, 255, 255, 0.08)';
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'none';
      card.style.background = 'rgba(255, 255, 255, 0.05)';
    });
    
    const profileImage = user.profile_image || '../signin,login/ghost.png';
    const username = user.username || 'User';
    const reputation = user.reputation || 0;
    const role = user.Roles?.role_name || 'user';
    
    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <img src="${profileImage}" alt="${username}" 
             style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.2);"
             onerror="this.src='../signin,login/ghost.png'">
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; font-size: 16px; color: white; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${username}
          </div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.6); text-transform: capitalize;">
            ${role}
          </div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
        <i data-lucide="star" style="width: 14px; height: 14px; fill: #ffd43b; color: #ffd43b;"></i>
        <span style="color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 500;">${reputation.toLocaleString()} reputation</span>
      </div>
    `;
    
    listContainer.appendChild(card);
  });
  
  // Initialize Lucide icons after rendering
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function closeFollowersModal() {
  if (followersModal) {
    followersModal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }
}

function renderFollowingList(users) {
  const listContainer = document.getElementById('following-list');
  if (!listContainer) return;
  
  listContainer.innerHTML = '';
  
  if (!users || users.length === 0) {
    listContainer.innerHTML = '<div style="padding: 40px; text-align: center; opacity: 0.6;">You are not following any users yet.</div>';
    return;
  }
  
  // Create a grid container
  const grid = document.createElement('div');
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    padding: 8px;
  `;
  
  users.forEach(user => {
    const card = document.createElement('div');
    card.className = 'glass';
    card.style.cssText = `
      padding: 16px;
      border-radius: 12px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'none';
    });
    
    const profileImage = user.profile_image || '../signin,login/ghost.png';
    const username = user.username || 'User';
    const reputation = user.reputation || 0;
    const role = user.Roles?.role_name || 'user';
    
    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <img src="${profileImage}" alt="${username}" 
             style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.2);"
             onerror="this.src='../signin,login/ghost.png'">
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; font-size: 16px; color: white; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${username}
          </div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.6); text-transform: capitalize;">
            ${role}
          </div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
        <i data-lucide="star" style="width: 14px; height: 14px; fill: #ffd43b; color: #ffd43b;"></i>
        <span style="color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">
          ${formatNumber(reputation)} reputation
        </span>
      </div>
    `;
    
    // Click to view profile
    card.addEventListener('click', () => {
      // Close modal and navigate to user's profile
      closeFollowingModal();
      window.location.href = `index.html?userId=${user.user_id}`;
    });
    
    grid.appendChild(card);
  });
  
  listContainer.appendChild(grid);
  
  // Initialize Lucide icons after rendering
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function closeFollowingModal() {
  if (followingModal) {
    const content = followingModal.querySelector('.modal-content');
    if (content) {
      content.style.animation = 'slideOut 0.2s ease';
      setTimeout(() => {
        followingModal.style.display = 'none';
        document.body.classList.remove('modal-open');
        if (content) content.style.animation = '';
      }, 200);
    } else {
      followingModal.style.display = 'none';
      document.body.classList.remove('modal-open');
    }
  }
}

function setupFollowButton() {
  const followBtn = document.querySelector('.profile-header__follow');
  const editBtn = document.getElementById('edit-profile-btn');
  
  if (isOwnProfile) {
    if (followBtn) followBtn.style.display = 'none';
    if (editBtn) editBtn.style.display = 'block';
    setupEditProfile();
    return;
  }

  if (followBtn) {
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
  
  if (editBtn) editBtn.style.display = 'none';
}

function setupEditProfile() {
  const editBtn = document.getElementById('edit-profile-btn');
  const modal = document.getElementById('edit-profile-modal');
  const closeBtn = document.getElementById('close-edit-modal');
  const cancelBtn = document.getElementById('cancel-edit-profile');
  const form = document.getElementById('edit-profile-form');
  
  if (!editBtn || !modal) return;
  
  // Open modal
  editBtn.addEventListener('click', () => {
    // First, scroll page down to the end (bottom) smoothly
    const scrollTarget = document.documentElement.scrollHeight - window.innerHeight;
    
    window.scrollTo({
      top: scrollTarget,
      behavior: 'smooth'
    });
    
    // Populate form with current data
    document.getElementById('edit-username').value = cachedUser.username || '';
    document.getElementById('edit-bio').value = cachedUser.bio || '';
    document.getElementById('edit-profile-image').value = cachedUser.profileImage || '';
    
    // Show modal after a short delay to allow scroll animation
    setTimeout(() => {
      modal.style.display = 'flex';
      modal.style.position = 'fixed';
      modal.style.zIndex = '99999';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.right = '0';
      modal.style.bottom = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      
      // Prevent body scroll but allow modal scroll
      document.body.classList.add('modal-open');
      
      // Scroll modal content to top
      modal.scrollTop = 0;
      const content = modal.querySelector('.modal-content');
      if (content) {
        content.scrollTop = 0;
      }
    }, 400); // Wait for scroll animation to complete
  });
  
  // Close modal with animation
  const closeModal = () => {
    const content = modal.querySelector('.modal-content');
    if (content) {
      content.style.animation = 'slideOut 0.2s ease';
      setTimeout(() => {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        // Reset scroll position
        modal.scrollTop = 0;
        if (content) content.scrollTop = 0;
        content.style.animation = '';
      }, 200);
    } else {
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      modal.scrollTop = 0;
    }
  };
  
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  
  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
      closeModal();
    }
  });
  
  // Handle form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
      
      try {
        const updates = {
          username: document.getElementById('edit-username').value.trim(),
          bio: document.getElementById('edit-bio').value.trim(),
          profile_image: document.getElementById('edit-profile-image').value.trim() || null
        };
        
        const response = await api.updateProfile(updates);
        
        if (response.success) {
          // Update cached user data
          cachedUser.username = updates.username;
          cachedUser.bio = updates.bio;
          if (updates.profile_image) {
            cachedUser.profileImage = updates.profile_image;
          }
          
          // Update UI
          applyUserData(cachedUser);
          
          // Show success message
          showToast('Profile updated successfully!', 'success');
          
          // Close modal
          closeModal();
        } else {
          throw new Error(response.message || 'Failed to update profile');
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        showToast(error.message || 'Failed to update profile. Please try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
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
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
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

  // Update role
  document.querySelectorAll("[data-role]").forEach((el) => {
    const role = user.role || 'user';
    el.textContent = role;
    
    // Style based on role
    const roleColors = {
      admin: { bg: 'rgba(255, 107, 107, 0.2)', color: '#ff6b6b', border: 'rgba(255, 107, 107, 0.3)' },
      moderator: { bg: 'rgba(81, 207, 102, 0.2)', color: '#51cf66', border: 'rgba(81, 207, 102, 0.3)' },
      user: { bg: 'rgba(133, 103, 186, 0.2)', color: '#8567BA', border: 'rgba(133, 103, 186, 0.3)' }
    };
    
    const roleStyle = roleColors[role.toLowerCase()] || roleColors.user;
    el.style.background = roleStyle.bg;
    el.style.color = roleStyle.color;
    el.style.borderColor = roleStyle.border;
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
    // Make followers count clickable only if viewing own profile
    if (isOwnProfile) {
      // Remove existing click listeners by cloning
      const newEl = el.cloneNode(true);
      el.parentNode.replaceChild(newEl, el);
      
      // Set up the new element
      newEl.style.cursor = 'pointer';
      newEl.style.textDecoration = 'underline';
      newEl.style.textDecorationStyle = 'dotted';
      newEl.title = 'Click to view your followers';
      newEl.addEventListener('click', () => {
        openFollowersModal();
      });
      
      // Parse current text as start value, or use 0
      const currentText = newEl.textContent.trim().replace(/,/g, '');
      const startValue = parseInt(currentText) || 0;
      
      // Animate the number on the NEW element
      animateNumber(newEl, startValue, user.followers, 1000);
    } else {
      el.style.cursor = 'default';
      el.style.textDecoration = 'none';
      el.title = '';
      // Parse current text as start value, or use 0
      const currentText = el.textContent.trim().replace(/,/g, '');
      const startValue = parseInt(currentText) || 0;
      // Animate the number
      animateNumber(el, startValue, user.followers, 1000);
    }
  });

  document.querySelectorAll("[data-following]").forEach((el) => {
    // Make following count clickable only if viewing own profile
    if (isOwnProfile) {
      // Remove existing click listeners by cloning
      const newEl = el.cloneNode(true);
      el.parentNode.replaceChild(newEl, el);
      
      // Set up the new element
      newEl.style.cursor = 'pointer';
      newEl.style.textDecoration = 'underline';
      newEl.style.textDecorationStyle = 'dotted';
      newEl.title = 'Click to view users you follow';
      newEl.addEventListener('click', () => {
        openFollowingModal();
      });
      
      // Parse current text as start value, or use 0
      const currentText = newEl.textContent.trim().replace(/,/g, '');
      const startValue = parseInt(currentText) || 0;
      
      // Animate the number on the NEW element
      animateNumber(newEl, startValue, user.following, 1000);
    } else {
      el.style.cursor = 'default';
      el.style.textDecoration = 'none';
      el.title = '';
      // Parse current text as start value, or use 0
      const currentText = el.textContent.trim().replace(/,/g, '');
      const startValue = parseInt(currentText) || 0;
      // Animate the number
      animateNumber(el, startValue, user.following, 1000);
    }
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

  // Badge type configurations - using landing page images
  const badgeConfigs = {
    SILVER: {
      image: '../landing_page/B1.png',
      name: 'Silver'
    },
    GOLD: {
      image: '../landing_page/B2.png',
      name: 'Gold'
    },
    DIAMOND: {
      image: '../landing_page/B3.png',
      name: 'Diamond'
    }
  };

  // Count badges by type
  const badgeCounts = {
    DIAMOND: 0,
    GOLD: 0,
    SILVER: 0
  };

  if (badges && badges.length > 0) {
    badges.forEach(badge => {
      const type = badge.badge_type || 'SILVER';
      if (badgeCounts[type] !== undefined) {
        badgeCounts[type]++;
      } else {
        badgeCounts.SILVER++;
      }
    });
  }

  // Render in order: Silver, Gold, Diamond
  ['SILVER', 'GOLD', 'DIAMOND'].forEach(type => {
    const config = badgeConfigs[type];
    const count = badgeCounts[type] || 0;
    
    const wrapper = document.createElement("div");
    wrapper.className = "badge badge-card";
    
    // Subtle lighting for badges with count > 0
    const hasBadges = count > 0;
    const glowColor = type === 'DIAMOND' ? 'rgba(133, 103, 186, 0.3)' :
                      type === 'GOLD' ? 'rgba(255, 215, 0, 0.3)' : 
                      'rgba(192, 192, 192, 0.3)'; // SILVER
    
    // Subtle lighting effects for badges with count > 0
    const baseGlow = hasBadges ? 
      `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 12px 32px rgba(133, 103, 186, 0.4))` :
      `drop-shadow(0 12px 32px rgba(133, 103, 186, 0.4))`;
    
    wrapper.style.cssText = `
      background: transparent;
      border: none;
      border-radius: 50%;
      padding: 0;
      text-align: center;
      box-shadow: ${hasBadges ? `0 0 15px ${glowColor}40` : 'none'};
      transition: transform 0.3s ease, filter 0.3s ease, box-shadow 0.3s ease;
      opacity: ${hasBadges ? '1' : '0.6'};
      cursor: pointer;
      position: relative;
      animation: none;
    `;
    
    // Hover effects - no blur, just subtle glow
    wrapper.addEventListener('mouseenter', () => {
      wrapper.style.transform = 'translateY(-8px) rotate(-2deg)';
      if (hasBadges) {
        wrapper.style.boxShadow = `0 0 20px ${glowColor}50`;
      }
      const img = wrapper.querySelector('img');
      if (img) {
        // Remove drop-shadow to eliminate blur effect
        img.style.filter = hasBadges ? 'brightness(1.15)' : 'brightness(1.1)';
        img.style.transform = 'scale(1.05)';
        img.style.opacity = '1';
      }
    });
    
    wrapper.addEventListener('mouseleave', () => {
      wrapper.style.transform = 'translateY(0) rotate(0deg)';
      if (hasBadges) {
        wrapper.style.boxShadow = `0 0 15px ${glowColor}40`;
      }
      const img = wrapper.querySelector('img');
      if (img) {
        // Keep it clean without drop-shadow blur
        img.style.filter = hasBadges ? 'brightness(1.05)' : 'brightness(1)';
        img.style.transform = 'scale(1)';
        img.style.opacity = hasBadges ? '1' : '0.5';
      }
    });

    // Badge image - using landing page images
    const imgContainer = document.createElement("div");
    imgContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
    `;
    
    const badgeImg = document.createElement("img");
    badgeImg.src = config.image;
    badgeImg.alt = `${config.name} badge`;
    
    badgeImg.style.cssText = `
      width: auto;
      max-width: 160px;
      height: auto;
      max-height: 160px;
      display: block;
      margin: 0 auto;
      background: transparent;
      filter: ${baseGlow} brightness(${hasBadges ? '1.1' : '1.1'});
      transition: filter 0.3s ease, transform 0.3s ease;
      opacity: ${hasBadges ? '1' : '0.5'};
      position: relative;
      z-index: 1;
    `;
    
    imgContainer.appendChild(badgeImg);

    // Badge name
    const label = document.createElement("span");
    label.className = "badge__label";
    label.style.cssText = `
      color: ${hasBadges ? '#e9e6f5' : 'rgba(181, 176, 199, 0.6)'};
      font-weight: 700;
      font-size: 15px;
      text-align: center;
      display: block;
      margin-top: 10px;
      text-shadow: ${hasBadges ? `0 0 8px ${glowColor}, 0 2px 4px rgba(0, 0, 0, 0.3)` : '0 2px 4px rgba(0, 0, 0, 0.3)'};
      letter-spacing: 0.5px;
      position: relative;
      z-index: 1;
    `;
    label.textContent = config.name;

    // Badge count (number of badges of this type) - displayed below
    const countEl = document.createElement("span");
    countEl.style.cssText = `
      color: ${hasBadges ? '#ffffff' : 'rgba(181, 176, 199, 0.5)'};
      font-weight: 800;
      font-size: 20px;
      text-align: center;
      display: block;
      margin-top: 6px;
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
      letter-spacing: 1px;
      position: relative;
      z-index: 1;
    `;
    countEl.textContent = count;

    wrapper.append(imgContainer, label, countEl);
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
