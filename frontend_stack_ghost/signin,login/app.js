// 1. إعدادات الروابط (Endpoints)
const API_BASE = "http://localhost:3000/api/auth";
const ENDPOINTS = {
    login: `${API_BASE}/login`,
    signup: `${API_BASE}/register`
};

// 2. تشغيل الكود لما الصفحة تحمل
document.addEventListener("DOMContentLoaded", () => {
    // تشغيل التابات (عشان زرار Sign up يشتغل)
    setupTabs();
    
    // تشغيل الفورم (عشان يبعت للداتابيز)
    setupFormSubmit();
    
    // تأثيرات بصرية للحقول
    setupFormFocus();
});

/* =========================================
   Part 1: Tabs Logic (المسؤول عن التبديل)
   ========================================= */
function setupTabs() {
    const tabButtons = document.querySelectorAll("[data-tab]");
    const forms = document.querySelectorAll("[data-form]");
    const indicator = document.querySelector(".tab-switch__indicator");
    const title = document.querySelector(".auth-title");
    const subtitle = document.querySelector(".subtitle");
    
    // نصوص العناوين لكل صفحة
    const TAB_COPY = {
        login: { title: "Login", subtitle: "Welcome back to Stack Ghost" },
        signup: { title: "Sign Up", subtitle: "Create your Stack Ghost account" }
    };

    const activate = (tabName) => {
        // 1. تنشيط الزرار
        tabButtons.forEach((btn) => {
            const isActive = btn.dataset.tab === tabName;
            btn.classList.toggle("is-active", isActive);
            btn.setAttribute("aria-selected", isActive);
        });

        // 2. إظهار الفورم المطلوب وإخفاء التاني
        forms.forEach((form) => {
            if (form.dataset.form === tabName) {
                form.classList.add("is-active"); // CSS هيخليه display: grid
            } else {
                form.classList.remove("is-active"); // CSS هيخليه display: none
            }
        });

        // 3. تحريك المؤشر (Animation)
        if (indicator) {
            indicator.style.transform = tabName === "signup" ? "translateX(100%)" : "translateX(0)";
        }

        // 4. تغيير العنوان
        if (TAB_COPY[tabName]) {
            if (title) title.textContent = TAB_COPY[tabName].title;
            if (subtitle) subtitle.textContent = TAB_COPY[tabName].subtitle;
        }
    };

    // إضافة مستمع الضغط (Click Event) للأزرار
    tabButtons.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            activate(btn.dataset.tab);
        });
    });

    // تشغيل الروابط الداخلية (زي: Already have account? Login)
    const links = document.querySelectorAll("[data-tab-link]");
    links.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            activate(link.dataset.tabLink);
        });
    });

    // البدء بـ Login
    activate("login");
}

/* =========================================
   Part 2: UI Effects (تأثيرات الحقول)
   ========================================= */
function setupFormFocus() {
    const inputs = document.querySelectorAll(".input-field input");
    inputs.forEach((input) => {
        input.addEventListener("focus", () => input.parentElement.classList.add("is-focused"));
        input.addEventListener("blur", () => {
            if (!input.value.trim()) input.parentElement.classList.remove("is-focused");
        });
    });
}

/* =========================================
   Part 3: Form Submission (الربط بالسيرفر)
   ========================================= */
function setupFormSubmit() {
    const forms = document.querySelectorAll(".auth-form");

    forms.forEach((form) => {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const formType = form.dataset.form; // 'login' or 'signup'
            const submitBtn = form.querySelector("button[type='submit']");
            const originalText = submitBtn.textContent;
            
            // تجميع البيانات
            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());

            // Validation بسيط للـ Signup
            if (formType === 'signup') {
                if (payload.password !== payload.confirm_password) {
                    alert("Passwords do not match!");
                    return;
                }
                delete payload.confirm_password;
                delete payload.terms;
            }

            // UI Loading
            submitBtn.disabled = true;
            submitBtn.textContent = "Processing...";
            submitBtn.classList.add("is-loading");

            try {
                // إرسال للسيرفر
                const response = await fetch(ENDPOINTS[formType], {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Error occurred');
                }

                console.log("Success:", result);

                // حفظ التوكن
                if (result.data && result.data.accessToken) {
                    localStorage.setItem('accessToken', result.data.accessToken);
                    localStorage.setItem('refreshToken', result.data.refreshToken);
                    if(result.user) localStorage.setItem('user', JSON.stringify(result.user));
                }

                submitBtn.textContent = "Success!";
                
                // الانتقال للصفحة الرئيسية
                setTimeout(() => {
                    window.location.href = "../home/index.html"; 
                }, 1000);

            } catch (error) {
                console.error(error);
                alert(error.message);
                submitBtn.textContent = "Try Again";
            } finally {
                setTimeout(() => {
                    submitBtn.disabled = false;
                    if (submitBtn.textContent !== "Success!") {
                        submitBtn.textContent = originalText;
                    }
                    submitBtn.classList.remove("is-loading");
                }, 1500);
            }
        });
    });
}