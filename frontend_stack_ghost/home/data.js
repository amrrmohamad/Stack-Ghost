/**
 * @file data.js
 * @description Data fetching for home page - connects to backend API
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

    // Fetch questions
    const questionsResponse = await api.getQuestions(1, 20);
    const questions = questionsResponse.data || [];

    // Fetch user's notifications
    let notifications = [];
    try {
      const notifResponse = await api.getNotifications(user.user_id, 1, 5);
      notifications = notifResponse.data?.map(n => n.content) || [];
    } catch (error) {
      console.warn('Could not fetch notifications:', error);
    }

    // Fetch tags that user follows
    let followedTags = [];
    try {
      const tagsResponse = await api.getFollowing(user.user_id, 1, 10);
      if (tagsResponse.success) {
        // Try to get followed tags
        try {
          const userTagsResponse = await fetch(`http://localhost:3000/api/users/${user.user_id}/tags`);
          if (userTagsResponse.ok) {
            const tagData = await userTagsResponse.json();
            followedTags = tagData.data?.map(t => t.tag_name) || [];
          }
        } catch (e) {
          console.warn('Could not fetch followed tags:', e);
        }
      }
    } catch (error) {
      console.warn('Could not fetch tags:', error);
    }

    // If no followed tags, get popular tags
    if (followedTags.length === 0) {
      try {
        const tagsResponse = await api.getTags(1, 10);
        followedTags = tagsResponse.tags?.slice(0, 5).map(t => t.tag_name) || [];
      } catch (error) {
        console.warn('Could not fetch popular tags:', error);
      }
    }

    return {
      user_id: user.user_id,
      username: user.username || 'User',
      reputation: user.reputation || 0,
      asked: user._count?.AuthoredQuestions || 0,
      answered: user._count?.Answers || 0,
      profileImage: user.profile_image || 'ghost.png',
      email: user.email || '',
      notifications: notifications.length > 0 ? notifications : ['No new notifications'],
      tags: followedTags.length > 0 ? followedTags : ['javascript', 'python', 'react'],
      questions: questions.map(q => {
        // Handle author object from API
        const authorObj = q.author || q.Author || {};
        const authorUsername = authorObj.username || 'Unknown';
        const authorId = authorObj.user_id || null;

        return {
          question_id: q.question_id,
          title: q.title,
          summary: q.summary,
          votes: q.score || 0,
          answers: q.answers_count || 0,
          views: q.views || 0,
          tags: q.tags || [],
          author: authorUsername,
          author_id: authorId,
          author_username: authorUsername,
          is_closed: q.is_closed,
          created_at: q.created_at,
          url: `../question_review/question.html?id=${q.question_id}`,
          createdAt: new Date(q.created_at).getTime()
        };
      }),
      answers: [] // Can be populated if needed
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
  answers: []
};
