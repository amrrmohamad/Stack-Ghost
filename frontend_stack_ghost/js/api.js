/**
 * @file api.js
 * @description Centralized API client for Stack Ghost frontend
 */

const API_BASE_URL = 'http://localhost:3000/api';

class APIClient {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Get access token from localStorage
    getAccessToken() {
        return localStorage.getItem('accessToken');
    }

    // Get refresh token from localStorage
    getRefreshToken() {
        return localStorage.getItem('refreshToken');
    }

    // Save tokens to localStorage
    saveTokens(accessToken, refreshToken) {
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
    }

    // Clear tokens (logout)
    clearTokens() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }

    // Save user data
    saveUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    // Get user data
    getUser() {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getAccessToken();
    }

    // Make HTTP request with automatic token refresh
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getAccessToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            // Token expired, try to refresh
            if (response.status === 401 && this.getRefreshToken()) {
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    // Retry the original request
                    headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
                    const retryResponse = await fetch(url, {
                        ...options,
                        headers,
                    });
                    return await this.handleResponse(retryResponse);
                } else {
                    this.clearTokens();
                    window.location.href = '/signin,login/index.html';
                    throw new Error('Session expired. Please login again.');
                }
            }

            return await this.handleResponse(response);
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    async handleResponse(response) {
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    }

    // Refresh access token
    async refreshAccessToken() {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) return false;

            const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                this.saveTokens(data.accessToken, data.refreshToken);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    }

    // Auth endpoints
    async register(username, email, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password }),
        });
    }

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (data.success && data.data) {
            this.saveTokens(data.data.accessToken, data.data.refreshToken);
            // Fetch user profile after login
            const user = await this.getCurrentUser();
            this.saveUser(user.data);
        }

        return data;
    }

    async logout() {
        try {
            await this.request('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refreshToken: this.getRefreshToken() }),
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearTokens();
            window.location.href = '/signin,login/index.html';
        }
    }

    // User endpoints
    async getCurrentUser() {
        return this.request('/users/me');
    }

    async getUserProfile(userId) {
        return this.request(`/users/${userId}`);
    }

    async updateProfile(updates) {
        return this.request('/users/me', {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    // Question endpoints
    async getQuestions(page = 1, limit = 10) {
        return this.request(`/questions?page=${page}&limit=${limit}`);
    }

    async getQuestionById(id) {
        return this.request(`/questions/${id}`);
    }

    async searchQuestions(query, page = 1, limit = 10) {
        return this.request(`/questions/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    }

    async createQuestion(title, body, tagIds = []) {
        return this.request('/questions', {
            method: 'POST',
            body: JSON.stringify({ title, body, tag_ids: tagIds }),
        });
    }

    async updateQuestion(id, title, body) {
        return this.request(`/questions/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ title, body }),
        });
    }

    // Answer endpoints
    async getAnswers(questionId, page = 1, limit = 10) {
        return this.request(`/answers/${questionId}?page=${page}&limit=${limit}`);
    }

    async createAnswer(questionId, body) {
        return this.request('/answers', {
            method: 'POST',
            body: JSON.stringify({ body, questionId: parseInt(questionId) }),
        });
    }

    async acceptAnswer(answerId) {
        return this.request(`/answers/${answerId}/accept`, {
            method: 'POST',
        });
    }

    async updateAnswer(answerId, body) {
        return this.request(`/answers/${answerId}`, {
            method: 'PUT',
            body: JSON.stringify({ body }),
        });
    }

    async deleteAnswer(answerId) {
        return this.request(`/answers/${answerId}`, {
            method: 'DELETE',
        });
    }

    // Vote endpoints
    async vote(questionId, answerId, voteType) {
        return this.request('/votes', {
            method: 'POST',
            body: JSON.stringify({
                question_id: questionId || null,
                answer_id: answerId || null,
                vote_type: voteType, // 1 for upvote, -1 for downvote
            }),
        });
    }

    async checkVoteStatus(questionId, answerId) {
        const params = questionId ? `question_id=${questionId}` : `answer_id=${answerId}`;
        return this.request(`/votes/status?${params}`);
    }

    // Comment endpoints
    async getComments(questionId, answerId) {
        const params = questionId ? `question_id=${questionId}` : `answer_id=${answerId}`;
        return this.request(`/comments?${params}`);
    }

    async createComment(body, questionId, answerId) {
        return this.request('/comments', {
            method: 'POST',
            body: JSON.stringify({
                body,
                question_id: questionId || null,
                answer_id: answerId || null,
            }),
        });
    }

    async updateComment(commentId, body) {
        return this.request(`/comments/${commentId}`, {
            method: 'PUT',
            body: JSON.stringify({ body }),
        });
    }

    async deleteComment(commentId) {
        return this.request(`/comments/${commentId}`, {
            method: 'DELETE',
        });
    }

    // Tag endpoints
    async getTags(page = 1, limit = 20, query = '') {
        return this.request(`/tags?page=${page}&limit=${limit}&q=${encodeURIComponent(query)}`);
    }

    // Notification endpoints
    async getNotifications(userId, page = 1, limit = 20) {
        return this.request(`/notifications/user/${userId}?page=${page}&limit=${limit}`);
    }

    async markNotificationAsRead(notificationId) {
        return this.request(`/notifications/${notificationId}/read`, {
            method: 'PUT',
        });
    }

    async markAllNotificationsAsRead(userId) {
        return this.request(`/notifications/user/${userId}/mark-all-read`, {
            method: 'PUT',
        });
    }

    // Follow endpoints
    async toggleFollowUser(userId) {
        return this.request(`/users/${userId}/toggle`, {
            method: 'POST',
        });
    }

    // Profile endpoints
    async getCompleteProfile(userId) {
        return this.request(`/users/${userId}/profile?include=badges,questions,answers,tags,stats,titles`);
    }

    async getFollowers(userId, page = 1, limit = 10) {
        return this.request(`/users/${userId}/followers?page=${page}&limit=${limit}`);
    }

    async getFollowing(userId, page = 1, limit = 10) {
        return this.request(`/users/${userId}/following?page=${page}&limit=${limit}`);
    }

    async toggleFollowTag(tagId) {
        return this.request(`/users/tags/${tagId}/toggle`, {
            method: 'POST',
        });
    }
}

// Create and export a singleton instance
const api = new APIClient();
export default api;
