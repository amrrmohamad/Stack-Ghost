// data.js

const API_BASE = "http://localhost:3000/api";
const ENDPOINTS = {
    GET_PROFILE: `${API_BASE}/users/me`,
    GET_QUESTIONS: `${API_BASE}/questions`,
};

// القيم الافتراضية البسيطة (لمنع الأخطاء فقط)
const defaultUser = {
    username: "Guest",
    profileImage: "img/rafiki.png",
    reputation: 0,
    asked: 0,
    answered: 0,
    notifications: [],
    tags: []
};

// 1. دالة جلب البروفايل (تحتاج Token)
export async function getUserProfile() {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("No token");

    const response = await fetch(ENDPOINTS.GET_PROFILE, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!response.ok) throw new Error("Failed to load profile");
    
    const json = await response.json();
    return { ...defaultUser, ...json.data };
}

// 2. دالة جلب الأسئلة (عامة - لا تحتاج Token)
export async function getQuestions(params = {}) {
    const url = new URL(ENDPOINTS.GET_QUESTIONS);
    
    if (params.page) url.searchParams.append("page", params.page);
    if (params.limit) url.searchParams.append("limit", params.limit);
    if (params.sort) url.searchParams.append("sort", params.sort);
    if (params.tag) url.searchParams.append("tag", params.tag);

    const response = await fetch(url.toString());
    
    if (!response.ok) throw new Error("Failed to load questions");
    
    const json = await response.json();
    return {
        questions: json.data || [],
        total: json.total || 0,
        totalPages: json.totalPages || 1
    };
}