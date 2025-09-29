// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// DOM Elements
let tokenAddressInput;
let analyzeBtn;
let resultsArea;
let quickStats;
let themeToggle;
let sunIcon;
let moonIcon;
let emptyState;
let loading;
let popupContent;

// State
let isDarkMode = false;
let isAnalyzing = false;
let currentTokenStats = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeElements();
    initializeTheme();
    initializeEventListeners();

    // Show the popup content and hide loading
    loading.classList.add('hidden');
    popupContent.classList.remove('hidden');
});

function initializeElements() {
    tokenAddressInput = document.getElementById('token-address');
    analyzeBtn = document.getElementById('analyze-btn');
    resultsArea = document.getElementById('results-area');
    quickStats = document.getElementById('quick-stats');
    themeToggle = document.getElementById('theme-toggle');
    sunIcon = document.getElementById('sun-icon');
    moonIcon = document.getElementById('moon-icon');
    emptyState = document.getElementById('empty-state');
    loading = document.getElementById('loading');
    popupContent = document.getElementById('popup-content');
}

function initializeTheme() {
    // Get saved theme or use system preference
    chrome.storage.sync.get(['theme'], function (result) {
        const savedTheme = result.theme;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);

        updateTheme();
    });
}

function initializeEventListeners() {
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Analyze button
    analyzeBtn.addEventListener('click', handleAnalyze);

    // Enter key in input
    tokenAddressInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleAnalyze();
        }
    });

    // Input validation
    tokenAddressInput.addEventListener('input', function () {
        const hasInput = tokenAddressInput.value.trim().length > 0;
        analyzeBtn.disabled = !hasInput;
    });
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    updateTheme();

    // Save theme preference
    chrome.storage.sync.set({ theme: isDarkMode ? 'dark' : 'light' });
}

function updateTheme() {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');

    if (isDarkMode) {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
        themeToggle.title = 'Switch to light mode';
    } else {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
        themeToggle.title = 'Switch to dark mode';
    }
}

async function handleAnalyze() {
    const tokenAddress = tokenAddressInput.value.trim();
    if (!tokenAddress || isAnalyzing) return;

    setAnalyzing(true);
    clearError();

    try {
        const stats = await fetchTokenStats(tokenAddress);
        displayResults(stats);
        updateQuickStats(stats);
    } catch (error) {
        console.error('Analysis failed:', error);
        displayError(error.message || 'Analysis failed. Please try again.');
    } finally {
        setAnalyzing(false);
    }
}

async function fetchTokenStats(mintAddress) {
    const response = await fetch(`${API_BASE_URL}/api/token/${mintAddress}/quick-stats`);

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
}

function setAnalyzing(analyzing) {
    isAnalyzing = analyzing;
    analyzeBtn.disabled = analyzing;

    if (analyzing) {
        analyzeBtn.innerHTML = `
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        `;
        showLoadingState();
    } else {
        analyzeBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
        `;
    }
}

function showLoadingState() {
    emptyState.classList.add('hidden');
    resultsArea.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-text-medium">
            <div class="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p class="text-sm">Analyzing token distribution...</p>
        </div>
    `;
}

function displayResults(stats) {
    currentTokenStats = stats;
    emptyState.classList.add('hidden');

    const riskLevel = getRiskLevel(stats.top_10_percentage);
    const riskClass = getRiskClass(stats.top_10_percentage);

    // Generate early buyers HTML
    const earlyBuyersHtml = stats.early_buyers && stats.early_buyers.length > 0 ? `
        <div class="card p-4">
            <h3 class="font-medium text-text-dark mb-3 flex items-center gap-2">
                <svg class="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
                Early Buyers
            </h3>
            <div class="space-y-2">
                ${stats.early_buyers.slice(0, 5).map(buyer => `
                    <div class="flex items-center justify-between p-2 bg-surface-secondary rounded">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
                                <span class="text-white text-xs font-bold">
                                    ${buyer.rank}
                                </span>
                            </div>
                            <div>
                                <p class="text-xs font-medium text-text-dark">
                                    ${buyer.wallet_address.slice(0, 6)}...${buyer.wallet_address.slice(-4)}
                                </p>
                                ${buyer.purchase_time ? `
                                    <p class="text-xs text-text-subtle">
                                        ${new Date(buyer.purchase_time).toLocaleDateString()}
                                    </p>
                                ` : ''}
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-xs font-medium text-text-dark">
                                ${buyer.purchase_amount.toLocaleString()}
                            </p>
                            ${buyer.sol_spent ? `
                                <p class="text-xs text-text-subtle">
                                    ${buyer.sol_spent.toFixed(2)} SOL
                                </p>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    resultsArea.innerHTML = `
        <div class="space-y-4">
            ${(stats.token_name || stats.token_symbol) ? `
                <div class="gradient-header">
                    <div class="flex items-center gap-2">
                        <div class="token-avatar">
                            ${(stats.token_symbol || '?').charAt(0)}
                        </div>
                        <div>
                            <h3 class="font-semibold text-text-dark">
                                ${stats.token_name || 'Unknown Token'}
                            </h3>
                            <p class="text-sm text-text-medium">
                                ${stats.token_symbol || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            ` : ''}

            <div class="card p-4">
                <h3 class="font-medium text-text-dark mb-3 flex items-center gap-2">
                    <svg class="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    Holder Distribution
                </h3>
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-text-medium">Total Holders</span>
                        <span class="stat-badge">
                            ${stats.total_holders.toLocaleString()}
                        </span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-text-medium">Top 10 Control</span>
                        <span class="stat-badge ${riskClass}">
                            ${stats.top_10_percentage.toFixed(1)}%
                        </span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-text-medium">Whale Accounts</span>
                        <span class="stat-badge">
                            ${stats.whale_count}
                        </span>
                    </div>
                </div>

                <div class="mt-4 pt-3 border-t border-border-primary">
                    <div class="flex items-center gap-2">
                        <div class="risk-indicator ${riskClass}"></div>
                        <span class="text-xs text-text-subtle">
                            ${riskLevel}
                        </span>
                    </div>
                </div>
            </div>

            ${earlyBuyersHtml}

            <button class="btn-primary w-full text-sm" onclick="openDetailedView()">
                View Detailed Analysis
            </button>
        </div>
    `;
}

function displayError(message) {
    emptyState.classList.add('hidden');
    resultsArea.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-red-600">
            <svg class="w-8 h-8 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <p class="text-sm text-center mb-2">${message}</p>
            <button onclick="clearError()" class="text-xs text-text-subtle hover:text-text-medium transition-colors">
                Try again
            </button>
        </div>
    `;
}

function clearError() {
    if (!currentTokenStats) {
        resultsArea.innerHTML = '';
        emptyState.classList.remove('hidden');
    }
}

function updateQuickStats(stats) {
    const riskLevel = getRiskLevel(stats.top_10_percentage);
    const riskClass = getRiskClass(stats.top_10_percentage);

    quickStats.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <div class="token-avatar" style="width: 1.5rem; height: 1.5rem; font-size: 0.75rem;">
                    ${(stats.token_symbol || '?').charAt(0)}
                </div>
                <div>
                    <p class="text-xs font-medium text-text-dark">
                        ${stats.token_symbol || 'Unknown'}
                    </p>
                    <p class="text-xs text-text-subtle">
                        ${stats.total_holders.toLocaleString()} holders
                    </p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-xs text-text-medium">Risk Level</p>
                <div class="flex items-center gap-1">
                    <div class="risk-indicator ${riskClass}"></div>
                    <span class="text-xs font-medium text-text-dark">
                        ${riskLevel.split(' ')[0]}
                    </span>
                </div>
            </div>
        </div>
    `;
}

function getRiskLevel(percentage) {
    if (percentage > 80) return 'High concentration risk';
    if (percentage > 50) return 'Moderate concentration';
    return 'Well distributed';
}

function getRiskClass(percentage) {
    if (percentage > 80) return 'risk-high';
    if (percentage > 50) return 'risk-medium';
    return 'risk-low';
}

function openDetailedView() {
    // Open the web app in a new tab for detailed analysis
    chrome.tabs.create({ url: 'http://localhost:3000/popup' });
}
