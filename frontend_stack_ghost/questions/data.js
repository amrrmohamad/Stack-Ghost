/**
 * @file data.js
 * @description Data fetching for questions page - connects to backend API
 */

import api from '../js/api.js';

export async function fetchUserData() {
  try {
    // Check if user is authenticated
    if (!api.isAuthenticated()) {
      window.location.href = '../signin,login/index.html';
      return fallbackUserData;
    }

    // Fetch current user data
    const userResponse = await api.getCurrentUser();
    const user = userResponse.data;

    // Fetch all questions
    const questionsResponse = await api.getQuestions(1, 50); // Fetch more for pagination
    const questions = questionsResponse.data || [];

    // Fetch user's notifications
    let notifications = [];
    try {
      const notifResponse = await api.getNotifications(user.user_id, 1, 5);
      notifications = notifResponse.data?.map(n => n.content) || [];
    } catch (error) {
      console.warn('Could not fetch notifications:', error);
    }

    // Fetch tags
    let tags = [];
    try {
      const tagsResponse = await api.getTags(1, 10);
      tags = tagsResponse.tags?.map(t => t.tag_name) || [];
    } catch (error) {
      console.warn('Could not fetch tags:', error);
    }

    return {
      username: user.username || 'User',
      reputation: user.reputation || 0,
      asked: user._count?.AuthoredQuestions || 0,
      answered: user._count?.Answers || 0,
      profileImage: user.profile_image || '../signin,login/img/rafiki.png',
      notifications: notifications.length > 0 ? notifications : ['No notifications yet'],
      tags: tags.length > 0 ? tags : ['javascript', 'python', 'react'],
      questions: questions.map(q => ({
        title: q.title,
        votes: q.score || 0,
        answers: q.answers_count || 0,
        views: q.views || 0,
        tags: q.tags || [],
        url: `../questions/index.html?id=${q.question_id}`,
        createdAt: new Date(q.created_at).getTime()
      })),
      answers: [],
      tagBackgrounds: {
        javascript: 'linear-gradient(135deg, #f7df1e 0%, #d4a017 100%)',
        python: 'linear-gradient(135deg, #3776ab 0%, #ffd43b 100%)',
        react: 'linear-gradient(135deg, #61dafb 0%, #21a1c4 100%)'
      }
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    // If token expired, redirect to login
    if (error.message?.includes('Session expired') || error.message?.includes('Unauthorized')) {
      api.clearTokens();
      window.location.href = '../signin,login/index.html';
    }
    return fallbackUserData;
  }
}

export const fallbackUserData = {
  username: "Guest",
  reputation: 0,
  asked: 0,
  answered: 0,
  profileImage: "../signin,login/img/rafiki.png",
  notifications: ["Welcome to Stack Ghost!"],
  tags: ["javascript", "python", "react"],
  questions: [],
  answers: [],
  tagBackgrounds: {}
};
