import { fallbackUserData } from "./data.js";

// ==========================================
// 1. إعدادات الروابط (Configuration)
// ==========================================
const API_BASE = "http://localhost:3000/api";
const ENDPOINTS = {
  USER: `${API_BASE}/users/me`,       // لتعديل البروفايل
  QUESTIONS: `${API_BASE}/questions`, // لجلب الأسئلة
};

const QUESTIONS_PER_PAGE = 7;

// حالة العرض الحالية (State)
const viewState = {
  sort: "newest",
  tag: null,
  page: 1,
};

let cachedUser = null;

// ==========================================
// 2. التشغيل عند فتح الصفحة (Main Execution)
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  // أ. تحميل بيانات المستخدم
  cachedUser = await loadUser();
  if (cachedUser) {
    applyUserData(cachedUser);
  }

  // ب. تفعيل التفاعلات في الصفحة
  setupNavigation();          // <-- الجديد: تشغيل زراير الانتقال
  setupPanelSwitching();      // تشغيل تابات البروفايل
  setupFilters();             // تشغيل فلاتر الأسئلة
  setupNotificationDropdown();
  setupTagRemoval();
  setupQuestionsInteractions(); // تشغيل الضغط على التاجات والصفحات

  // ج. تحميل وعرض الأسئلة من السيرفر
  await renderQuestionsList(); 
});

// ==========================================
// 3. دوال الـ API (Fetching Data)
// ==========================================

// --- تحميل المستخدم ---
async function loadUser() {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        // لو مفيش توكن، رجعه يسجل دخول (أو خليه زائر حسب رغبتك)
        window.location.href = "../signin,login/index.html"; 
        return null;
    }

    const response = await fetch(ENDPOINTS.USER, {
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
    });

    if (!response.ok) throw new Error("Failed to load user");

    const result = await response.json();
    const dbUser = result.data;

    // دمج البيانات (Mapping)
    return {
      ...fallbackUserData,
      username: dbUser.username,
      email: dbUser.email,
      profileImage: dbUser.profile_image || fallbackUserData.profileImage,
      reputation: dbUser.reputation || 0,
      // الأسئلة والاجابات في البروفايل لسه معملنالهاش Endpoint خاصة، فمؤقتاً هناخدها من fallback
      questions: fallbackUserData.questions, 
      answers: fallbackUserData.answers
    };
  } catch (error) {
    console.warn("Auth Error:", error);
    // لو حصل خطأ، رجعه يسجل دخول
    window.location.href = "../signin,login/index.html";
    return null;
  }
}

// --- تحميل الأسئلة ---
async function fetchQuestionsFromAPI(page = 1) {
  try {
    const url = new URL(ENDPOINTS.QUESTIONS);
    url.searchParams.append("page", page);
    url.searchParams.append("limit", QUESTIONS_PER_PAGE);
    
    // إضافة الفلاتر لو موجودة
    if (viewState.sort) url.searchParams.append("sort", viewState.sort);
    if (viewState.tag) url.searchParams.append("tag", viewState.tag);

    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch questions");

    const result = await response.json();
    
    // التأكد من شكل البيانات اللي راجعة من الباك إند
    return {
      questions: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
      totalPages: result.totalPages || 1
    };
  } catch (error) {
    console.error("Error fetching questions:", error);
    return { questions: [], total: 0, totalPages: 0 };
  }
}

// ==========================================
// 4. دوال التنقل (Navigation) - طلبك الأساسي
// ==========================================
function setupNavigation() {
  
  // 1. زرار "Explore Questions" (الأساسي)
  const exploreBtn = document.querySelector(".hero__actions .btn--primary");
  if (exploreBtn) {
    exploreBtn.addEventListener("click", () => {
      // وديه لصفحة الأسئلة (تأكد إنك عملت ملف questions.html)
      window.location.href = "../questions/index.html"; 
    });
  }

  // 2. زرار "Ask Question" (الشفاف + اللي في الهيدر)
  const askBtns = document.querySelectorAll(".hero__actions .btn--ghost, [data-ask-question]");
  askBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      // وديه لصفحة إضافة سؤال (تأكد إنك عملت ملف ask.html)
      window.location.href = "../ask/index.html"; 
    });
  });

  // 3. البحث (Search Bar)
  const searchInput = document.querySelector(".search input");
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && searchInput.value.trim() !== "") {
        const query = encodeURIComponent(searchInput.value.trim());
        window.location.href = `search.html?q=${query}`;
      }
    });
  }
}

// ==========================================
// 5. دوال العرض (Rendering UI)
// ==========================================

async function renderQuestionsList() {
  const container = document.querySelector("[data-questions-list]"); // الكلاس اللي في HTML
  const pagination = document.querySelector("[data-pagination]");
  
  if (!container) return; // لو مش في الصفحة الرئيسية اخرج

  // عرض Loading
  container.innerHTML = `<div style="text-align:center; padding: 20px; color:#aaa;">Loading posts...</div>`;

  // جلب البيانات
  const data = await fetchQuestionsFromAPI(viewState.page);

  container.innerHTML = ""; // تنظيف

  if (data.questions.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 20px; color:#aaa;">No questions found.</div>`;
    if(pagination) pagination.innerHTML = "";
    return;
  }

  // رسم الكروت
  data.questions.forEach(q => {
    container.appendChild(buildQuestionCard(q));
  });

  // رسم الترقيم
  const totalPages = data.totalPages || Math.ceil(data.total / QUESTIONS_PER_PAGE) || 1;
  renderPagination(pagination, totalPages);
  
  updateQuestionsHero();
}

function buildQuestionCard(question) {
  const card = document.createElement("article");
  card.className = "question-card glass"; // نفس الكلاس اللي في HTML

  // التعامل مع اختلاف أسماء الحقول بين الباك والفرونت
  const title = question.title || "Untitled";
  const votes = formatNumber(question.votes || 0);
  const answers = formatNumber(question.answers_count || 0); // لو الباك بيبعت answers_count
  const views = formatNumber(question.views || 0);
  const excerpt = question.body ? question.body.substring(0, 100) + "..." : "";
  
  // استخراج التاجات بأمان
  let tagsHtml = "";
  if (Array.isArray(question.Question_Tags)) {
      tagsHtml = question.Question_Tags.map(t => `<span class="tag" data-tag="${t.Tags?.tag_name}">${t.Tags?.tag_name}</span>`).join("");
  } else if (Array.isArray(question.tags)) {
      tagsHtml = question.tags.map(t => `<span class="tag" data-tag="${t}">${t}</span>`).join("");
  }

  card.innerHTML = `
    <div class="question-card__stats">
      <div class="question-card__stat question-card__stat--votes">
        <span class="question-card__stat-number">${votes}</span>
        <span class="question-card__stat-label">votes</span>
      </div>
      <div class="question-card__stat question-card__stat--answers">
        <span class="question-card__stat-number">${answers}</span>
        <span class="question-card__stat-label">answers</span>
      </div>
      <div class="question-card__stat question-card__stat--views">
        <span class="question-card__stat-number">${views}</span>
        <span class="question-card__stat-label">views</span>
      </div>
    </div>
    <div class="question-card__body">
      <h3>${title}</h3>
      <p>${excerpt}</p>
      <div class="qa-card__tags" style="margin-top:10px;">
        ${tagsHtml}
      </div>
    </div>
  `;

  // عند الضغط على الكارت
  card.addEventListener("click", (e) => {
    // لو داس على التاج ميعملش Redirect للصفحة
    if(e.target.closest(".tag")) return;
    
    // التوجيه لصفحة تفاصيل السؤال
    const qId = question.question_id || question.id;
    window.location.href = `question-details.html?id=${qId}`;
  });

  return card;
}

// ==========================================
// 6. باقي دوال المساعدة (UI Helpers)
// ==========================================

function setupQuestionsInteractions() {
  const list = document.querySelector("[data-questions-list]");
  const activeTag = document.querySelector("[data-active-tag]");
  const pagination = document.querySelector("[data-pagination]");

  // الضغط على التاج لعمل فلتر
  if (list) {
    list.addEventListener("click", (e) => {
      const tagEl = e.target.closest("[data-tag]");
      if (tagEl) {
        viewState.tag = tagEl.dataset.tag;
        viewState.page = 1;
        renderQuestionsList();
      }
    });
  }

  // إلغاء التاج
  if (activeTag) {
    activeTag.addEventListener("click", () => {
      viewState.tag = null;
      renderQuestionsList();
    });
  }

  // الترقيم (Pagination)
  if (pagination) {
    pagination.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (btn) {
        viewState.page = Number(btn.dataset.page);
        renderQuestionsList();
      }
    });
  }
}

function renderPagination(container, totalPages) {
  if (!container) return;
  container.innerHTML = "";
  if (totalPages <= 1) return;

  const maxButtons = 5;
  let start = Math.max(1, viewState.page - 2);
  let end = Math.min(totalPages, start + maxButtons - 1);

  if (end - start < maxButtons - 1) {
    start = Math.max(1, end - maxButtons + 1);
  }

  for (let i = start; i <= end; i++) {
    const btn = document.createElement("button");
    btn.className = `pagination__page${i === viewState.page ? " pagination__page--active" : ""}`;
    btn.dataset.page = i;
    btn.textContent = i;
    container.appendChild(btn);
  }
}

function updateQuestionsHero() {
  const accent = document.querySelector("[data-questions-title-accent]");
  const tagChip = document.querySelector("[data-active-tag]");
  
  if (accent) {
    accent.textContent = viewState.sort === "newest" ? "Recent" : viewState.sort;
  }
  if (tagChip) {
    tagChip.textContent = viewState.tag ? `#${viewState.tag}` : "All tags";
    tagChip.style.display = viewState.tag ? "inline-block" : "none";
  }
}

function setupFilters() {
  document.querySelectorAll("[data-filter-group]").forEach((group) => {
    group.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        group.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("filter-btn--active"));
        btn.classList.add("filter-btn--active");
        
        const sort = btn.dataset.sort;
        viewState.sort = sort;
        viewState.page = 1;
        renderQuestionsList();
      });
    });
  });
}

function applyUserData(user) {
  // تحديث النصوص
  document.querySelectorAll("[data-username]").forEach((el) => { el.textContent = user.username; });
  document.querySelectorAll("[data-reputation]").forEach((el) => { el.textContent = formatNumber(user.reputation); });
  document.querySelectorAll("[data-asked]").forEach((el) => { el.textContent = formatNumber(user.asked); });
  document.querySelectorAll("[data-answered]").forEach((el) => { el.textContent = formatNumber(user.answered); });
  
  // تحديث الصور
  setImage("profile-image", user.profileImage);
  setImage("profile-image-side", user.profileImage);
  
  // تحديث القوائم الجانبية
  renderList("[data-tags]", user.tags, buildTagPill);
  renderList("[data-notifications]", user.notifications, buildNotificationItem);
  renderList("[data-notifications-dropdown]", user.notifications, buildNotificationItem);
  
  // عرض أسئلة البروفايل (لو موجودة)
  if (user.questions) renderProfileList("[data-questions-full]", user.questions);
  if (user.answers) renderProfileList("[data-answers-full]", user.answers);
}

function renderList(selector, items, builder) {
  const container = document.querySelector(selector);
  if (!container) return;
  container.innerHTML = "";
  (items || []).forEach(item => container.appendChild(builder(item)));
}

// دالة عامة لرسم قوائم البروفايل (أسئلة واجابات)
function renderProfileList(selector, items) {
  const container = document.querySelector(selector);
  if(!container) return;
  container.innerHTML = "";
  items.forEach(item => {
    // هنا ممكن تستخدم buildQuestionCard أو تعمل واحد مبسط للبروفايل
    // للتسهيل هنستخدم كود بسيط:
    const div = document.createElement("div");
    div.className = "qa-card qa-card--full";
    div.innerHTML = `<div class="qa-card__header"><div class="qa-card__title">${item.title || item.excerpt}</div></div>`;
    container.appendChild(div);
  });
}

function setImage(id, src) {
  const el = document.getElementById(id);
  if (el) {
    el.src = src;
    el.onerror = () => { el.src = "img/rafiki.png"; };
  }
}

function buildNotificationItem(note) {
  const li = document.createElement("li");
  li.className = "list__item";
  li.textContent = note;
  return li;
}

function buildTagPill(tag) {
  const pill = document.createElement("span");
  pill.className = "tag";
  pill.textContent = tag;
  return pill;
}

function formatNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString() : value;
}

function setupPanelSwitching() {
  const triggers = document.querySelectorAll("[data-panel-target]");
  const panels = document.querySelectorAll(".profile-panel");
  triggers.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = btn.dataset.panelTarget;
      panels.forEach(p => p.classList.toggle("profile-panel--active", p.dataset.panel === target));
    });
  });
}

function setupNotificationDropdown() {
  const toggle = document.querySelector("[data-notifications-toggle]");
  const panel = document.querySelector("[data-notifications-panel]");
  if (!toggle || !panel) return;
  
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = panel.classList.toggle("notifications__dropdown--open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && !toggle.contains(e.target)) {
      panel.classList.remove("notifications__dropdown--open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function setupTagRemoval() {
    // خاص بالتاجات في البروفايل لو عايز تحذفها
    const container = document.querySelector("[data-tags]");
    if(!container) return;
    // ... الكود القديم لو محتاجه
}