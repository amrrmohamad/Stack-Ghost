/**
 * @file data.js
 * @description Data fetching for profile page - connects to backend API
 */

import api from '../js/api.js';

export const fallbackUserData = {
  username: "Guest",
  profileImage: "../signin,login/ghost.png",
  reputation: 0,
  asked: 0,
  answered: 0,
  followers: 0,
  following: 0,
  about: "No bio yet.",
  badges: [],
  questions: [],
  answers: [],
  tagCards: [],
  posts: []
};

/**
 * Get user ID from URL parameter or use current user
 */
function getUserIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  // Check both 'userId' and 'id' parameters for compatibility
  const id = urlParams.get('userId') || urlParams.get('id');
  return id ? parseInt(id) : null;
}

/**
 * Fetch complete user profile data
 */
export async function fetchUserData() {
  try {
    if (!api.isAuthenticated()) {
      window.location.href = '../signin,login/index.html';
      return fallbackUserData;
    }

    const userId = getUserIdFromURL();
    const targetUserId = userId || api.getUser()?.user_id;

    if (!targetUserId) {
      // If no user ID, get current user
      const currentUser = await api.getCurrentUser();
      return await fetchCompleteProfile(currentUser.data.user_id);
    }

    return await fetchCompleteProfile(targetUserId);
  } catch (error) {
    console.error('Error fetching user data:', error);
    if (error.message?.includes('Session expired') || error.message?.includes('Unauthorized')) {
      api.clearTokens();
      window.location.href = '../signin,login/index.html';
    }
    return fallbackUserData;
  }
}

/**
 * Fetch complete profile with all data
 */
async function fetchCompleteProfile(userId) {
  try {
    // Fetch complete profile with all includes
    const response = await api.getCompleteProfile(userId);
    
    if (!response.success || !response.data) {
      throw new Error('Failed to load profile');
    }

    const data = response.data;
    const user = data.user;
    const followStats = data.followStats || { followersCount: 0, followingCount: 0 };
    
    // Debug: Log the follow stats to verify
    console.log('Follow stats from API:', followStats);
    console.log('Following count:', followStats.followingCount);

    // Check if current user is following this user
    let isFollowing = false;
    try {
      const currentUserId = api.getUser()?.user_id;
      if (currentUserId && currentUserId !== userId) {
        // Check if current user is in the followers list
        const followersResponse = await api.getFollowers(userId, 1, 1000);
        if (followersResponse.success && followersResponse.data) {
          // followersResponse.data is array of user objects with user_id
          isFollowing = followersResponse.data.some(f => f.user_id === currentUserId);
        }
      } else if (currentUserId === userId) {
        isFollowing = null; // Can't follow yourself
      }
    } catch (e) {
      console.warn('Could not check follow status:', e);
      // Default to false if check fails
      isFollowing = false;
    }

    return {
      user_id: user.user_id,
      username: user.username || 'User',
      email: user.email || '',
      bio: user.bio || 'No bio yet.',
      profileImage: user.profile_image || '../signin,login/ghost.png',
      reputation: user.reputation || 0,
      asked: user._count?.AuthoredQuestions || 0,
      answered: user._count?.Answers || 0,
      followers: followStats.followersCount || 0,
      following: followStats.followingCount || 0,
      role: user.Roles?.role_name || 'user',
      isFollowing: isFollowing,
      badges: (data.badges || []).map(b => ({
        badge_id: b.badge_id,
        badge_name: b.badge_name,
        badge_type: b.badge_type,
        description: b.description,
        icon: b.icon || '../signin,login/ghost.png',
        label: b.badge_name,
        granted_at: b.granted_at
      })),
      questions: (data.questions || []).map(q => ({
        question_id: q.question_id,
        title: q.title,
        summary: q.summary,
        votes: q.votes,
        answers: q.answers,
        views: q.views,
        tags: q.tags,
        is_closed: q.is_closed,
        created_at: q.created_at,
        createdAt: q.createdAt,
        url: `../questions/index.html?id=${q.question_id}`
      })),
      answers: (data.answers || []).map(a => ({
        answer_id: a.answer_id,
        snippet: a.snippet,
        excerpt: a.excerpt,
        body: a.body,
        question_id: a.question_id,
        questionTitle: a.questionTitle,
        votes: a.votes,
        is_accepted: a.is_accepted,
        created_at: a.created_at,
        createdAt: a.createdAt,
        url: `../questions/index.html?id=${a.question_id}#answer-${a.answer_id}`
      })),
      tagCards: (data.followedTags || []).map(t => ({
        tag_id: t.tag_id,
        name: t.tag_name,
        posts: t.posts,
        description: t.description,
        url: `../tages/index.html?tag=${t.tag_name}`
      })),
      posts: (data.questionTitles || []).map(q => ({
        title: q.title,
        username: user.username,
        url: q.url
      }))
    };
  } catch (error) {
    console.error('Error fetching complete profile:', error);
    throw error;
  }
}
