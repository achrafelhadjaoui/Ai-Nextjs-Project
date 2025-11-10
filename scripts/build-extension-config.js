#!/usr/bin/env node

/**
 * Build Extension Config
 *
 * This script reads environment variables from .env.local and generates
 * a config.js file for the browser extension.
 *
 * Usage:
 *   node scripts/build-extension-config.js
 *   npm run build:extension
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
const dotenv = require('dotenv');

console.log('📂 Loading .env.local from:', envPath);
console.log('📂 File exists:', fs.existsSync(envPath));

const envConfig = dotenv.config({ path: envPath, debug: false });

if (envConfig.error) {
  console.error('❌ Error loading .env.local:', envConfig.error);
  process.exit(1);
}

console.log('✅ Loaded variables:', Object.keys(envConfig.parsed || {}).length);
console.log('🔍 NEXT_PUBLIC_APP_URL from parsed:', envConfig.parsed?.NEXT_PUBLIC_APP_URL);

// Get API URL from environment or use default
const API_URL = envConfig.parsed?.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

console.log('🔧 Building extension config...');
console.log(`📍 API URL: ${API_URL}`);

// Generate the config file content with bulletproof error handling
const configContent = `/**
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
    var API_URL = '${API_URL}';

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
`;

// Write the config file
const outputPath = path.join(__dirname, '../extension/config.js');
fs.writeFileSync(outputPath, configContent, 'utf8');

console.log('✅ Extension config generated successfully!');
console.log(`📄 Output: ${outputPath}`);
console.log('');
console.log('🔄 Next steps:');
console.log('   1. Reload your extension in chrome://extensions/');
console.log('   2. Test the extension on any webpage');
console.log('');
