// All user-facing values pulled from the backend live here.
const USER_ENDPOINT = "/api/user/profile";
const TAG_ENDPOINT = "/api/tags";
const FOLLOW_ENDPOINT = (id) => `/api/tags/${encodeURIComponent(id)}/follow`;

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
  const response = await fetch(USER_ENDPOINT, { credentials: "include" });

  if (!response.ok) {
    throw new Error(`Failed to load user data: ${response.status}`);
  }

  const payload = await response.json();

  return {
    username: payload?.username ?? fallbackUserData.username,
    profileImage: payload?.profileImage ?? fallbackUserData.profileImage,
    reputation: payload?.reputation ?? fallbackUserData.reputation,
    asked: payload?.asked ?? fallbackUserData.asked,
    answered: payload?.answered ?? fallbackUserData.answered,
    about: payload?.about ?? fallbackUserData.about,
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
  const response = await fetch(TAG_ENDPOINT, { credentials: "include" });

  if (!response.ok) {
    throw new Error(`Failed to load tag data: ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload?.tags) ? payload.tags : payload;
}

export async function updateFollowStatus(tagId, shouldFollow) {
  const response = await fetch(FOLLOW_ENDPOINT(tagId), {
    method: shouldFollow ? "POST" : "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ follow: shouldFollow }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update follow status: ${response.status}`);
  }

  const payload = await response.json();
  return payload?.tag ?? null;
}

