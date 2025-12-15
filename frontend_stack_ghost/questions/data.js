// All user-facing values pulled from the backend live here.
const USER_ENDPOINT = "/api/user/profile";

export const fallbackUserData = {
  username: "Amr",
  profileImage: "img/rafiki.png",
  reputation: 5000,
  asked: 100,
  answered: 50,
  about:
    "Expert in distributed systems and service-oriented architectures (microservices, event-driven, CQRS).",
  tagBackgrounds: {
    php: "linear-gradient(135deg, rgba(255, 184, 122, 0.32), rgba(255, 143, 82, 0.22))",
    "c++": "linear-gradient(135deg, rgba(123, 199, 255, 0.3), rgba(85, 139, 255, 0.28))",
    sql: "linear-gradient(135deg, rgba(176, 122, 255, 0.28), rgba(118, 77, 192, 0.26))",
    html: "linear-gradient(135deg, rgba(255, 204, 158, 0.3), rgba(255, 153, 102, 0.26))",
    css: "linear-gradient(135deg, rgba(124, 190, 255, 0.26), rgba(102, 153, 255, 0.24))",
    javascript: "linear-gradient(135deg, rgba(255, 227, 107, 0.32), rgba(255, 193, 79, 0.24))",
    react: "linear-gradient(135deg, rgba(129, 232, 255, 0.3), rgba(83, 196, 255, 0.22))",
    devops: "linear-gradient(135deg, rgba(132, 222, 203, 0.3), rgba(86, 173, 152, 0.24))",
  },
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
      answers: 1,
      tags: ["c++"],
      url: "#",
      createdAt: 1733720160000,
    },
    {
      title: "Delete all files and folders in a directory",
      votes: 2,
      views: 9,
      answers: 0,
      tags: ["css"],
      url: "#",
      createdAt: 1733716560000,
    },
    {
      title: "How can I auto-elevate my batch file?",
      votes: 5,
      views: 22,
      answers: 4,
      tags: ["html"],
      url: "#",
      createdAt: 1733712960000,
    },
    {
      title: "Using PowerShell to write a file in UTF-8 without the BOM",
      votes: 6,
      views: 28,
      answers: 2,
      tags: ["sql"],
      url: "#",
      createdAt: 1733709360000,
    },
    {
      title: "Creating batch script to unzip a file without additional zip tools",
      votes: 5,
      views: 19,
      answers: 1,
      tags: ["php"],
      url: "#",
      createdAt: 1733705760000,
    },
    {
      title: "Handling websocket reconnects in a React dashboard",
      votes: 18,
      views: 64,
      answers: 3,
      tags: ["javascript", "react"],
      url: "#",
      createdAt: 1733745360000,
    },
    {
      title: "Optimize SQL query that joins large partitioned tables",
      votes: 12,
      views: 71,
      answers: 5,
      tags: ["sql"],
      url: "#",
      createdAt: 1733734560000,
    },
    {
      title: "Styling shadow DOM components with global design tokens",
      votes: 7,
      views: 33,
      answers: 1,
      tags: ["css", "javascript"],
      url: "#",
      createdAt: 1733730960000,
    },
    {
      title: "Zero-downtime deploy with blue/green on Kubernetes",
      votes: 9,
      views: 54,
      answers: 2,
      tags: ["devops"],
      url: "#",
      createdAt: 1733727360000,
    },
    {
      title: "React Suspense for data fetching with server streams",
      votes: 15,
      views: 80,
      answers: 6,
      tags: ["react", "javascript"],
      url: "#",
      createdAt: 1733723760000,
    },
    {
      title: "Escaping user input safely when rendering HTML emails",
      votes: 4,
      views: 25,
      answers: 2,
      tags: ["html", "php"],
      url: "#",
      createdAt: 1733702160000,
    },
    {
      title: "Batch inserting with EF Core while keeping order guarantees",
      votes: 8,
      views: 41,
      answers: 3,
      tags: ["c++", "devops"],
      url: "#",
      createdAt: 1733698560000,
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
  tags: ["c++", "php", "sql", "html", "css", "javascript", "react", "devops"],
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
    tagBackgrounds: payload?.tagBackgrounds ?? fallbackUserData.tagBackgrounds,
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

