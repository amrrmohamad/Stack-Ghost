// All user-facing values pulled from the backend live here.
const API_BASE = "http://localhost:3000";
const USER_ENDPOINT = `${API_BASE}/api/users/me`;
const QUESTIONS_ENDPOINT = `${API_BASE}/api/questions`;
const REPORTS_ENDPOINT = `${API_BASE}/api/reports`;

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
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(USER_ENDPOINT, { 
      credentials: "include",
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load user data: ${response.status}`);
    }

    const result = await response.json();
    const payload = result.data || result;

    return {
      username: payload?.username ?? fallbackUserData.username,
      profileImage: payload?.profile_image_url ?? payload?.profileImage ?? fallbackUserData.profileImage,
      reputation: payload?.reputation ?? fallbackUserData.reputation,
      asked: payload?.asked ?? fallbackUserData.asked,
      answered: payload?.answered ?? fallbackUserData.answered,
      about: payload?.bio ?? payload?.about ?? fallbackUserData.about,
      notifications:
        Array.isArray(payload?.notifications) && payload.notifications.length
          ? payload.notifications
          : fallbackUserData.notifications,
      badges: Array.isArray(payload?.badges) && payload.badges.length ? payload.badges : fallbackUserData.badges,
      questions:
        Array.isArray(payload?.questions) && payload.questions.length
          ? payload.questions
          : fallbackUserData.questions,
      answers:
        Array.isArray(payload?.answers) && payload.answers.length ? payload.answers : fallbackUserData.answers,
      tags: Array.isArray(payload?.tags) && payload.tags.length ? payload.tags : fallbackUserData.tags,
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return fallbackUserData;
  }
}

// Question data structure
const QUESTION_ENDPOINT = "/api/questions";

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
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`${QUESTIONS_ENDPOINT}/${questionId}`, {
      credentials: "include",
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load question data: ${response.status}`);
    }

    const result = await response.json();
    const payload = result.data || result;

    return {
      id: payload?.question_id ?? payload?.id ?? fallbackQuestionData.id,
      title: payload?.title ?? fallbackQuestionData.title,
      body: payload?.body ?? fallbackQuestionData.body,
      votes: payload?.vote_count ?? payload?.votes ?? fallbackQuestionData.votes,
      tags: Array.isArray(payload?.tags) && payload.tags.length
        ? payload.tags
        : fallbackQuestionData.tags,
      author: {
        name: payload?.author?.username ?? payload?.author?.name ?? fallbackQuestionData.author.name,
        image: payload?.author?.profile_image_url ?? payload?.author?.image ?? fallbackQuestionData.author.image,
        reputation: payload?.author?.reputation ?? fallbackQuestionData.author.reputation,
        role: payload?.author?.role_name ?? payload?.author?.role ?? fallbackQuestionData.author.role,
      },
      comments: Array.isArray(payload?.comments) && payload.comments.length
        ? payload.comments
        : fallbackQuestionData.comments,
      answers: Array.isArray(payload?.answers) && payload.answers.length
        ? payload.answers
        : fallbackQuestionData.answers,
      popularQuestions: Array.isArray(payload?.popularQuestions) && payload.popularQuestions.length
        ? payload.popularQuestions
        : fallbackQuestionData.popularQuestions,
    };
  } catch (error) {
    console.warn("Falling back to local question data", error);
    return fallbackQuestionData;
  }
}

/**
 * Fetch all questions from backend
 */
export async function fetchAllQuestions() {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`${QUESTIONS_ENDPOINT}?limit=100`, {
      credentials: "include",
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load questions: ${response.status}`);
    }

    const result = await response.json();
    console.log('Questions API response:', result);
    
    const questions = result.data || result.questions || [];
    console.log('Questions array:', questions);
    
    return questions.map(q => ({
      id: q.question_id || q.id,
      title: q.title,
      body: q.body,
      userId: q.Author?.user_id || q.user_id || 0,
      username: q.Author?.username || q.username || 'Unknown',
      userImage: q.Author?.profile_image || q.userImage || '../signin,login/ghost.png',
      is_closed: q.is_closed || false,
      created_at: q.created_at
    }));
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
}

/**
 * Fetch all reports from backend
 */
export async function fetchAllReports() {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`${REPORTS_ENDPOINT}?limit=100`, {
      credentials: "include",
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load reports: ${response.status}`);
    }

    const result = await response.json();
    console.log('Reports API response:', result);
    
    const reports = result.data || result.reports || [];
    console.log('Reports array:', reports);
    
    return reports.map(r => ({
      id: r.report_id || r.id,
      questionId: r.question_id,
      answerId: r.answer_id,
      reportingUser: r.Users?.username || 'Unknown',
      reportedUser: 'Reported User', // We need to get this from the question/answer author
      reason: r.reason,
      body: r.description || r.body || '',
      status: r.status || 'pending',
      created_at: r.created_at
    }));
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
}

/**
 * Close a question (admin/moderator only)
 */
export async function closeQuestion(questionId) {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`${QUESTIONS_ENDPOINT}/${questionId}/close`, {
      method: 'PATCH',
      credentials: "include",
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to close question: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error closing question:', error);
    throw error;
  }
}

/**
 * Update report status (admin/moderator only)
 */
export async function updateReportStatus(reportId, status) {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`${REPORTS_ENDPOINT}/${reportId}/status`, {
      method: 'PUT',
      credentials: "include",
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error(`Failed to update report status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating report status:', error);
    throw error;
  }
}

