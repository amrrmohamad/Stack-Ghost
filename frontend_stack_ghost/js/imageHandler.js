/**
 * @file imageHandler.js
 * @description Handle missing images gracefully
 */

// Add error handler for all images
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        img.addEventListener('error', function() {
            // Hide broken image icon
            this.style.display = 'none';
            
            // Log in development
            if (window.location.hostname === 'localhost') {
                console.warn(`Missing image: ${this.src}`);
            }
        });
    });
});
