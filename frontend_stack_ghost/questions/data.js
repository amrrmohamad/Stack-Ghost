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
    const userId = user.user_id;

    // Fetch all questions from database
    let userQuestions = [];
    let followedTags = [];

    try {
      // Get complete profile for followed tags
      const profileResponse = await api.getCompleteProfile(userId);
      if (profileResponse.success && profileResponse.data) {
        // Get followed tags
        followedTags = (profileResponse.data.followedTags || []).map(t => ({
          tag_id: t.tag_id,
          name: t.tag_name || t.name,
          description: t.description || '',
          posts: t.posts || t.questionCount || 0
        }));
      }
    } catch (error) {
      console.warn('Could not fetch profile for tags:', error);
    }

    // Fetch ALL questions from database
    try {
      const questionsResponse = await api.getQuestions(1, 100);
      if (questionsResponse.success && questionsResponse.data) {
        // Get all questions (no filter by user_id)
        userQuestions = questionsResponse.data.map(q => {
          const authorObj = q.author || q.Author || {};
          const authorName = authorObj.username || 'Unknown';
          const authorId = authorObj.user_id || null;
          
          return {
            question_id: q.question_id,
            title: q.title,
            summary: q.summary || q.body?.substring(0, 150) || '',
            votes: q.score || q.votes || 0,
            answers: q.answers_count || q.answers || 0,
            views: q.views_count || q.views || 0,
            tags: q.tags || [],
            is_closed: q.is_closed || false,
            created_at: q.created_at,
            createdAt: q.created_at ? new Date(q.created_at).getTime() : Date.now(),
            author: authorName,
            author_id: authorId,
            url: `question-detail.html?id=${q.question_id}`
          };
        });
      }
    } catch (qError) {
      console.error('Error fetching questions:', qError);
    }

    // Fetch user's notifications
    let notifications = [];
    try {
      const notifResponse = await api.getNotifications(userId, 1, 5);
      notifications = notifResponse.data?.map(n => n.content) || [];
    } catch (error) {
      console.warn('Could not fetch notifications:', error);
    }

    // If no followed tags from profile, try to get them from tags endpoint
    if (followedTags.length === 0) {
      try {
        const tagsResponse = await api.getTags(1, 100);
        if (tagsResponse.success && tagsResponse.tags) {
          // Get tags that user is following (this would need a separate endpoint)
          // For now, we'll show all tags as a fallback
          followedTags = tagsResponse.tags.slice(0, 10).map(t => ({
            tag_id: t.tag_id,
            name: t.tag_name,
            description: t.description || '',
            posts: t.questionCount || 0
          }));
        }
      } catch (error) {
        console.warn('Could not fetch followed tags:', error);
      }
    }

    return {
      username: user.username || 'User',
      reputation: user.reputation || 0,
      asked: user._count?.AuthoredQuestions || userQuestions.length || 0,
      answered: user._count?.Answers || 0,
      profileImage: user.profile_image || '../signin,login/ghost.png',
      notifications: notifications.length > 0 ? notifications : ['No notifications yet'],
      tags: followedTags.map(t => t.name),
      followedTags: followedTags,
      questions: userQuestions,
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
