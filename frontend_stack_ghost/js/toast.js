/**
 * @file toast.js
 * @description Beautiful toast notification system
 */

export function showToast(message, type = 'success') {
  // Remove any existing toasts
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  
  // Icon based on type
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  const icon = icons[type] || icons.info;
  
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-message">${message}</div>
  `;
  
  // Add styles if not already added
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      .toast-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        min-width: 300px;
        max-width: 500px;
        padding: 16px 20px;
        background: rgba(30, 30, 40, 0.95);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 999999;
        animation: slideIn 0.3s ease-out;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
      
      .toast-notification.toast-hiding {
        animation: slideOut 0.3s ease-out forwards;
      }
      
      .toast-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
        flex-shrink: 0;
      }
      
      .toast-success .toast-icon {
        background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        color: white;
      }
      
      .toast-error .toast-icon {
        background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
        color: white;
      }
      
      .toast-warning .toast-icon {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: white;
      }
      
      .toast-info .toast-icon {
        background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
        color: white;
      }
      
      .toast-message {
        flex: 1;
        color: white;
        font-size: 14px;
        line-height: 1.5;
        font-weight: 500;
      }
      
      .toast-success {
        border-left: 3px solid #22c55e;
      }
      
      .toast-error {
        border-left: 3px solid #ef4444;
      }
      
      .toast-warning {
        border-left: 3px solid #f59e0b;
      }
      
      .toast-info {
        border-left: 3px solid #3b82f6;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add to page
  document.body.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, 3000);
}

/**
 * Show a confirmation dialog
 */
export function showConfirm(message, onConfirm, onCancel) {
  // Remove any existing confirm dialogs
  const existingConfirm = document.querySelector('.confirm-dialog');
  if (existingConfirm) {
    existingConfirm.remove();
  }

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'confirm-dialog';
  
  overlay.innerHTML = `
    <div class="confirm-content">
      <div class="confirm-icon">⚠️</div>
      <div class="confirm-message">${message}</div>
      <div class="confirm-buttons">
        <button class="confirm-btn confirm-btn-cancel">Cancel</button>
        <button class="confirm-btn confirm-btn-confirm">Confirm</button>
      </div>
    </div>
  `;
  
  // Add styles if not already added
  if (!document.getElementById('confirm-styles')) {
    const style = document.createElement('style');
    style.id = 'confirm-styles';
    style.textContent = `
      .confirm-dialog {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        animation: fadeIn 0.2s ease-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .confirm-content {
        background: rgba(30, 30, 40, 0.98);
        border-radius: 16px;
        padding: 32px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
        animation: scaleIn 0.2s ease-out;
        text-align: center;
      }
      
      @keyframes scaleIn {
        from {
          transform: scale(0.9);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      .confirm-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .confirm-message {
        color: white;
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 24px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      .confirm-buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
      }
      
      .confirm-btn {
        padding: 12px 24px;
        border-radius: 8px;
        border: none;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      .confirm-btn-cancel {
        background: rgba(255, 255, 255, 0.1);
        color: white;
      }
      
      .confirm-btn-cancel:hover {
        background: rgba(255, 255, 255, 0.15);
      }
      
      .confirm-btn-confirm {
        background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
        color: white;
      }
      
      .confirm-btn-confirm:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add to page
  document.body.appendChild(overlay);
  
  // Setup event listeners
  const cancelBtn = overlay.querySelector('.confirm-btn-cancel');
  const confirmBtn = overlay.querySelector('.confirm-btn-confirm');
  
  const remove = () => {
    overlay.style.animation = 'fadeOut 0.2s ease-out';
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.remove();
      }
    }, 200);
  };
  
  cancelBtn.addEventListener('click', () => {
    remove();
    if (onCancel) onCancel();
  });
  
  confirmBtn.addEventListener('click', () => {
    remove();
    if (onConfirm) onConfirm();
  });
  
  // Close on background click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      remove();
      if (onCancel) onCancel();
    }
  });
}

// Export as default for easier importing
export default { showToast, showConfirm };


