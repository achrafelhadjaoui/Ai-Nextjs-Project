// Simple popup script for Farisly Ai extension

document.addEventListener('DOMContentLoaded', function() {

    // Get API URL from config (loaded from config.js)
    const API_URL = window.FARISLY_CONFIG?.API_URL || 'http://localhost:3001';

    const openDashboardBtn = document.getElementById('openDashboard');
    const openPanelBtn = document.getElementById('openPanel');
    const openProfileBtn = document.getElementById('openProfile');
    const statusElement = document.getElementById('status');

    if (!openDashboardBtn || !openPanelBtn || !openProfileBtn) {
        return;
    }

    // Dashboard button
    openDashboardBtn.addEventListener('click', function() {
        statusElement.textContent = 'Opening Dashboard...';
        chrome.tabs.create({ url: `${API_URL}/dashboard` });
    });

    // Panel button
    openPanelBtn.addEventListener('click', function() {
        statusElement.textContent = 'Opening Panel...';
        chrome.tabs.create({ url: `${API_URL}/panel` });
    });

    // Profile button
    openProfileBtn.addEventListener('click', function() {
        statusElement.textContent = 'Opening Profile...';
        chrome.tabs.create({ url: `${API_URL}/profile` });
    });
});