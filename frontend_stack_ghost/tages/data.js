/**
 * @file data.js
 * @description Data fetching for tags page - connects to backend API
 */

import api from '../js/api.js';

export const fallbackUserData = {
  username: "Guest",
  profileImage: "../signin,login/ghost.png",
  reputation: 0,
  asked: 0,
  answered: 0,
  notifications: [],
  badges: [],
  questions: [
    {
      title: "How to change locale for a vbs script?",
      votes: 3,
      views: 12,
      tags: ["c++"],
      url: "#",
      createdAt: 1733720160000,
    },
    {
      title: "Delete all files and folders in a directory",
      votes: 2,
      views: 9,
      tags: ["css"],
      url: "#",
      createdAt: 1733716560000,
    },
    {
      title: "How can I auto-elevate my batch file?",
      votes: 5,
      views: 22,
      tags: ["html"],
      url: "#",
      createdAt: 1733712960000,
    },
    {
      title: "Using PowerShell to write a file in UTF-8 without the BOM",
      votes: 6,
      views: 28,
      tags: ["sql"],
      url: "#",
      createdAt: 1733709360000,
    },
    {
      title: "Creating batch script to unzip a file without additional zip tools",
      votes: 5,
      views: 19,
      tags: ["php"],
      url: "#",
      createdAt: 1733705760000,
    },
  ],
  answers: [
    {
      title: "How to change locale for a vbs script?",
      excerpt: "Use SetLocale and ensure codepage matches...",
      questionTitle: "How to change locale for a vbs script?",
      votes: 3,
      views: 12,
      url: "#",
      createdAt: 1733720160000,
    },
    {
      title: "Delete all files and folders in a directory",
      excerpt: "You can iterate the FileSystemObject...",
      questionTitle: "Delete all files and folders in a directory",
      votes: 2,
      views: 9,
      url: "#",
      createdAt: 1733716560000,
    },
    {
      title: "Batch file auto-elevate UAC",
      excerpt: "Call powershell -Command \"Start-Process ... -Verb runAs\"",
      questionTitle: "How can I auto-elevate my batch file?",
      votes: 5,
      views: 22,
      url: "#",
      createdAt: 1733712960000,
    },
    {
      title: "UTF-8 without BOM",
      excerpt: "Use Set-Content -Encoding utf8NoBOM ...",
      questionTitle: "Using PowerShell to write a file in UTF-8 without the BOM",
      votes: 6,
      views: 28,
      url: "#",
      createdAt: 1733709360000,
    },
  ],
  tags: ["c++", "php", "sql", "html"],
};

export async function fetchUserData() {
  try {
    if (!api.isAuthenticated()) {
      window.location.href = '../signin,login/index.html';
      return fallbackUserData;
    }

    // Get current user data
    const currentUser = await api.getCurrentUser();
    if (currentUser.success && currentUser.data) {
      const user = currentUser.data;
      return {
        username: user.username || fallbackUserData.username,
        profileImage: user.profile_image || fallbackUserData.profileImage,
        reputation: user.reputation || fallbackUserData.reputation,
        asked: 0, // Will be updated from profile if needed
        answered: 0, // Will be updated from profile if needed
        about: user.bio || fallbackUserData.about,
        notifications: fallbackUserData.notifications,
        badges: fallbackUserData.badges,
        questions: fallbackUserData.questions,
        answers: fallbackUserData.answers,
        tags: fallbackUserData.tags,
      };
    }
    
    return fallbackUserData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    if (error.message?.includes('Session expired') || error.message?.includes('Unauthorized')) {
      api.clearTokens();
      window.location.href = '../signin,login/index.html';
    }
    return fallbackUserData;
  }
}

// Tag data --------------------------------------------------------------
export const fallbackTags = [
  {
    id: "cpp",
    name: "c++",
    description: "A powerful, high-performance programming language for systems and games.",
    questionCount: 16200,
    followers: 9100,
    isFollowed: true,
    createdAt: 1733600160000,
  },
  {
    id: "css",
    name: "css",
    description: "Controls layout, colors, fonts, and visual presentation for the web.",
    questionCount: 13140,
    followers: 8200,
    isFollowed: false,
    createdAt: 1733624160000,
  },
  {
    id: "javascript",
    name: "java script",
    description: "Adds interactivity, logic, and dynamic behavior to web pages.",
    questionCount: 18900,
    followers: 10200,
    isFollowed: true,
    createdAt: 1733648160000,
  },
  {
    id: "html",
    name: "html",
    description: "Markup language for structure of the web. Semantic and performant.",
    questionCount: 14500,
    followers: 8700,
    isFollowed: false,
    createdAt: 1733690160000,
  },
  {
    id: "react",
    name: "react",
    description: "A modern JavaScript library for building fast, reusable UI components.",
    questionCount: 9800,
    followers: 7600,
    isFollowed: false,
    createdAt: 1733714160000,
  },
  {
    id: "sql",
    name: "sql",
    description: "Language for managing and querying structured data in databases.",
    questionCount: 12100,
    followers: 6400,
    isFollowed: true,
    createdAt: 1733738160000,
  },
  {
    id: "php",
    name: "php",
    description: "Server-side scripting language widely used for web backends.",
    questionCount: 8700,
    followers: 5900,
    isFollowed: false,
    createdAt: 1733750160000,
  },
  {
    id: "python",
    name: "python",
    description: "Readable, versatile language loved for data science, AI, and automation.",
    questionCount: 20100,
    followers: 12500,
    isFollowed: true,
    createdAt: 1733762160000,
  },
  {
    id: "flutter",
    name: "flutter",
    description: "Google UI toolkit for building mobile, web, and desktop from one codebase.",
    questionCount: 5400,
    followers: 4200,
    isFollowed: false,
    createdAt: 1733774160000,
  },
  {
    id: "dart",
    name: "dart",
    description: "Optimized language behind Flutter for fast apps and smooth UI rendering.",
    questionCount: 3200,
    followers: 2600,
    isFollowed: false,
    createdAt: 1733786160000,
  },
  {
    id: "nodejs",
    name: "node.js",
    description: "Runtime for building fast, scalable backend services using JavaScript.",
    questionCount: 11100,
    followers: 7300,
    isFollowed: true,
    createdAt: 1733798160000,
  },
];

export async function fetchTags() {
  try {
    if (!api.isAuthenticated()) {
      window.location.href = '../signin,login/index.html';
      return [];
    }

    // Fetch all tags with pagination (fetch more to show all)
    const response = await api.getTags(1, 200, ''); // Fetch up to 200 tags
    
    if (response.success && response.tags) {
      return response.tags.map(tag => ({
        id: tag.tag_id,
        tag_id: tag.tag_id,
        name: tag.tag_name,
        description: tag.description || '',
        questionCount: tag.questionCount || 0,
        followers: tag.followers || 0,
        isFollowed: tag.isFollowed || false,
        createdAt: tag.created_at ? new Date(tag.created_at).getTime() : Date.now()
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    if (error.message?.includes('Session expired') || error.message?.includes('Unauthorized')) {
      api.clearTokens();
      window.location.href = '../signin,login/index.html';
    }
    return [];
  }
}

export async function updateFollowStatus(tagId, shouldFollow) {
  try {
    console.log('Calling toggleFollowTag API for tag:', tagId);
    const response = await api.toggleFollowTag(tagId);
    console.log('Toggle follow tag response:', response);
    
    if (response.success) {
      // The API returns { success: true, status: 'followed' | 'unfollowed', message: '...' }
      const isFollowed = response.status === 'followed';
      
      // Return updated tag data
      const result = {
        tag_id: tagId,
        isFollowed: isFollowed
      };
      
      // Include followers count if provided
      if (response.followers !== undefined) {
        result.followers = response.followers;
      }
      
      console.log('Returning result:', result);
      return result;
    }
    
    // If not successful, log the error details
    console.error('API response was not successful:', response);
    if (response.error) {
      console.error('Error details:', response.error);
    }
    throw new Error(response.message || 'Failed to update follow status');
  } catch (error) {
    console.error('Error updating follow status:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response,
      data: error.data
    });
    throw error;
  }
}

