/**
 * Extension Configuration
 *
 * THIS FILE IS AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from .env.local by scripts/build-extension-config.js
 *
 * To update configuration:
 * 1. Edit .env.local file
 * 2. Run: npm run build:extension
 *
 * IMPORTANT: This file MUST NOT throw any errors or it will break all content scripts
 */

// Wrapped in try-catch and IIFE to ensure it never breaks other scripts
(function() {
  try {
    // API Base URL from environment
    var API_URL = 'http://localhost:3001';

    // Export for content scripts (window context)
    if (typeof window !== 'undefined') {
      window.FARISLY_CONFIG = {
        API_URL: API_URL
      };
      console.log('[Farisly Config] Loaded successfully:', API_URL);
    }

    // Export for service worker (self context)
    if (typeof self !== 'undefined' && typeof window === 'undefined') {
      self.FARISLY_CONFIG = {
        API_URL: API_URL
      };
    }
  } catch (error) {
    // Fallback: Even if something fails, don't break subsequent scripts
    console.error('[Farisly Config] Error loading config:', error);
    if (typeof window !== 'undefined') {
      window.FARISLY_CONFIG = {
        API_URL: 'http://localhost:3001'
      };
    }
  }
})();
