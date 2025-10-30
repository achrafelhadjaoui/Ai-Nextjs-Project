// Background script for Farisly Ai extension
console.log('Background script loaded');

// Store API key and settings
let OPENAI_API_KEY = process.env.OPENAI_API_KEY;
let settings = {
    savedReplies: [],
    aiInstructions: ''
};

chrome.runtime.onInstalled.addListener((details) => {
    console.log('Farisly Ai extension installed:', details.reason);
    
    if (details.reason === 'install') {
        chrome.storage.local.set({
            'farisly_ai_installed': true,
            'farisly_ai_version': '1.0.0'
        });
    }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request);
    
    if (request.action === 'getTabInfo') {
        sendResponse({
            url: sender.tab?.url || 'unknown',
            title: sender.tab?.title || 'unknown'
        });
    }
    
    if (request.action === 'callOpenAI') {
        handleOpenAICall(request.prompt, request.context, sendResponse);
        return true; // Keep message channel open for async response
    }
    
    if (request.action === 'getSettings') {
        sendResponse(settings);
    }
    
    if (request.action === 'updateSettings') {
        settings = { ...settings, ...request.settings };
        chrome.storage.local.set({ farisly_settings: settings });
        sendResponse({ success: true });
    }
    
    if (request.action === 'getApiKey') {
        sendResponse({ OPENAI_API_KEY: OPENAI_API_KEY });
    }
    
    if (request.action === 'setApiKey') {
        OPENAI_API_KEY = request.apiKey;
        chrome.storage.local.set({ farisly_api_key: OPENAI_API_KEY });
        sendResponse({ success: true });
    }
    
    return true;
});

async function handleOpenAICall(prompt, context, sendResponse) {
    try {
        if (!OPENAI_API_KEY) {
            // Try to get API key from storage
            const result = await chrome.storage.local.get(['farisly_api_key']);
            OPENAI_API_KEY = result.farisly_api_key || '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';
        }

        const response = await callOpenAIAPI(prompt, context, OPENAI_API_KEY);
        sendResponse({ success: true, response: response });
        
    } catch (error) {
        console.error('OpenAI API error:', error);
        sendResponse({ 
            error: error.message || 'Failed to call OpenAI API' 
        });
    }
}

async function callOpenAIAPI(prompt, context, OPENAI_API_KEY) {
    const messages = [];
    
    if (context) {
        messages.push({
            role: 'system',
            content: `Context: ${context}`
        });
    }
    
    messages.push({
        role: 'user',
        content: prompt
    });
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// Load settings on startup
chrome.runtime.onStartup.addListener(async () => {
    const result = await chrome.storage.local.get(['farisly_api_key', 'farisly_settings']);
    OPENAI_API_KEY = result.farisly_api_key || OPENAI_API_KEY;
    settings = result.farisly_settings || { savedReplies: [], aiInstructions: '' };
});