// All user-facing values pulled from the backend live here.
import api from '../js/api.js';

export const fallbackUserData = {
  username: "Amr",
  profileImage: "img/rafiki.png",
  reputation: 5000,
  asked: 100,
  answered: 50,
  about:
    "Expert in distributed systems and service-oriented architectures (microservices, event-driven, CQRS).",
  notifications: [
    "your answer has been accepted..",
    "your question has been accepte..",
    "you clamed a silver ghost badg..",
  ],
  badges: [
    { label: "Bronze", icon: "img/vector-5.svg" },
    { label: "Silver", icon: "img/vector-6.svg" },
    { label: "Gold", icon: "img/vector-7.svg" },
  ],
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
    // Check if user is authenticated
    if (!api.isAuthenticated()) {
      window.location.href = '../signin,login/index.html';
      return fallbackUserData;
    }

    // Fetch current user data
    const userResponse = await api.getCurrentUser();
    const user = userResponse.data;

    return {
      username: user.username || fallbackUserData.username,
      profileImage: user.profile_image || fallbackUserData.profileImage,
      reputation: user.reputation || fallbackUserData.reputation,
      asked: user._count?.AuthoredQuestions || fallbackUserData.asked,
      answered: user._count?.Answers || fallbackUserData.answered,
      about: user.about || fallbackUserData.about,
      notifications: fallbackUserData.notifications,
      badges: fallbackUserData.badges,
      questions: fallbackUserData.questions,
      answers: fallbackUserData.answers,
      tags: fallbackUserData.tags,
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

export const fallbackQuestionData = {
  id: "1",
  title: "How to implement authentication in React with JWT tokens?",
  body: `I'm trying to implement [BB]authentication[!BB] in my React application using JWT tokens. 
I've been following some tutorials but I'm not sure about the best practices.

[CODE]
const token = localStorage.getItem('token');
if (token) {
  // How should I validate this?
}
[!CODE]

What are the [UL]security considerations[!UL] I should keep in mind?`,
  votes: 42,
  tags: ["react", "jwt", "authentication", "security"],
  author: {
    name: "John Doe",
    image: "img/rafiki.png",
    reputation: 1250,
    role: null, // "Admin" or "Moderator" or null
  },
  comments: [
    {
      id: "1",
      author: "Jane Smith",
      time: "2 hours ago",
      text: "Have you considered using httpOnly cookies instead?",
    },
    {
      id: "2",
      author: "Mike Johnson",
      time: "5 hours ago",
      text: "Check out the React Context API for state management.",
    },
    {
      id: "3",
      author: "Alice Cooper",
      time: "6 hours ago",
      text: "You should also check out refresh token rotation for better security.",
    },
    {
      id: "4",
      author: "Bob Martinez",
      time: "8 hours ago",
      text: "Consider implementing rate limiting on authentication endpoints.",
    },
  ],
  answers: [
    {
      id: "1",
      body: `The best practice is to store JWT tokens in [BB]httpOnly cookies[!BB] rather than localStorage 
to prevent XSS attacks. Here's a secure implementation:

[CODE]
// Server-side: Set httpOnly cookie
res.cookie('token', jwt.sign(payload, secret), {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});
[!CODE]

This ensures the token cannot be accessed via JavaScript.`,
      votes: 28,
      accepted: true,
      author: {
        name: "Sarah Williams",
        image: "img/rafiki.png",
        reputation: 3500,
        role: null,
      },
      comments: [
        {
          id: "1",
          author: "Tom Brown",
          time: "1 hour ago",
          text: "Great answer! Also consider token refresh strategies.",
        },
        {
          id: "2",
          author: "Alex Green",
          time: "3 hours ago",
          text: "What about CSRF protection?",
        },
        {
          id: "3",
          author: "Charlie Davis",
          time: "5 hours ago",
          text: "You can use CSRF tokens along with httpOnly cookies for complete protection.",
        },
      ],
    },
    {
      id: "2",
      body: `You can also use React Context to manage authentication state globally. 
Create an [BB]AuthContext[!BB] that wraps your app.`,
      votes: 15,
      accepted: false,
      author: {
        name: "David Lee",
        image: "img/rafiki.png",
        reputation: 890,
        role: null,
      },
      comments: [
        {
          id: "1",
          author: "Emma Wilson",
          time: "4 hours ago",
          text: "Good point about Context API!",
        },
      ],
    },
    {
      id: "3",
      body: `Don't forget to implement token expiration and refresh logic. 
Set a reasonable expiration time and handle token refresh automatically.`,
      votes: 8,
      accepted: false,
      author: {
        name: "Chris Taylor",
        image: "img/rafiki.png",
        reputation: 1200,
        role: null,
      },
      comments: [],
    },
  ],
  popularQuestions: [
    { id: "1", title: "How to optimize React performance?" },
    { id: "2", title: "Best practices for TypeScript in React" },
    { id: "3", title: "Understanding React hooks lifecycle" },
    { id: "4", title: "State management: Redux vs Context API" },
  ],
};

export async function fetchQuestionData(questionId) {
  try {
    // Fetch question - views are automatically incremented by backend
    const questionResponse = await api.getQuestionById(questionId);
    if (!questionResponse.success || !questionResponse.data) {
      throw new Error('Question not found');
    }

    const q = questionResponse.data;
    const author = q.Author || {};
    const tags = (q.Question_Tags || []).map(qt => qt.Tags?.tag_name).filter(Boolean);

    // Debug: Log the question data to see what we're getting
    console.log('Question data from API:', {
      question_id: q.question_id,
      vote_count: q.vote_count,
      vote_count_type: typeof q.vote_count,
      Votes: q.Votes,
      VotesLength: q.Votes?.length,
      VotesArray: Array.isArray(q.Votes) ? q.Votes : 'not an array'
    });

    // Fetch comments for question
    let questionComments = [];
    try {
      const commentsResponse = await api.getComments(questionId, null);
      if (commentsResponse.success && commentsResponse.data) {
        questionComments = commentsResponse.data.map(c => ({
          id: c.comment_id,
          author: c.Users?.username || 'Unknown',
          time: c.created_at ? formatTimeAgo(new Date(c.created_at)) : 'Recently',
          text: c.body
        }));
      }
    } catch (error) {
      console.warn('Could not fetch question comments:', error);
    }

    // Fetch answers
    let answers = [];
    try {
      const answersResponse = await api.getAnswers(questionId, 1, 100);
      if (answersResponse.success && answersResponse.data) {
        answers = await Promise.all(answersResponse.data.map(async (a) => {
          // Fetch comments for each answer
          let answerComments = [];
          try {
            const answerCommentsResponse = await api.getComments(null, a.answer_id);
            if (answerCommentsResponse.success && answerCommentsResponse.data) {
              answerComments = answerCommentsResponse.data.map(c => ({
                id: c.comment_id,
                author: c.Users?.username || 'Unknown',
                time: c.created_at ? formatTimeAgo(new Date(c.created_at)) : 'Recently',
                text: c.body
              }));
            }
          } catch (error) {
            console.warn(`Could not fetch comments for answer ${a.answer_id}:`, error);
          }

          // Get vote count for answer
          const answerVotes = (a.Votes || []).reduce((acc, v) => acc + (v.vote_type || 0), 0);

          return {
            id: a.answer_id,
            body: a.body,
            votes: answerVotes,
            accepted: a.is_accepted || false,
            author_id: a.user_id || a.Users?.user_id,
            author: {
              user_id: a.user_id || a.Users?.user_id,
              name: a.Users?.username || 'Unknown',
              image: a.Users?.profile_image || '../signin,login/ghost.png',
              reputation: a.Users?.reputation || 0,
              role: a.Users?.Roles?.role_name || null,
            },
            comments: answerComments
          };
        }));
      }
    } catch (error) {
      console.warn('Could not fetch answers:', error);
    }

    // Check vote status for question
    let questionVoteStatus = null;
    try {
      const voteStatusResponse = await api.checkVoteStatus(questionId, null);
      if (voteStatusResponse.success && voteStatusResponse.data) {
        questionVoteStatus = voteStatusResponse.data.vote_type === 1 ? 'up' :
          voteStatusResponse.data.vote_type === -1 ? 'down' : null;
      }
    } catch (error) {
      console.warn('Could not fetch vote status:', error);
    }

    // Calculate vote count - prioritize vote_count from backend, fallback to Votes array
    let voteCount = 0;

    // First try to use vote_count from backend response (this is calculated by the controller)
    if (q.vote_count !== undefined && q.vote_count !== null) {
      voteCount = Number(q.vote_count);
      if (isNaN(voteCount)) {
        console.warn('vote_count is not a valid number:', q.vote_count);
        voteCount = 0;
      }
    }
    // If not available, calculate from Votes array
    else if (q.Votes && Array.isArray(q.Votes)) {
      if (q.Votes.length > 0) {
        voteCount = q.Votes.reduce((acc, v) => {
          const voteType = Number(v.vote_type) || 0;
          return acc + voteType;
        }, 0);
      }
      // If Votes array is empty, voteCount stays 0
    }

    console.log('Final calculated vote count:', voteCount, {
      'from vote_count': q.vote_count,
      'from Votes array': q.Votes,
      'Votes length': q.Votes?.length || 0
    });

    // Ensure voteCount is always a number
    const finalVoteCount = Number(voteCount);
    const safeVoteCount = isNaN(finalVoteCount) ? 0 : finalVoteCount;

    console.log('Returning question data with vote count:', safeVoteCount);

    return {
      id: q.question_id,
      title: q.title,
      body: q.body,
      votes: safeVoteCount, // Always ensure it's a number
      views: q.views_count || 0,
      is_closed: q.is_closed || false,
      tags: tags,
      author: {
        user_id: author.user_id || q.user_id,
        name: author.username || 'Unknown',
        image: author.profile_image || '../signin,login/ghost.png',
        reputation: author.reputation || 0,
        role: author.Roles?.role_name || null,
      },
      comments: questionComments,
      answers: answers,
      voteStatus: questionVoteStatus,
      popularQuestions: []
    };
  } catch (error) {
    console.error("Error fetching question data:", error);
    return fallbackQuestionData;
  }
}

function formatTimeAgo(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

