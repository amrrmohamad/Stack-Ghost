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

