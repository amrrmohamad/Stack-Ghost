// All user-facing values pulled from the backend live here.
const USER_ENDPOINT = "/api/user/profile";
const USERS_ENDPOINT = "/api/users";

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

export const fallbackUsers = [
  { id: "54489", username: "Abdulrahman", profileImage: "img/rafiki.png", reputation: 6000, role: "Moderator", isFollowed: true },
  { id: "54490", username: "Leila", profileImage: "img/rafiki.png", reputation: 7200, role: "Admin", isFollowed: false },
  { id: "54491", username: "Omar", profileImage: "img/rafiki.png", reputation: 4100, role: "User", isFollowed: false },
  { id: "54492", username: "Sara", profileImage: "img/rafiki.png", reputation: 5300, role: "Moderator", isFollowed: false },
  { id: "54493", username: "Fatima", profileImage: "img/rafiki.png", reputation: 3800, role: "User", isFollowed: false },
  { id: "54494", username: "Youssef", profileImage: "img/rafiki.png", reputation: 9100, role: "Admin", isFollowed: true },
  { id: "54495", username: "Noor", profileImage: "img/rafiki.png", reputation: 2500, role: "User", isFollowed: false },
  { id: "54496", username: "Mariam", profileImage: "img/rafiki.png", reputation: 4600, role: "User", isFollowed: false },
  { id: "54497", username: "Khalid", profileImage: "img/rafiki.png", reputation: 7800, role: "Moderator", isFollowed: true },
  { id: "54498", username: "Zain", profileImage: "img/rafiki.png", reputation: 5200, role: "User", isFollowed: false },
  { id: "54499", username: "Lina", profileImage: "img/rafiki.png", reputation: 3300, role: "User", isFollowed: false },
  { id: "54500", username: "Hassan", profileImage: "img/rafiki.png", reputation: 8500, role: "Admin", isFollowed: true },
  { id: "54501", username: "Amira", profileImage: "img/rafiki.png", reputation: 2400, role: "User", isFollowed: false },
  { id: "54502", username: "Fadi", profileImage: "img/rafiki.png", reputation: 6900, role: "Moderator", isFollowed: false },
  { id: "54503", username: "Nadia", profileImage: "img/rafiki.png", reputation: 5700, role: "User", isFollowed: false },
  { id: "54504", username: "Rami", profileImage: "img/rafiki.png", reputation: 6400, role: "User", isFollowed: false },
  { id: "54505", username: "Aya", profileImage: "img/rafiki.png", reputation: 4100, role: "User", isFollowed: false },
  { id: "54506", username: "Jamal", profileImage: "img/rafiki.png", reputation: 3050, role: "User", isFollowed: false },
  { id: "54507", username: "Huda", profileImage: "img/rafiki.png", reputation: 7200, role: "Moderator", isFollowed: true },
  { id: "54508", username: "Karim", profileImage: "img/rafiki.png", reputation: 5800, role: "User", isFollowed: false },
  { id: "54509", username: "Rasha", profileImage: "img/rafiki.png", reputation: 4900, role: "User", isFollowed: false },
  { id: "54510", username: "Salim", profileImage: "img/rafiki.png", reputation: 8700, role: "Admin", isFollowed: true },
  { id: "54511", username: "Dina", profileImage: "img/rafiki.png", reputation: 3600, role: "User", isFollowed: false },
  { id: "54512", username: "Samir", profileImage: "img/rafiki.png", reputation: 4400, role: "User", isFollowed: false },
  { id: "54513", username: "Lamia", profileImage: "img/rafiki.png", reputation: 2950, role: "User", isFollowed: false },
  { id: "54514", username: "Bilal", profileImage: "img/rafiki.png", reputation: 5100, role: "Moderator", isFollowed: false },
  { id: "54515", username: "Nada", profileImage: "img/rafiki.png", reputation: 4700, role: "User", isFollowed: false },
  { id: "54516", username: "Tariq", profileImage: "img/rafiki.png", reputation: 7500, role: "Admin", isFollowed: true },
  { id: "54517", username: "Mona", profileImage: "img/rafiki.png", reputation: 5300, role: "User", isFollowed: false },
  { id: "54518", username: "Yara", profileImage: "img/rafiki.png", reputation: 6200, role: "Moderator", isFollowed: false },
];

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

export async function fetchUsers() {
  const response = await fetch(USERS_ENDPOINT, { credentials: "include" });

  if (!response.ok) {
    throw new Error(`Failed to load users: ${response.status}`);
  }

  const payload = await response.json();
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload)) return payload;
  return [];
}
