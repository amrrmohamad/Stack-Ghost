import { fetchUserData, fallbackUserData, fetchBadges, fallbackBadges } from "./data.js";

let cachedUser = null;
let allBadges = [];

document.addEventListener("DOMContentLoaded", async () => {
  cachedUser = await loadUser();
  applyUserData(cachedUser);
  setupNotificationDropdown();

  allBadges = await loadBadges();
  initializeBadgeExperience();
});

async function loadUser() {
  try {
    return await fetchUserData();
  } catch (error) {
    console.warn("Falling back to local user data", error);
    return fallbackUserData;
  }
}

async function loadBadges() {
  try {
    const remoteBadges = await fetchBadges();
    return normalizeBadges(remoteBadges);
  } catch (error) {
    console.warn("Falling back to local badge data", error);
    return normalizeBadges(fallbackBadges);
  }
}

function initializeBadgeExperience() {
  renderBadgeGrid();
}

// -------------------------------
// Data helpers
// -------------------------------
function normalizeBadges(badges) {
  return (badges ?? []).map((badge, index) => ({
    id: badge.id ?? badge.name ?? `badge-${index}`,
    name: badge.name ?? badge.id ?? "badge",
    image: badge.image ?? "",
    description: badge.description ?? "",
    requirements: badge.requirements ?? {
      reputation: 0,
      questions: 0,
      answers: 0,
      acceptedQuestions: 0,
      acceptedAnswers: 0,
    },
  }));
}

function applyUserData(user) {
  document.querySelectorAll("[data-username]").forEach((el) => {
    el.textContent = user.username;
  });
  document.querySelectorAll("[data-reputation]").forEach((el) => {
    el.textContent = formatNumber(user.reputation);
  });
  document.querySelectorAll("[data-asked]").forEach((el) => {
    el.textContent = formatNumber(user.asked);
  });
  document.querySelectorAll("[data-answered]").forEach((el) => {
    el.textContent = formatNumber(user.answered);
  });

  setImage("profile-image", user.profileImage);

  renderList("[data-notifications]", user.notifications, buildNotificationItem);
  renderList("[data-notifications-dropdown]", user.notifications, buildNotificationItem);
}

function setImage(id, src) {
  const el = document.getElementById(id);
  if (el) {
    el.src = src;
  }
}

function renderList(selector, items, builder) {
  const container = document.querySelector(selector);
  if (!container) return;
  container.innerHTML = "";
  items.forEach((item) => container.appendChild(builder(item)));
}

function buildNotificationItem(note) {
  const li = document.createElement("li");
  li.className = "list__item";
  li.textContent = note;
  return li;
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString() : value;
}

// -------------------------------
// Badge page interactions
// -------------------------------
function renderBadgeGrid() {
  const grid = document.querySelector("[data-badge-grid]");
  if (!grid) return;

  grid.innerHTML = "";

  // Display badges in order: Silver, Gold, Diamond (lowest to highest)
  allBadges.forEach((badge) => {
    grid.appendChild(buildBadgeCard(badge));
  });
}

function buildBadgeCard(badge) {
  const card = document.createElement("article");
  card.className = "tag-card glass";

  // Badge image
  const imageContainer = document.createElement("div");
  imageContainer.style.cssText = "display: flex; justify-content: center; margin-bottom: 12px;";
  const image = document.createElement("img");
  image.src = badge.image;
  image.alt = badge.name;
  image.style.cssText = "max-width: 120px; height: auto;";
  imageContainer.appendChild(image);

  // Badge name
  const header = document.createElement("div");
  header.className = "tag-card__header";
  const title = document.createElement("div");
  title.className = "tag-card__title";
  const nameSpan = document.createElement("span");
  nameSpan.className = "tag-card__name";
  nameSpan.textContent = badge.name;
  title.appendChild(nameSpan);
  header.appendChild(title);

  // Description
  const description = document.createElement("p");
  description.className = "tag-card__description";
  description.textContent = badge.description;

  // Requirements section
  const requirements = document.createElement("div");
  requirements.style.cssText = "margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);";
  
  const requirementsTitle = document.createElement("div");
  requirementsTitle.style.cssText = "font-weight: 600; margin-bottom: 8px; color: var(--text);";
  requirementsTitle.textContent = "Requirements:";
  requirements.appendChild(requirementsTitle);

  const requirementsList = document.createElement("div");
  requirementsList.style.cssText = "display: flex; flex-direction: column; gap: 6px;";
  
  const req = badge.requirements;
  const reqItems = [
    { label: "Reputation", value: formatNumber(req.reputation) },
    { label: "Questions", value: formatNumber(req.questions) },
    { label: "Answers", value: formatNumber(req.answers) },
    { label: "Accepted Questions", value: formatNumber(req.acceptedQuestions) },
    { label: "Accepted Answers", value: formatNumber(req.acceptedAnswers) },
  ];

  reqItems.forEach((item) => {
    const reqItem = document.createElement("div");
    reqItem.style.cssText = "display: flex; justify-content: space-between; font-size: 13px; color: var(--muted);";
    const label = document.createElement("span");
    label.textContent = item.label + ":";
    const value = document.createElement("span");
    value.style.cssText = "font-weight: 600; color: var(--text);";
    value.textContent = item.value;
    reqItem.appendChild(label);
    reqItem.appendChild(value);
    requirementsList.appendChild(reqItem);
  });

  requirements.appendChild(requirementsList);

  card.append(imageContainer, header, description, requirements);
  return card;
}

// -------------------------------
// Shared UI helpers
// -------------------------------
function setupNotificationDropdown() {
  const toggle = document.querySelector("[data-notifications-toggle]");
  const panel = document.querySelector("[data-notifications-panel]");
  if (!toggle || !panel) return;

  const closePanel = () => {
    panel.classList.remove("notifications__dropdown--open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = panel.classList.toggle("notifications__dropdown--open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (e) => {
    if (panel.contains(e.target) || toggle.contains(e.target)) return;
    closePanel();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
  });
}

