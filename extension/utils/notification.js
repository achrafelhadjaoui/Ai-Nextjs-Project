// extension/utils/notification.js
/**
 * Custom notification system for Chrome Extension content scripts
 * Replaces window.alert() with modern, non-blocking notifications
 */

class ExtensionNotification {
  constructor() {
    this.container = null;
    this.notificationCount = 0;
    this.init();
  }

  /**
   * Initialize notification container
   */
  init() {
    // Create container if it doesn't exist
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'farisly-notification-container';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    }
  }

  /**
   * Create notification element
   */
  createNotification(message, type = 'info', duration = 4000) {
    this.notificationCount++;
    const id = `farisly-notification-${this.notificationCount}`;

    const notification = document.createElement('div');
    notification.id = id;
    notification.style.cssText = `
      min-width: 300px;
      max-width: 400px;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
      transition: all 0.3s ease;
    `;

    // Set colors based on type
    const colors = {
      success: {
        bg: '#10b981',
        icon: '✓',
        text: '#ffffff'
      },
      error: {
        bg: '#ef4444',
        icon: '✕',
        text: '#ffffff'
      },
      warning: {
        bg: '#f59e0b',
        icon: '⚠',
        text: '#ffffff'
      },
      info: {
        bg: '#3b82f6',
        icon: 'ℹ',
        text: '#ffffff'
      }
    };

    const color = colors[type] || colors.info;
    notification.style.backgroundColor = color.bg;
    notification.style.color = color.text;

    // Icon
    const icon = document.createElement('span');
    icon.textContent = color.icon;
    icon.style.cssText = `
      font-size: 18px;
      font-weight: bold;
      flex-shrink: 0;
    `;

    // Message
    const messageEl = document.createElement('span');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      flex: 1;
    `;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: ${color.text};
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.8;
      transition: opacity 0.2s;
      flex-shrink: 0;
    `;
    closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
    closeBtn.onmouseout = () => closeBtn.style.opacity = '0.8';
    closeBtn.onclick = () => this.removeNotification(id);

    notification.appendChild(icon);
    notification.appendChild(messageEl);
    notification.appendChild(closeBtn);

    // Add animation styles
    if (!document.getElementById('farisly-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'farisly-notification-styles';
      style.textContent = `
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
      `;
      document.head.appendChild(style);
    }

    this.container.appendChild(notification);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => this.removeNotification(id), duration);
    }

    return id;
  }

  /**
   * Remove notification with animation
   */
  removeNotification(id) {
    const notification = document.getElementById(id);
    if (notification) {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }

  /**
   * Show success notification
   */
  success(message, duration = 4000) {
    return this.createNotification(message, 'success', duration);
  }

  /**
   * Show error notification
   */
  error(message, duration = 4000) {
    return this.createNotification(message, 'error', duration);
  }

  /**
   * Show warning notification
   */
  warning(message, duration = 4000) {
    return this.createNotification(message, 'warning', duration);
  }

  /**
   * Show info notification
   */
  info(message, duration = 4000) {
    return this.createNotification(message, 'info', duration);
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Create singleton instance
const showNotification = new ExtensionNotification();

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.showNotification = showNotification;
}
