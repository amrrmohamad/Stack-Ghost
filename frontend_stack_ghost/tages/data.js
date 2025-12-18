// data.js

// 1. الإعدادات
const API_BASE = "http://localhost:3000/api";
const ENDPOINTS = {
  USER: `${API_BASE}/users/me`,
  TAGS: `${API_BASE}/tags`,
  // دالة مساعدة لبناء رابط المتابعة لو حبيت تضيفها مستقبلاً
  FOLLOW_TAG: (id) => `${API_BASE}/tags/${id}/follow`,
};

// 2. بيانات وهمية للمستخدم (fallback)
export const fallbackUserData = {
  username: "Guest",
  profileImage: "img/rafiki.png",
  reputation: 0,
  notifications: [],
};

// 3. جلب بيانات المستخدم
export async function fetchUserData() {
  const token = localStorage.getItem("accessToken");
  if (!token) return fallbackUserData;

  try {
    const response = await fetch(ENDPOINTS.USER, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed");
    const json = await response.json();
    return json.data || fallbackUserData;
  } catch (e) {
    return fallbackUserData;
  }
}

// 4. جلب التاجات (Tags)
export async function fetchTags() {
  const token = localStorage.getItem("accessToken");
  const headers = token ? { "Authorization": `Bearer ${token}` } : {};

  const response = await fetch(ENDPOINTS.TAGS, { headers });

  if (!response.ok) {
    throw new Error(`Failed to load tags: ${response.status}`);
  }

  const payload = await response.json();
  
  // حسب الـ JSON اللي انت بعته، الداتا موجودة جوه payload.data
  return Array.isArray(payload.data) ? payload.data : [];
}

// 5. متابعة التاج (اختياري لو الباك إند جاهز)
export async function updateFollowStatus(tagId, shouldFollow) {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  const response = await fetch(ENDPOINTS.FOLLOW_TAG(tagId), {
    method: shouldFollow ? "POST" : "DELETE",
    headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    }
  });

  if (!response.ok) return null;
  const payload = await response.json();
  return payload.data;
}