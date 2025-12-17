/**
 * @file auth.js
 * @description Authentication helper functions
 */

import api from './api.js';

/**
 * Check if user is authenticated, redirect to login if not
 */
export function requireAuth() {
    if (!api.isAuthenticated()) {
        window.location.href = '/signin,login/index.html';
        return false;
    }
    return true;
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser() {
    return api.getUser();
}

/**
 * Check if current user has specific role
 */
export function hasRole(role) {
    const user = getCurrentUser();
    return user?.Roles?.role_name === role;
}

/**
 * Check if current user is admin or moderator
 */
export function isAdminOrModerator() {
    return hasRole('admin') || hasRole('moderator');
}

/**
 * Logout user
 */
export async function logout() {
    await api.logout();
}
