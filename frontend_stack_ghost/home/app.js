// app.js
import { getUserProfile, getQuestions } from "./data.js";

const QUESTIONS_PER_PAGE = 5;
const viewState = { page: 1, sort: "newest", tag: null };

document.addEventListener("DOMContentLoaded", async () => {
    // 1. تحميل البروفايل
    try {
        const user = await getUserProfile();
        renderUserProfile(user);
    } catch (e) {
        console.log("Guest mode or error:", e.message);
        // يمكن إخفاء السايد بار الأيمن هنا لو المستخدم زائر
    }

    // 2. تحميل الأسئلة
    await loadAndRenderQuestions();
    
    // 3. تفعيل الأزرار
    setupInteractions();
});

// --- دوال العرض (Rendering) ---

async function loadAndRenderQuestions() {
    const container = document.querySelector("[data-questions-list]");
    const pagination = document.querySelector("[data-pagination]");
    
    if (!container) return;
    
    container.innerHTML = `<div style="text-align:center; padding:40px; color:#888;">Loading...</div>`;

    try {
        const data = await getQuestions({
            page: viewState.page,
            limit: QUESTIONS_PER_PAGE,
            sort: viewState.sort,
            tag: viewState.tag
        });

        container.innerHTML = ""; // مسح اللودينج

        if (data.questions.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:20px;">No questions found.</div>`;
            return;
        }

        data.questions.forEach(q => {
            container.appendChild(createQuestionCard(q));
        });

        renderPagination(pagination, data.totalPages);

    } catch (error) {
        container.innerHTML = `<div style="color:red; text-align:center;">Error: ${error.message}</div>`;
    }
}

function createQuestionCard(q) {
    const card = document.createElement("article");
    card.className = "question-card glass";
    
    // معالجة البيانات من الباك إند (Score, Summary, Tags)
    const title = q.title || "Untitled";
    const body = q.summary || q.body || "";
    const excerpt = body.length > 100 ? body.substring(0, 100) + "..." : body;
    const votes = q.score !== undefined ? q.score : (q.votes || 0);
    const answers = q.answers_count || 0;
    const views = q.views || 0;
    const author = q.author?.username || "Unknown";

    // معالجة التاجات (سواء كانت نصوص أو كائنات)
    let tagsHtml = "";
    if (Array.isArray(q.tags)) {
        tagsHtml = q.tags.map(t => {
            const tagName = typeof t === 'object' ? t.tag_name : t;
            return `<span class="tag" data-tag="${tagName}">${tagName}</span>`;
        }).join("");
    }

    card.innerHTML = `
        <div class="question-card__stats">
            <div class="question-card__stat"><span>${votes}</span> votes</div>
            <div class="question-card__stat"><span>${answers}</span> answers</div>
            <div class="question-card__stat"><span>${views}</span> views</div>
        </div>
        <div class="question-card__body">
            <h3>${title}</h3>
            <p>${excerpt}</p>
            <div style="display:flex; justify-content:space-between; margin-top:15px;">
                <div class="qa-card__tags">${tagsHtml}</div>
                <small style="color:#888">by ${author}</small>
            </div>
        </div>
    `;
    
    card.addEventListener("click", (e) => {
        if(e.target.closest(".tag")) return;
        window.location.href = `question-details.html?id=${q.question_id || q.id}`;
    });

    return card;
}

function renderUserProfile(user) {
    // تعبئة البيانات في الصفحة
    document.querySelectorAll("[data-username]").forEach(el => el.textContent = user.username);
    document.querySelectorAll("[data-reputation]").forEach(el => el.textContent = user.reputation);
    document.querySelectorAll("[data-asked]").forEach(el => el.textContent = user.asked);
    document.querySelectorAll("[data-answered]").forEach(el => el.textContent = user.answered);
    
    // الصورة
    const img1 = document.getElementById("profile-image");
    const img2 = document.getElementById("profile-image-side");
    if(img1) img1.src = user.profileImage || "img/rafiki.png";
    if(img2) img2.src = user.profileImage || "img/rafiki.png";

    // الإشعارات والتاجات الجانبية
    fillList("[data-notifications]", user.notifications);
    fillList("[data-notifications-dropdown]", user.notifications);
    
    const tagsContainer = document.querySelector("[data-tags]");
    if (tagsContainer && user.tags) {
        tagsContainer.innerHTML = user.tags.map(t => `<span class="tag">${t}</span>`).join("");
    }
}

// --- دوال مساعدة ---

function fillList(selector, items) {
    const el = document.querySelector(selector);
    if(!el) return;
    if(!items || !items.length) {
        el.innerHTML = `<li style="padding:10px; color:#777;">Empty</li>`;
        return;
    }
    el.innerHTML = items.map(i => `<li class="list__item">${i}</li>`).join("");
}

function renderPagination(container, totalPages) {
    if(!container) return;
    container.innerHTML = "";
    if(totalPages <= 1) return;

    for(let i=1; i<=totalPages; i++) {
        const btn = document.createElement("button");
        btn.className = "pagination__page"; // تأكد من وجود ستايل لهذا الكلاس
        if(i === viewState.page) btn.classList.add("pagination__page--active"); // ستايل الزر النشط
        btn.textContent = i;
        btn.onclick = () => {
            viewState.page = i;
            loadAndRenderQuestions();
        };
        container.appendChild(btn);
    }
}

function setupInteractions() {
    // تفعيل البحث، الفلاتر، إلخ
    // (نفس الكود السابق للـ filters والـ search)
    const list = document.querySelector("[data-questions-list]");
    if(list) {
        list.addEventListener("click", (e) => {
            const tag = e.target.closest("[data-tag]");
            if(tag) {
                viewState.tag = tag.dataset.tag;
                viewState.page = 1;
                loadAndRenderQuestions();
            }
        });
    }
}