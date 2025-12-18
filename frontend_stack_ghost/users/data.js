/**
 * @file data.js
 * @description Data fetching for users page - connects to backend API
 */

import api from '../js/api.js';

export const fallbackUserData = {
  username: "Guest",
  profileImage: "../signin,login/ghost.png",
  reputation: 0,
  asked: 0,
  answered: 0,
  notifications: ["Welcome to Stack Ghost!"],
};

export const fallbackUsers = [
  { id: 1, username: "Loading...", profileImage: "../signin,login/ghost.png", reputation: 0, role: "User", isFollowed: false }
];

/**
 * Fetch current logged-in user data
 */
export async function fetchUserData() {
  try {
    if (!api.isAuthenticated()) {
      window.location.href = '../signin,login/index.html';
      return fallbackUserData;
    }

    const userResponse = await api.getCurrentUser();
    const user = userResponse.data;

    let notifications = [];
    try {
      const notifResponse = await api.getNotifications(user.user_id, 1, 5);
      notifications = notifResponse.data?.map(n => n.content) || [];
    } catch (error) {
      console.warn('Could not fetch notifications:', error);
    }

    return {
      user_id: user.user_id,
      username: user.username || 'User',
      reputation: user.reputation || 0,
      asked: user._count?.AuthoredQuestions || 0,
      answered: user._count?.Answers || 0,
      profileImage: user.profile_image || '../signin,login/ghost.png',
      notifications: notifications.length > 0 ? notifications : ['No new notifications']
    };
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
 * Fetch all users from the database
 */
export async function fetchUsers() {
  try {
    if (!api.isAuthenticated()) {
      window.location.href = '../signin,login/index.html';
      return fallbackUsers;
    }

    // Try to get all users (admin endpoint)
    try {
      const response = await api.request('/users?page=1&limit=100');
      
      if (response.success && response.data) {
        return response.data.map(user => ({
          id: user.user_id,
          userId: user.user_id,
          user_id: user.user_id,
          username: user.username,
          profileImage: user.profile_image || '../signin,login/ghost.png',
          reputation: user.reputation || 0,
          reputationScore: user.reputation || 0,
          role: user.Roles?.role_name || 'user',
          title: user.Roles?.role_name || 'user',
          questionsCount: user._count?.AuthoredQuestions || 0,
          answersCount: user._count?.Answers || 0,
          isFollowed: user.isFollowed || false, // Get follow status from backend
          isActive: user.is_active !== false
        }));
      }
    } catch (adminError) {
      // If not admin, just return current user and some basic info
      console.warn('Not admin, showing limited user list:', adminError);
      
      const currentUser = await api.getCurrentUser();
      return [{
        id: currentUser.data.user_id,
        userId: currentUser.data.user_id,
        username: currentUser.data.username,
        profileImage: currentUser.data.profile_image || '../signin,login/ghost.png',
        reputation: currentUser.data.reputation || 0,
        reputationScore: currentUser.data.reputation || 0,
        role: currentUser.data.Roles?.role_name || 'user',
        title: currentUser.data.Roles?.role_name || 'user',
        questionsCount: currentUser.data._count?.AuthoredQuestions || 0,
        answersCount: currentUser.data._count?.Answers || 0,
        isFollowed: false,
        isActive: true
      }];
    }

    return fallbackUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    return fallbackUsers;
  }
}
