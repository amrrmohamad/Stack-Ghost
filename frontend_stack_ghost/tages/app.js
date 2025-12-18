// app.js
import { fetchUserData, fallbackUserData, fetchTags, updateFollowStatus } from "./data.js";

let allTags = [];
let activeSort = "popular";
let searchTerm = "";

document.addEventListener("DOMContentLoaded", async () => {
  // تحميل اليوزر
  const user = await loadUser();
  applyUserData(user);
  setupNotificationDropdown();

  // تحميل التاجات
  allTags = await loadTags();
  initializeTagExperience();
});

async function loadUser() {
  return await fetchUserData();
}

async function loadTags() {
  try {
    const remoteTags = await fetchTags();
    return normalizeTags(remoteTags);
  } catch (error) {
    console.error("Error loading tags:", error);
    return [];
  }
}

// ==========================================
// ** أهم دالة: توحيد شكل البيانات **
// ==========================================
function normalizeTags(tags) {
  return (tags ?? []).map((tag) => ({
    id: tag.tag_id,
    name: tag.tag_name,
    description: tag.description || "No description available.",
    
    // قراءة الأرقام من الحقول القادمة من الباك إند
    questionCount: Number(tag.questions_count || 0),
    followers: Number(tag.followers_count || 0), // <--- قراءة العدد الصحيح هنا
    
    isFollowed: false // سنتركها false حالياً (تتطلب منطق إضافي للتحقق من المستخدم)
  }));
}

function initializeTagExperience() {
  setupTagFilters();
  setupTagSearch();
  setupTagGridInteractions();
  applyTagView();
}

// --- دوال العرض (Rendering) ---

function renderTagGrid(tags) {
  const grid = document.querySelector("[data-tag-grid]");
  const emptyState = document.querySelector("[data-tag-empty]");
  if (!grid) return;

  grid.innerHTML = "";
  
  if (!tags.length) {
    if (emptyState) emptyState.classList.remove("hidden");
    return;
  }

  if (emptyState) emptyState.classList.add("hidden");

  tags.forEach((tag) => {
    grid.appendChild(buildTagCard(tag));
  });
}

function buildTagCard(tag) {
  const card = document.createElement("article");
  card.className = "tag-card glass";

  const header = document.createElement("div");
  header.className = "tag-card__header";
  header.innerHTML = `
    <div class="tag-card__title">
      <span class="tag-card__name">${tag.name}</span>
      ${tag.isFollowed ? '<span class="tag-card__check">✓</span>' : ""}
    </div>
    <div class="tag-card__meta">
      <span class="pill pill--muted">${formatNumber(tag.questionCount)} questions</span>
      <span class="pill pill--muted">${formatNumber(tag.followers)} followers</span>
    </div>
  `;

  // ... (باقي كود الدالة كما هو: description و buttons)
  const description = document.createElement("p");
  description.className = "tag-card__description";
  description.textContent = tag.description;

  const follow = document.createElement("div");
  follow.className = "tag-card__actions";

  const followBtn = document.createElement("button");
  followBtn.type = "button";
  followBtn.dataset.followBtn = tag.id;
  followBtn.className = `tag-card__follow-btn${tag.isFollowed ? " tag-card__follow-btn--checked" : ""}`;
  followBtn.textContent = tag.isFollowed ? "Following" : "Follow";

  follow.appendChild(followBtn);
  card.append(header, description, follow);
  
  return card;
}
// --- دوال الفلترة والبحث ---

function applyTagView() {
  const filtered = filterTags(allTags, searchTerm);
  const sorted = sortTags(filtered, activeSort);
  renderTagGrid(sorted);
}

function filterTags(tags, query) {
  const normalized = (query || "").toLowerCase();
  if (!normalized) return [...tags];
  return tags.filter((tag) => tag.name.toLowerCase().includes(normalized));
}

function sortTags(tags, sortKey) {
  const copy = [...tags];
  if (sortKey === "name") {
    return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
  // Default: Sort by Question Count
  return copy.sort((a, b) => b.questionCount - a.questionCount);
}

// --- التفاعلات (Events) ---

function setupTagFilters() {
  const container = document.querySelector("[data-tags-filter]");
  if (!container) return;

  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll("button").forEach((b) => b.classList.remove("filter-chip--active"));
      btn.classList.add("filter-chip--active");
      activeSort = btn.dataset.sort || "popular";
      applyTagView();
    });
  });
}

function setupTagSearch() {
  const input = document.querySelector("[data-tag-search]");
  const suggestions = document.querySelector("[data-tag-suggestions]");
  if (!input) return;

  input.addEventListener("input", () => {
    searchTerm = input.value.trim();
    if(suggestions) renderSuggestions(suggestions, searchTerm);
    applyTagView();
  });
  
  // إخفاء الاقتراحات عند الضغط خارجها
  document.addEventListener("click", (e) => {
      if(suggestions && !input.contains(e.target) && !suggestions.contains(e.target)) {
          suggestions.innerHTML = "";
      }
  });
}

function renderSuggestions(container, query) {
    if (!query) { container.innerHTML = ""; return; }
    const matches = allTags.filter(t => t.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
    container.innerHTML = matches.map(t => `<li class="suggestion" data-suggestion="${t.name}">${t.name}</li>`).join("");
    
    // تفعيل الضغط على الاقتراح
    container.querySelectorAll(".suggestion").forEach(li => {
        li.addEventListener("click", () => {
            const val = li.dataset.suggestion;
            document.querySelector("[data-tag-search]").value = val;
            searchTerm = val;
            container.innerHTML = "";
            applyTagView();
        });
    });
}

function setupTagGridInteractions() {
  const grid = document.querySelector("[data-tag-grid]");
  if (!grid) return;

  grid.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-follow-btn]");
    if (!button) return;
    
    const tagId = button.dataset.followBtn;
    await toggleFollow(tagId);
  });
}

async function toggleFollow(tagId) {
    // تحديث وهمي سريع (Optimistic UI)
    const index = allTags.findIndex(t => t.id == tagId);
    if(index === -1) return;
    
    const oldState = allTags[index].isFollowed;
    allTags[index].isFollowed = !oldState;
    applyTagView();

    // إرسال للباك إند
    try {
        await updateFollowStatus(tagId, !oldState);
    } catch (e) {
        console.warn("Reverting follow status");
        allTags[index].isFollowed = oldState; // تراجع لو حصل خطأ
        applyTagView();
    }
}

// --- دوال مساعدة عامة ---

function applyUserData(user) {
  if(!user) return;
  // ممكن تستخدم نفس كود البروفايل اللي في الصفحات التانية هنا
  const img = document.getElementById("profile-image");
  if(img) img.src = user.profileImage || "img/rafiki.png";
}

function setupNotificationDropdown() {
    const toggle = document.querySelector("[data-notifications-toggle]");
    const panel = document.querySelector("[data-notifications-panel]");
    if(!toggle || !panel) return;
    
    toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        panel.classList.toggle("notifications__dropdown--open");
    });
    document.addEventListener("click", () => panel.classList.remove("notifications__dropdown--open"));
}

function formatNumber(value) {
  return Number(value).toLocaleString();
}