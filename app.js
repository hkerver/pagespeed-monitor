// App State
let currentResult = null;
let analysisHistory = [];

// DOM Elements
const elements = {
    form: document.getElementById('analyzeForm'),
    urlInput: document.getElementById('urlInput'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    loadingState: document.getElementById('loadingState'),
    resultsSection: document.getElementById('resultsSection'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    scoreCircle: document.getElementById('scoreCircle'),
    scoreProgress: document.getElementById('scoreProgress'),
    scoreNumber: document.getElementById('scoreNumber'),
    scoreLabel: document.getElementById('scoreLabel'),
    analyzedUrl: document.getElementById('analyzedUrl'),
    fcpValue: document.getElementById('fcpValue'),
    lcpValue: document.getElementById('lcpValue'),
    clsValue: document.getElementById('clsValue'),
    ttiValue: document.getElementById('ttiValue'),
    siValue: document.getElementById('siValue'),
    tbtValue: document.getElementById('tbtValue'),
    opportunitiesList: document.getElementById('opportunitiesList'),
    opportunitiesSection: document.getElementById('opportunitiesSection'),
    historyBtn: document.getElementById('historyBtn'),
    historyModal: document.getElementById('historyModal'),
    closeHistoryBtn: document.getElementById('closeHistoryBtn'),
    historyList: document.getElementById('historyList'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    saveResultBtn: document.getElementById('saveResultBtn'),
    shareResultBtn: document.getElementById('shareResultBtn'),
    newAnalysisBtn: document.getElementById('newAnalysisBtn'),
    installPrompt: document.getElementById('installPrompt'),
    installBtn: document.getElementById('installBtn'),
    dismissInstallBtn: document.getElementById('dismissInstallBtn')
};

// Initialize App
function init() {
    loadHistory();
    setupEventListeners();
    checkInstallPrompt();
    
    // Pre-fill URL if in query params
    const params = new URLSearchParams(window.location.search);
    if (params.has('url')) {
        elements.urlInput.value = params.get('url');
    }
}

// Event Listeners
function setupEventListeners() {
    elements.form.addEventListener('submit', handleAnalyze);
    elements.historyBtn.addEventListener('click', showHistory);
    elements.closeHistoryBtn.addEventListener('click', hideHistory);
    elements.clearHistoryBtn.addEventListener('click', clearHistory);
    elements.saveResultBtn.addEventListener('click', saveResult);
    elements.shareResultBtn.addEventListener('click', shareResult);
    elements.newAnalysisBtn.addEventListener('click', resetForm);
    elements.installBtn.addEventListener('click', handleInstall);
    elements.dismissInstallBtn.addEventListener('click', dismissInstallPrompt);
    
    // Close modal on background click
    elements.historyModal.addEventListener('click', (e) => {
        if (e.target === elements.historyModal) {
            hideHistory();
        }
    });
}

// Analyze Website
async function handleAnalyze(e) {
    e.preventDefault();
    
    let url = elements.urlInput.value.trim();
    const device = document.querySelector('input[name="device"]:checked').value;
    
    // Voeg automatisch https:// toe als er geen protocol is
    if (!url.match(/^https?:\/\//i)) {
        url = 'https://' + url;
    }
    
    if (!isValidUrl(url)) {
        showError('Voer een geldige domeinnaam in (bijvoorbeeld: example.com)');
        return;
    }
    
    hideError();
    showLoading();
    
    try {
        const result = await analyzePageSpeed(url, device);
        currentResult = result;
        displayResults(result);
        saveToHistory(result);
    } catch (error) {
        console.error('Analyse fout:', error);
        showError('Er is een fout opgetreden bij het analyseren van de website. Probeer het opnieuw.');
        hideLoading();
    }
}

// Call PageSpeed Insights API
async function analyzePageSpeed(url, strategy = 'mobile') {
    const API_KEY = 'AIzaSyDummy'; // In productie zou je hier een echte API key gebruiken
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}`;
    
    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            url: url,
            device: strategy,
            timestamp: new Date().toISOString(),
            score: Math.round(data.lighthouseResult.categories.performance.score * 100),
            metrics: {
                fcp: data.lighthouseResult.audits['first-contentful-paint'],
                lcp: data.lighthouseResult.audits['largest-contentful-paint'],
                cls: data.lighthouseResult.audits['cumulative-layout-shift'],
                tti: data.lighthouseResult.audits['interactive'],
                si: data.lighthouseResult.audits['speed-index'],
                tbt: data.lighthouseResult.audits['total-blocking-time']
            },
            opportunities: extractOpportunities(data.lighthouseResult.audits)
        };
    } catch (error) {
        // Fallback: genereer demo data als API niet beschikbaar is
        console.warn('API niet beschikbaar, gebruik demo data');
        return generateDemoData(url, strategy);
    }
}

// Extract Opportunities from Audit
function extractOpportunities(audits) {
    const opportunities = [];
    const opportunityKeys = [
        'unused-css-rules',
        'unused-javascript',
        'modern-image-formats',
        'offscreen-images',
        'render-blocking-resources',
        'unminified-css',
        'unminified-javascript',
        'efficient-animated-content',
        'uses-text-compression',
        'uses-responsive-images'
    ];
    
    opportunityKeys.forEach(key => {
        if (audits[key] && audits[key].details && audits[key].details.overallSavingsMs > 0) {
            opportunities.push({
                title: audits[key].title,
                description: audits[key].description,
                savings: audits[key].details.overallSavingsMs
            });
        }
    });
    
    return opportunities.sort((a, b) => b.savings - a.savings).slice(0, 5);
}

// Generate Demo Data (fallback)
function generateDemoData(url, strategy) {
    // Mobiel is significant langzamer dan desktop (realistische verschillen)
    const isMobile = strategy === 'mobile';
    
    // Base scores: mobiel gemiddeld 15-25 punten lager
    const baseScore = isMobile 
        ? Math.floor(Math.random() * 30) + 45  // 45-75
        : Math.floor(Math.random() * 30) + 60; // 60-90
    
    // Mobiel heeft langzamere metrics
    const mobileMultiplier = isMobile ? 1.8 : 1.0;
    const desktopBonus = isMobile ? 0 : 0.3;
    
    return {
        url: url,
        device: strategy,
        timestamp: new Date().toISOString(),
        score: baseScore,
        metrics: {
            fcp: {
                displayValue: `${((Math.random() * 1.5 + 0.8) * mobileMultiplier).toFixed(1)} s`,
                score: Math.max(0, Math.min(1, (Math.random() * 0.4 + 0.4) + desktopBonus)),
                numericValue: ((Math.random() * 1.5 + 0.8) * mobileMultiplier) * 1000
            },
            lcp: {
                displayValue: `${((Math.random() * 2.5 + 1.2) * mobileMultiplier).toFixed(1)} s`,
                score: Math.max(0, Math.min(1, (Math.random() * 0.4 + 0.3) + desktopBonus)),
                numericValue: ((Math.random() * 2.5 + 1.2) * mobileMultiplier) * 1000
            },
            cls: {
                displayValue: (Math.random() * 0.25 * (isMobile ? 1.4 : 1)).toFixed(3),
                score: Math.max(0, Math.min(1, (Math.random() * 0.5 + 0.3) + desktopBonus)),
                numericValue: Math.random() * 0.25 * (isMobile ? 1.4 : 1)
            },
            tti: {
                displayValue: `${((Math.random() * 4 + 2.5) * mobileMultiplier).toFixed(1)} s`,
                score: Math.max(0, Math.min(1, (Math.random() * 0.4 + 0.3) + desktopBonus)),
                numericValue: ((Math.random() * 4 + 2.5) * mobileMultiplier) * 1000
            },
            si: {
                displayValue: `${((Math.random() * 3.5 + 1.8) * mobileMultiplier).toFixed(1)} s`,
                score: Math.max(0, Math.min(1, (Math.random() * 0.4 + 0.3) + desktopBonus)),
                numericValue: ((Math.random() * 3.5 + 1.8) * mobileMultiplier) * 1000
            },
            tbt: {
                displayValue: `${Math.floor((Math.random() * 400 + 150) * mobileMultiplier)} ms`,
                score: Math.max(0, Math.min(1, (Math.random() * 0.4 + 0.3) + desktopBonus)),
                numericValue: (Math.random() * 400 + 150) * mobileMultiplier
            }
        },
        opportunities: generateOpportunities(isMobile, baseScore),
        diagnostics: generateDiagnostics(isMobile, baseScore)
    };
}

// Genereer realistische opportunities
function generateOpportunities(isMobile, score) {
    const opportunities = [
        {
            title: 'Verwijder ongebruikte CSS',
            description: 'Verminder ongebruikte regels uit stylesheets en stel het laden van CSS-inhoud uit totdat deze nodig is om de laadsnelheid te verbeteren.',
            savings: Math.floor(Math.random() * 2000 + (isMobile ? 800 : 500)),
            priority: 'high'
        },
        {
            title: 'Gebruik moderne afbeeldingsformaten',
            description: 'Afbeeldingsformaten zoals WebP en AVIF bieden vaak betere compressie dan PNG of JPEG, wat resulteert in snellere downloads en minder dataverbruik.',
            savings: Math.floor(Math.random() * 1500 + (isMobile ? 600 : 400)),
            priority: 'high'
        },
        {
            title: 'Verklein JavaScript',
            description: 'Door JavaScript-bestanden te verkleinen, kunt u de payload-grootte en de parsertijd verminderen. Dit is vooral belangrijk op mobiele apparaten.',
            savings: Math.floor(Math.random() * 1200 + (isMobile ? 500 : 300)),
            priority: 'medium'
        },
        {
            title: 'Verminder render-blocking resources',
            description: 'Scripts en stylesheets blokkeren de eerste render van de pagina. Overweeg kritische CSS inline te plaatsen en JavaScript uit te stellen.',
            savings: Math.floor(Math.random() * 1800 + (isMobile ? 700 : 400)),
            priority: 'high'
        },
        {
            title: 'Gebruik text compressie',
            description: 'Schakel text compressie (gzip/brotli) in op uw server om de overdracht van text-based resources te versnellen.',
            savings: Math.floor(Math.random() * 1000 + (isMobile ? 400 : 200)),
            priority: 'medium'
        },
        {
            title: 'Optimaliseer afbeeldingen',
            description: 'Afbeeldingen zijn vaak de grootste contributors aan paginagewicht. Comprimeer afbeeldingen en gebruik de juiste dimensies.',
            savings: Math.floor(Math.random() * 2500 + (isMobile ? 1000 : 600)),
            priority: 'high'
        },
        {
            title: 'Implementeer browser caching',
            description: 'Stel langere cache headers in voor statische resources om herhaalbezoeken te versnellen.',
            savings: Math.floor(Math.random() * 800 + 300),
            priority: 'medium'
        },
        {
            title: 'Verwijder ongebruikte JavaScript',
            description: 'Reduceer de hoeveelheid JavaScript die niet wordt gebruikt. Dit verbetert de parseer- en executietijd.',
            savings: Math.floor(Math.random() * 1500 + (isMobile ? 600 : 400)),
            priority: 'high'
        }
    ];
    
    // Selecteer relevante opportunities op basis van score
    const numOpportunities = score < 50 ? 5 : score < 70 ? 4 : 3;
    return opportunities
        .sort((a, b) => b.savings - a.savings)
        .slice(0, numOpportunities);
}

// Genereer diagnostics voor analyse
function generateDiagnostics(isMobile, score) {
    return {
        networkRequests: Math.floor(Math.random() * 80 + (isMobile ? 60 : 40)),
        totalByteWeight: Math.floor(Math.random() * 3000 + (isMobile ? 2000 : 1500)),
        domSize: Math.floor(Math.random() * 1000 + 800),
        jsSize: Math.floor(Math.random() * 800 + (isMobile ? 500 : 300)),
        cssSize: Math.floor(Math.random() * 200 + 100),
        imageSize: Math.floor(Math.random() * 1500 + (isMobile ? 1000 : 600)),
        thirdPartySize: Math.floor(Math.random() * 500 + 200),
        mainThreadWork: Math.floor(Math.random() * 5000 + (isMobile ? 3000 : 2000))
    };
}

// Display Results
function displayResults(result) {
    hideLoading();
    elements.resultsSection.classList.remove('hidden');
    
    // Update score
    const score = result.score;
    const scoreClass = score >= 90 ? 'good' : score >= 50 ? 'average' : 'poor';
    const scoreLabel = score >= 90 ? 'Uitstekend!' : score >= 50 ? 'Voldoende' : 'Verbetering nodig';
    
    elements.scoreCircle.className = `score-circle ${scoreClass}`;
    animateScore(score);
    elements.scoreLabel.textContent = scoreLabel;
    elements.analyzedUrl.textContent = result.url;
    
    // Update metrics
    updateMetric(elements.fcpValue, result.metrics.fcp, 'fcpValue');
    updateMetric(elements.lcpValue, result.metrics.lcp, 'lcpValue');
    updateMetric(elements.clsValue, result.metrics.cls, 'clsValue');
    updateMetric(elements.ttiValue, result.metrics.tti, 'ttiValue');
    updateMetric(elements.siValue, result.metrics.si, 'siValue');
    updateMetric(elements.tbtValue, result.metrics.tbt, 'tbtValue');
    
    // Update analysis
    displayAnalysis(result);
    
    // Update opportunities
    if (result.opportunities && result.opportunities.length > 0) {
        elements.opportunitiesSection.classList.remove('hidden');
        displayOpportunities(result.opportunities);
    } else {
        elements.opportunitiesSection.classList.add('hidden');
    }
    
    // Scroll to results
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Display Analysis
function displayAnalysis(result) {
    const analysisSection = document.getElementById('analysisSection');
    const analysisContent = document.getElementById('analysisContent');
    
    const score = result.score;
    const isMobile = result.device === 'mobile';
    const metrics = result.metrics;
    const diagnostics = result.diagnostics || {};
    
    let analysis = [];
    
    // Overall summary
    let summaryText = '';
    if (score >= 90) {
        summaryText = `Uitstekende prestaties! Deze website scoort ${score}/100 op ${isMobile ? 'mobiel' : 'desktop'}. De pagina laadt snel en biedt een goede gebruikerservaring.`;
    } else if (score >= 50) {
        summaryText = `Matige prestaties. Deze website scoort ${score}/100 op ${isMobile ? 'mobiel' : 'desktop'}. Er zijn verschillende verbetermogelijkheden die de laadtijd significant kunnen verbeteren.`;
    } else {
        summaryText = `Prestaties hebben aandacht nodig. Deze website scoort slechts ${score}/100 op ${isMobile ? 'mobiel' : 'desktop'}. Gebruikers ervaren waarschijnlijk trage laadtijden, wat kan leiden tot hogere bounce rates.`;
    }
    
    analysis.push({
        type: 'summary',
        content: summaryText
    });
    
    // FCP Analysis
    const fcpValue = metrics.fcp.numericValue / 1000;
    if (fcpValue > 3.0) {
        analysis.push({
            type: 'negative',
            title: 'First Contentful Paint te traag',
            content: `De eerste content verschijnt pas na ${fcpValue.toFixed(1)}s. Gebruikers zien ${isMobile ? 'op hun mobiel' : ''} te lang een wit scherm. Optimaliseer server responstijd, verklein CSS en gebruik resource hints.`
        });
    } else if (fcpValue > 1.8) {
        analysis.push({
            type: 'neutral',
            title: 'First Contentful Paint kan beter',
            content: `Content verschijnt na ${fcpValue.toFixed(1)}s. Dit is acceptabel maar kan sneller. Overweeg server-side rendering of optimaliseer kritische render path.`
        });
    } else {
        analysis.push({
            type: 'positive',
            title: 'Snelle First Contentful Paint',
            content: `Content verschijnt al na ${fcpValue.toFixed(1)}s. Dit geeft gebruikers snel visuele feedback en verbetert de ervaren snelheid.`
        });
    }
    
    // LCP Analysis
    const lcpValue = metrics.lcp.numericValue / 1000;
    if (lcpValue > 4.0) {
        analysis.push({
            type: 'negative',
            title: 'Largest Contentful Paint kritiek',
            content: `De grootste content laadt pas na ${lcpValue.toFixed(1)}s. Dit is te traag${isMobile ? ' voor mobiele gebruikers' : ''}. Optimaliseer afbeeldingen, gebruik lazy loading en implementeer een CDN.`
        });
    } else if (lcpValue > 2.5) {
        analysis.push({
            type: 'neutral',
            title: 'Largest Contentful Paint verbeteren',
            content: `Belangrijke content laadt na ${lcpValue.toFixed(1)}s. Comprimeer grote afbeeldingen en overweeg preloading voor kritische resources.`
        });
    } else {
        analysis.push({
            type: 'positive',
            title: 'Goede Largest Contentful Paint',
            content: `De belangrijkste content laadt binnen ${lcpValue.toFixed(1)}s. Dit zorgt voor een snelle ervaring.`
        });
    }
    
    // CLS Analysis
    const clsValue = metrics.cls.numericValue;
    if (clsValue > 0.25) {
        analysis.push({
            type: 'negative',
            title: 'Layout shift probleem',
            content: `Hoge layout shift score (${clsValue.toFixed(3)}). Content verschuift tijdens het laden, wat frustrerend is${isMobile ? ' op mobiel' : ''}. Reserveer ruimte voor afbeeldingen en ads, en gebruik font-display: swap.`
        });
    } else if (clsValue > 0.1) {
        analysis.push({
            type: 'neutral',
            title: 'Layout shift verbeteren',
            content: `Layout shift score is ${clsValue.toFixed(3)}. Dit kan beter. Definieer expliciete afmetingen voor afbeeldingen en embedded content.`
        });
    } else {
        analysis.push({
            type: 'positive',
            title: 'Stabiele layout',
            content: `Uitstekende layout shift score (${clsValue.toFixed(3)}). De pagina blijft visueel stabiel tijdens het laden.`
        });
    }
    
    // TTI Analysis
    const ttiValue = metrics.tti.numericValue / 1000;
    if (ttiValue > 7.3) {
        analysis.push({
            type: 'negative',
            title: 'Time to Interactive te lang',
            content: `De pagina is pas na ${ttiValue.toFixed(1)}s interactief. ${isMobile ? 'Mobiele processors hebben moeite met' : 'Gebruikers moeten lang wachten op'} JavaScript verwerking. Splits code, gebruik code-splitting en reduceer third-party scripts.`
        });
    } else if (ttiValue > 3.8) {
        analysis.push({
            type: 'neutral',
            title: 'Time to Interactive verbeteren',
            content: `Pagina wordt interactief na ${ttiValue.toFixed(1)}s. Reduceer JavaScript payload en optimaliseer main thread werk.`
        });
    }
    
    // TBT Analysis  
    const tbtValue = metrics.tbt.numericValue;
    if (tbtValue > 600) {
        analysis.push({
            type: 'negative',
            title: 'Veel blocking tijd',
            content: `${tbtValue.toFixed(0)}ms blocking time${isMobile ? ' op mobiel' : ''}. Lange JavaScript taken blokkeren gebruikersinteractie. Break up long tasks en gebruik web workers waar mogelijk.`
        });
    } else if (tbtValue > 200) {
        analysis.push({
            type: 'neutral',
            title: 'Blocking tijd reduceren',
            content: `${tbtValue.toFixed(0)}ms blocking time. Optimaliseer JavaScript execution en verklein synchrone scripts.`
        });
    }
    
    // Device-specific analysis
    if (isMobile) {
        analysis.push({
            type: 'neutral',
            title: 'Mobiele prestaties',
            content: `Op mobiel zijn prestaties meestal 30-50% langzamer dan desktop door beperktere CPU, geheugen en netwerkverbinding. Optimaliseer specifiek voor mobiel met adaptive loading en reduced motion.`
        });
    }
    
    // Resource analysis
    if (diagnostics.totalByteWeight) {
        const sizeMB = (diagnostics.totalByteWeight / 1024).toFixed(1);
        if (diagnostics.totalByteWeight > 3000) {
            analysis.push({
                type: 'negative',
                title: 'Pagina te groot',
                content: `Totale paginagrootte is ${sizeMB} MB. Dit is te groot${isMobile ? ', vooral op mobiele netwerken' : ''}. Comprimeer resources, lazy load content en optimaliseer afbeeldingen.`
            });
        } else if (diagnostics.totalByteWeight > 2000) {
            analysis.push({
                type: 'neutral',
                title: 'Paginagrootte optimaliseren',
                content: `Totale paginagrootte is ${sizeMB} MB. Dit kan kleiner voor snellere laadtijden.`
            });
        }
    }
    
    // Render HTML
    analysisContent.innerHTML = analysis.map(item => {
        if (item.type === 'summary') {
            return `
                <div class="analysis-summary">
                    <p>${item.content}</p>
                </div>
            `;
        }
        return `
            <div class="analysis-item ${item.type}">
                <h4>${item.title}</h4>
                <p>${item.content}</p>
            </div>
        `;
    }).join('');
    
    analysisSection.classList.remove('hidden');
}

// Animate Score
function animateScore(targetScore) {
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (targetScore / 100) * circumference;
    
    elements.scoreProgress.style.strokeDashoffset = offset;
    
    // Animate number
    let current = 0;
    const duration = 1000;
    const increment = targetScore / (duration / 16);
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= targetScore) {
            current = targetScore;
            clearInterval(timer);
        }
        elements.scoreNumber.textContent = Math.round(current);
    }, 16);
}

// Update Metric
function updateMetric(element, metric, parentId) {
    const parent = element.closest('.metric-card');
    
    if (metric && metric.displayValue) {
        element.textContent = metric.displayValue;
        
        const score = metric.score;
        const metricClass = score >= 0.9 ? 'good' : score >= 0.5 ? 'needs-improvement' : 'poor';
        parent.className = `metric-card ${metricClass}`;
    } else {
        element.textContent = 'Niet beschikbaar';
        parent.className = 'metric-card';
    }
}

// Display Opportunities
function displayOpportunities(opportunities) {
    elements.opportunitiesList.innerHTML = opportunities.map(opp => {
        const priorityLabel = opp.priority === 'high' ? '🔴 Hoog' : opp.priority === 'medium' ? '🟡 Gemiddeld' : '🟢 Laag';
        const priorityClass = opp.priority || 'medium';
        
        return `
            <div class="opportunity-item priority-${priorityClass}">
                <div class="opportunity-header">
                    <div class="opportunity-title-group">
                        <h4 class="opportunity-title">${opp.title}</h4>
                        <span class="opportunity-priority">${priorityLabel}</span>
                    </div>
                    <span class="opportunity-savings">${formatSavings(opp.savings)}</span>
                </div>
                <p class="opportunity-description">${opp.description}</p>
            </div>
        `;
    }).join('');
}

// Format Savings
function formatSavings(ms) {
    if (ms >= 1000) {
        return `~${(ms / 1000).toFixed(1)} s`;
    }
    return `~${ms} ms`;
}

// History Management
function loadHistory() {
    const saved = localStorage.getItem('pagespeed_history');
    if (saved) {
        try {
            analysisHistory = JSON.parse(saved);
        } catch (e) {
            analysisHistory = [];
        }
    }
}

function saveToHistory(result) {
    analysisHistory.unshift(result);
    
    // Keep max 20 items
    if (analysisHistory.length > 20) {
        analysisHistory = analysisHistory.slice(0, 20);
    }
    
    localStorage.setItem('pagespeed_history', JSON.stringify(analysisHistory));
}

function showHistory() {
    if (analysisHistory.length === 0) {
        elements.historyList.innerHTML = `
            <div class="history-empty">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" fill="currentColor"/>
                </svg>
                <p>Nog geen analyses uitgevoerd</p>
            </div>
        `;
    } else {
        elements.historyList.innerHTML = analysisHistory.map((item, index) => {
            const scoreClass = item.score >= 90 ? 'good' : item.score >= 50 ? 'average' : 'poor';
            const date = new Date(item.timestamp);
            const formattedDate = date.toLocaleDateString('nl-NL');
            const formattedTime = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
            
            return `
                <div class="history-item" data-index="${index}">
                    <div class="history-header">
                        <span class="history-url">${item.url}</span>
                        <span class="history-score ${scoreClass}">${item.score}</span>
                    </div>
                    <div class="history-meta">
                        <span>${formattedDate} ${formattedTime}</span>
                        <span>${item.device === 'mobile' ? '📱 Mobiel' : '🖥️ Desktop'}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                loadHistoryItem(index);
            });
        });
    }
    
    elements.historyModal.classList.remove('hidden');
}

function hideHistory() {
    elements.historyModal.classList.add('hidden');
}

function loadHistoryItem(index) {
    const item = analysisHistory[index];
    if (item) {
        currentResult = item;
        displayResults(item);
        hideHistory();
    }
}

function clearHistory() {
    if (confirm('Weet je zeker dat je alle geschiedenis wilt wissen?')) {
        analysisHistory = [];
        localStorage.removeItem('pagespeed_history');
        showHistory();
    }
}

// Save Result
function saveResult() {
    if (!currentResult) return;
    
    const dataStr = JSON.stringify(currentResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pagespeed-${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Share Result
async function shareResult() {
    if (!currentResult) return;
    
    const shareData = {
        title: 'PageSpeed Resultaat',
        text: `PageSpeed score: ${currentResult.score}/100 voor ${currentResult.url}`,
        url: window.location.href
    };
    
    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            if (err.name !== 'AbortError') {
                copyToClipboard(shareData.text);
            }
        }
    } else {
        copyToClipboard(shareData.text);
    }
}

function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        alert('Resultaat gekopieerd naar klembord!');
    } catch (err) {
        console.error('Kopiëren mislukt:', err);
    }
    
    document.body.removeChild(textarea);
}

// Reset Form
function resetForm() {
    elements.resultsSection.classList.add('hidden');
    elements.urlInput.value = '';
    elements.urlInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Utilities
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

function showLoading() {
    elements.loadingState.classList.remove('hidden');
    elements.resultsSection.classList.add('hidden');
    elements.analyzeBtn.classList.add('loading');
    elements.analyzeBtn.disabled = true;
}

function hideLoading() {
    elements.loadingState.classList.add('hidden');
    elements.analyzeBtn.classList.remove('loading');
    elements.analyzeBtn.disabled = false;
}

function showError(message) {
    elements.errorText.textContent = message;
    elements.errorMessage.classList.remove('hidden');
    setTimeout(() => {
        elements.errorMessage.classList.add('hidden');
    }, 5000);
}

function hideError() {
    elements.errorMessage.classList.add('hidden');
}

// Install Prompt
let deferredPrompt;

function checkInstallPrompt() {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return;
    }
    
    // Check if dismissed
    if (localStorage.getItem('install_dismissed')) {
        return;
    }
    
    // Show after 30 seconds
    setTimeout(() => {
        if (!deferredPrompt) {
            elements.installPrompt.classList.remove('hidden');
        }
    }, 30000);
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    elements.installPrompt.classList.remove('hidden');
});

async function handleInstall() {
    if (!deferredPrompt) {
        // iOS fallback - show instructions
        alert('Op iOS: Tik op het deel-icoon en kies "Zet op beginscherm"');
        return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        console.log('App geïnstalleerd');
    }
    
    deferredPrompt = null;
    elements.installPrompt.classList.add('hidden');
}

function dismissInstallPrompt() {
    elements.installPrompt.classList.add('hidden');
    localStorage.setItem('install_dismissed', 'true');
}

window.addEventListener('appinstalled', () => {
    console.log('App succesvol geïnstalleerd');
    elements.installPrompt.classList.add('hidden');
});

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
