// All user-facing values pulled from the backend live here.
const USER_ENDPOINT = "/api/user/profile";

export const fallbackUserData = {
  username: "Amr",
  profileImage: "img/rafiki.png",
  reputation: 5000,
  asked: 100,
  answered: 50,
  followers: 2300,
  following: 180,
  about:
    "Expert in distributed systems and service-oriented architectures (microservices, event-driven, CQRS).",
  tags: ["c++", "php", "sql", "html"],
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
  posts: [
    { title: "Problem with WebGL and unity input system", username: "Amr" },
    { title: "Java UUID generation (name-based, predictable)", username: "Amr" },
  ],
  questions: [
    {
      title: "Can System.Text.Json.Serialization detect long reference cycles?",
      votes: 5,
      views: 312,
      tags: ["c++", "sql"],
      answers: 4,
      excerpt:
        "I'm learning to use jeuclid-core-3.1.9 in java using the Netbeans development platform with Maven.",
      createdAt: "2025-12-09T02:16:00Z",
      url: "#",
    },
    {
      title: "Avoiding duplicated Spring Bean classes",
      votes: 3,
      views: 210,
      tags: ["php", "css"],
      answers: 2,
      excerpt:
        "All dependencies were generated automatically and I need to avoid duplication while keeping configurations clean.",
      createdAt: "2025-12-08T02:16:00Z",
      url: "#",
    },
    {
      title: "Why my query is slow?",
      votes: 0,
      views: 102,
      tags: ["sql"],
      answers: 1,
      excerpt: "A complex SQL query is performing slowly even with indexes; looking for tuning tips.",
      createdAt: "2025-12-07T02:16:00Z",
      url: "#",
    },
    {
      title: "How to debounce input in React?",
      votes: -1,
      views: 88,
      tags: ["html"],
      answers: 0,
      excerpt: "Need a clean pattern to debounce controlled inputs in React without extra rerenders.",
      createdAt: "2025-12-06T02:16:00Z",
      url: "#",
    },
  ],
  answers: [
    {
      snippet: "Use a binary semaphore to guard access",
      questionTitle: "How to change locale for a vbs script?",
      votes: 5,
      views: 402,
      createdAt: "2025-12-09T02:16:00Z",
      url: "#",
    },
    {
      snippet: "You can memoize this selector",
      questionTitle: "Delete all files and folders in a directory",
      votes: 3,
      views: 280,
      createdAt: "2025-12-08T02:16:00Z",
      url: "#",
    },
    {
      snippet: "Check your CORS policy",
      questionTitle: "How can I auto-elevate my batch file?",
      votes: 0,
      views: 190,
      createdAt: "2025-12-07T02:16:00Z",
      url: "#",
    },
    {
      snippet: "Consider batching writes",
      questionTitle: "Using PowerShell to write a file in UTF-8 without the BOM",
      votes: -1,
      views: 120,
      createdAt: "2025-12-06T02:16:00Z",
      url: "#",
    },
  ],
  tagCards: [
    { name: "c++", posts: 2, url: "#" },
    { name: "css", posts: 2, url: "#" },
    { name: "html", posts: 2, url: "#" },
    { name: "sql", posts: 2, url: "#" },
    { name: "php", posts: 2, url: "#" },
  ],
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
    followers: payload?.followers ?? fallbackUserData.followers,
    following: payload?.following ?? fallbackUserData.following,
    about: payload?.about ?? fallbackUserData.about,
    tags: Array.isArray(payload?.tags) && payload.tags.length ? payload.tags : fallbackUserData.tags,
    notifications:
      Array.isArray(payload?.notifications) && payload.notifications.length
        ? payload.notifications
        : fallbackUserData.notifications,
    badges: Array.isArray(payload?.badges) && payload.badges.length ? payload.badges : fallbackUserData.badges,
    posts: Array.isArray(payload?.posts) && payload.posts.length ? payload.posts : fallbackUserData.posts,
    questions:
      Array.isArray(payload?.questions) && payload.questions.length
        ? payload.questions
        : fallbackUserData.questions,
    answers:
      Array.isArray(payload?.answers) && payload.answers.length ? payload.answers : fallbackUserData.answers,
    tagCards:
      Array.isArray(payload?.tagCards) && payload.tagCards.length ? payload.tagCards : fallbackUserData.tagCards,
  };
}

