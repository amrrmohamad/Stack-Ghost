/**
 * @file dashboard-visibility.js
 * @description Utility to show/hide Dashboard tab based on user role
 */

/**
 * Check if user has admin or moderator role and show Dashboard tab
 */
export async function setupDashboardVisibility() {
    try {
        // Import API client
        const apiModule = await import('./api.js');
        const api = apiModule.default;
        
        // Get current user data
        const response = await api.getCurrentUser();
        
        console.log('Dashboard visibility check - Full response:', response);
        
        if (response.success && response.data) {
            const user = response.data;
            
            // Handle nested Roles object or direct role properties
            const userRole = user.Roles?.role_name || user.role_name || user.role || '';
            
            console.log('User data:', user);
            console.log('Extracted role:', userRole);
            
            // Show Dashboard tab only for Admin and Moderator (case-insensitive)
            const roleLower = userRole.toLowerCase();
            if (roleLower === 'admin' || roleLower === 'moderator') {
                const dashboardSection = document.getElementById('dashboard-section');
                const dashboardDivider = document.getElementById('dashboard-divider');
                
                if (dashboardSection) {
                    dashboardSection.style.display = 'block';
                    console.log('Dashboard section shown');
                }
                if (dashboardDivider) {
                    dashboardDivider.style.display = 'block';
                    console.log('Dashboard divider shown');
                }
                
                console.log('✅ Dashboard tab visible for role:', userRole);
            } else {
                console.log('❌ Dashboard tab hidden for role:', userRole);
            }
        } else {
            console.log('No user data in response');
        }
    } catch (error) {
        console.error('Error setting up dashboard visibility:', error);
        // Hide dashboard by default on error
    }
}

// Auto-initialize if this script is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDashboardVisibility);
} else {
    setupDashboardVisibility();
}
