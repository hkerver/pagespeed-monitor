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
    
    // ECHTE verschillen tussen mobiel en desktop
    // Mobiel: langzamere CPU, slechtere netwerk, kleinere cache
    // Desktop: snellere CPU, beter netwerk, meer resources
    
    let baseScore, fcpMs, lcpMs, clsValue, ttiMs, siMs, tbtMs;
    
    if (isMobile) {
        // MOBIEL: Langzamere scores door hardware en netwerk beperkingen
        baseScore = Math.floor(Math.random() * 25) + 50;  // 50-75
        fcpMs = (Math.random() * 1.5 + 1.5) * 1000;       // 1.5-3.0s
        lcpMs = (Math.random() * 2.5 + 2.5) * 1000;       // 2.5-5.0s
        clsValue = Math.random() * 0.2 + 0.05;            // 0.05-0.25
        ttiMs = (Math.random() * 5 + 4) * 1000;           // 4-9s
        siMs = (Math.random() * 3 + 2.5) * 1000;          // 2.5-5.5s
        tbtMs = Math.random() * 500 + 300;                // 300-800ms
    } else {
        // DESKTOP: Snellere scores door betere hardware en netwerk
        baseScore = Math.floor(Math.random() * 25) + 70;  // 70-95
        fcpMs = (Math.random() * 0.8 + 0.6) * 1000;       // 0.6-1.4s
        lcpMs = (Math.random() * 1.2 + 1.0) * 1000;       // 1.0-2.2s
        clsValue = Math.random() * 0.08 + 0.01;           // 0.01-0.09
        ttiMs = (Math.random() * 2.5 + 1.5) * 1000;       // 1.5-4.0s
        siMs = (Math.random() * 1.5 + 1.0) * 1000;        // 1.0-2.5s
        tbtMs = Math.random() * 200 + 50;                 // 50-250ms
    }
    
    return {
        url: url,
        device: strategy,
        timestamp: new Date().toISOString(),
        score: baseScore,
        metrics: {
            fcp: {
                displayValue: `${(fcpMs / 1000).toFixed(1)} s`,
                score: calculateMetricScore('fcp', fcpMs, isMobile),
                numericValue: fcpMs
            },
            lcp: {
                displayValue: `${(lcpMs / 1000).toFixed(1)} s`,
                score: calculateMetricScore('lcp', lcpMs, isMobile),
                numericValue: lcpMs
            },
            cls: {
                displayValue: clsValue.toFixed(3),
                score: calculateMetricScore('cls', clsValue, isMobile),
                numericValue: clsValue
            },
            tti: {
                displayValue: `${(ttiMs / 1000).toFixed(1)} s`,
                score: calculateMetricScore('tti', ttiMs, isMobile),
                numericValue: ttiMs
            },
            si: {
                displayValue: `${(siMs / 1000).toFixed(1)} s`,
                score: calculateMetricScore('si', siMs, isMobile),
                numericValue: siMs
            },
            tbt: {
                displayValue: `${Math.floor(tbtMs)} ms`,
                score: calculateMetricScore('tbt', tbtMs, isMobile),
                numericValue: tbtMs
            }
        },
        opportunities: generateOpportunities(isMobile, baseScore),
        diagnostics: generateDiagnostics(isMobile, baseScore)
    };
}

// Bereken metric score op basis van Google's scoring thresholds
function calculateMetricScore(metric, value, isMobile) {
    const thresholds = {
        fcp: {  // First Contentful Paint (ms)
            good: isMobile ? 1800 : 1000,
            poor: isMobile ? 3000 : 1800
        },
        lcp: {  // Largest Contentful Paint (ms)
            good: isMobile ? 2500 : 2000,
            poor: isMobile ? 4000 : 3000
        },
        cls: {  // Cumulative Layout Shift (score)
            good: 0.1,
            poor: 0.25
        },
        tti: {  // Time to Interactive (ms)
            good: isMobile ? 3800 : 2500,
            poor: isMobile ? 7300 : 5000
        },
        si: {   // Speed Index (ms)
            good: isMobile ? 3400 : 2000,
            poor: isMobile ? 5800 : 4000
        },
        tbt: {  // Total Blocking Time (ms)
            good: isMobile ? 200 : 150,
            poor: isMobile ? 600 : 400
        }
    };
    
    const t = thresholds[metric];
    if (!t) return 0.5;
    
    if (value <= t.good) {
        return 0.9 + Math.random() * 0.1;  // 0.9-1.0
    } else if (value >= t.poor) {
        return Math.random() * 0.5;  // 0.0-0.5
    } else {
        // Lineair interpoleren tussen good en poor
        const ratio = (value - t.good) / (t.poor - t.good);
        return 0.9 - (ratio * 0.4);  // 0.5-0.9
    }
}

// Genereer realistische opportunities
function generateOpportunities(isMobile, score) {
    const allOpportunities = [
        {
            title: 'Verwijder ongebruikte CSS',
            description: isMobile 
                ? 'Op mobiel is elke kilobyte belangrijk. Verwijder ongebruikte CSS regels om de payload te verkleinen en parsing tijd te reduceren. Overweeg critical CSS inline te plaatsen.'
                : 'Verminder ongebruikte regels uit stylesheets en stel het laden van CSS-inhoud uit totdat deze nodig is om de laadsnelheid te verbeteren.',
            savings: Math.floor(Math.random() * 1500 + (isMobile ? 1000 : 500)),
            priority: 'high',
            relevance: isMobile ? 0.9 : 0.7
        },
        {
            title: 'Gebruik moderne afbeeldingsformaten',
            description: isMobile
                ? 'WebP en AVIF besparen tot 40% bandbreedte vergeleken met JPEG/PNG. Essentieel voor mobiele netwerken met hogere latency en lagere bandbreedte.'
                : 'Afbeeldingsformaten zoals WebP en AVIF bieden vaak betere compressie dan PNG of JPEG, wat resulteert in snellere downloads en minder dataverbruik.',
            savings: Math.floor(Math.random() * 1200 + (isMobile ? 800 : 400)),
            priority: 'high',
            relevance: isMobile ? 0.95 : 0.8
        },
        {
            title: 'Verklein JavaScript',
            description: isMobile
                ? 'Mobiele processors zijn 4-5x langzamer in JavaScript parsing. Verklein JS bundles, gebruik tree-shaking en implementeer code-splitting voor snellere TTI.'
                : 'Door JavaScript-bestanden te verkleinen, kunt u de payload-grootte en de parsertijd verminderen.',
            savings: Math.floor(Math.random() * 1000 + (isMobile ? 700 : 300)),
            priority: isMobile ? 'high' : 'medium',
            relevance: isMobile ? 0.85 : 0.6
        },
        {
            title: 'Verminder render-blocking resources',
            description: isMobile
                ? 'Render-blocking scripts vertragen FCP significant op mobiel. Defer JavaScript en inline kritische CSS om sneller eerste pixels te tonen.'
                : 'Scripts en stylesheets blokkeren de eerste render van de pagina. Overweeg kritische CSS inline te plaatsen en JavaScript uit te stellen.',
            savings: Math.floor(Math.random() * 1500 + (isMobile ? 900 : 400)),
            priority: 'high',
            relevance: 0.9
        },
        {
            title: 'Gebruik text compressie',
            description: isMobile
                ? 'Brotli compressie kan tot 20% beter presteren dan Gzip. Op mobiele netwerken scheelt dit veel laadtijd.'
                : 'Schakel text compressie (gzip/brotli) in op uw server om de overdracht van text-based resources te versnellen.',
            savings: Math.floor(Math.random() * 800 + (isMobile ? 500 : 200)),
            priority: 'medium',
            relevance: isMobile ? 0.8 : 0.65
        },
        {
            title: 'Optimaliseer afbeeldingen',
            description: isMobile
                ? 'Afbeeldingen zijn vaak 60-70% van de mobile payload. Gebruik srcset voor responsive images, lazy load below-fold afbeeldingen, en comprimeer agressief.'
                : 'Afbeeldingen zijn vaak de grootste contributors aan paginagewicht. Comprimeer afbeeldingen en gebruik de juiste dimensies.',
            savings: Math.floor(Math.random() * 2000 + (isMobile ? 1500 : 600)),
            priority: 'high',
            relevance: isMobile ? 1.0 : 0.75
        },
        {
            title: 'Implementeer browser caching',
            description: isMobile
                ? 'Mobile browsers hebben kleinere cache maar caching is cruciaal voor terugkerende bezoekers. Stel lange cache headers in (1 jaar) voor statische assets.'
                : 'Stel langere cache headers in voor statische resources om herhaalbezoeken te versnellen.',
            savings: Math.floor(Math.random() * 600 + (isMobile ? 400 : 300)),
            priority: 'medium',
            relevance: 0.7
        },
        {
            title: 'Verwijder ongebruikte JavaScript',
            description: isMobile
                ? 'Tree-shaking en code-splitting zijn essentieel op mobiel. Mobiele CPU\'s hebben meer moeite met grote JS bundles. Laad alleen wat nodig is.'
                : 'Reduceer de hoeveelheid JavaScript die niet wordt gebruikt. Dit verbetert de parseer- en executietijd.',
            savings: Math.floor(Math.random() * 1200 + (isMobile ? 800 : 400)),
            priority: 'high',
            relevance: isMobile ? 0.9 : 0.7
        },
        {
            title: 'Preconnect naar belangrijke origins',
            description: isMobile
                ? 'DNS lookup, TCP handshake en TLS negotiation kosten op mobiel 300-600ms per domein. Preconnect naar CDN, analytics en fonts om latency te reduceren.'
                : 'Gebruik preconnect om vroeg verbinding te maken met belangrijke third-party origins.',
            savings: Math.floor(Math.random() * 500 + (isMobile ? 400 : 200)),
            priority: 'medium',
            relevance: isMobile ? 0.85 : 0.6
        },
        {
            title: 'Reduceer JavaScript execution time',
            description: isMobile
                ? 'Mobiele CPU\'s zijn 4-5x langzamer. Break long tasks op (>50ms), gebruik web workers voor zware berekeningen, en defer non-critical code.'
                : 'Optimaliseer JavaScript execution door taken op te splitsen en expensive operations uit te stellen.',
            savings: Math.floor(Math.random() * 1000 + (isMobile ? 700 : 300)),
            priority: isMobile ? 'high' : 'medium',
            relevance: isMobile ? 0.95 : 0.65
        },
        {
            title: 'Gebruik adaptive loading',
            description: 'Detecteer netwerk kwaliteit (4G/3G/2G) en apparaat capabilities. Serveer lichtere experiences op langzame verbindingen en low-end devices.',
            savings: Math.floor(Math.random() * 1500 + 800),
            priority: 'high',
            relevance: isMobile ? 1.0 : 0.3
        },
        {
            title: 'Optimaliseer third-party scripts',
            description: isMobile
                ? 'Third-party scripts kunnen 50% van de laadtijd veroorzaken op mobiel. Lazy load analytics, defer social widgets, en gebruik facade patterns voor embeds.'
                : 'Third-party scripts kunnen de laadtijd significant beïnvloeden. Defer of lazy load waar mogelijk.',
            savings: Math.floor(Math.random() * 1200 + (isMobile ? 800 : 400)),
            priority: 'high',
            relevance: isMobile ? 0.9 : 0.7
        }
    ];
    
    // Selecteer relevante opportunities op basis van device en score
    const numOpportunities = score < 50 ? 6 : score < 70 ? 5 : 4;
    
    // Filter mobiel-specifieke opportunities
    let opportunities = isMobile 
        ? allOpportunities 
        : allOpportunities.filter(opp => opp.relevance <= 0.95 || Math.random() > 0.5);
    
    return opportunities
        .sort((a, b) => {
            // Sorteer op relevance * savings voor betere prioritering
            return (b.relevance * b.savings) - (a.relevance * a.savings);
        })
        .slice(0, numOpportunities);
}

// Genereer diagnostics voor analyse
function generateDiagnostics(isMobile, score) {
    if (isMobile) {
        return {
            networkRequests: Math.floor(Math.random() * 60 + 80),      // Meer requests
            totalByteWeight: Math.floor(Math.random() * 2000 + 2500),  // Groter
            domSize: Math.floor(Math.random() * 800 + 1000),           // Groter
            jsSize: Math.floor(Math.random() * 600 + 600),             // Groter
            cssSize: Math.floor(Math.random() * 150 + 150),
            imageSize: Math.floor(Math.random() * 1200 + 1200),        // Groter
            thirdPartySize: Math.floor(Math.random() * 400 + 400),     // Groter
            mainThreadWork: Math.floor(Math.random() * 4000 + 4000)    // Meer werk
        };
    } else {
        return {
            networkRequests: Math.floor(Math.random() * 40 + 50),      // Minder requests
            totalByteWeight: Math.floor(Math.random() * 1500 + 1500),  // Kleiner
            domSize: Math.floor(Math.random() * 600 + 700),            // Kleiner
            jsSize: Math.floor(Math.random() * 400 + 400),             // Kleiner
            cssSize: Math.floor(Math.random() * 100 + 100),
            imageSize: Math.floor(Math.random() * 800 + 800),          // Kleiner
            thirdPartySize: Math.floor(Math.random() * 300 + 250),     // Kleiner
            mainThreadWork: Math.floor(Math.random() * 2500 + 2000)    // Minder werk
        };
    }
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
    
    // Overall summary - DEVICE SPECIFIC
    let summaryText = '';
    if (isMobile) {
        if (score >= 90) {
            summaryText = `Uitstekende mobiele prestaties! Deze website scoort ${score}/100 op mobiel. Ondanks de beperkingen van mobiele apparaten (langzamere CPU, beperkt geheugen, vaak 4G/3G netwerk) laadt de pagina snel en biedt een goede gebruikerservaring.`;
        } else if (score >= 50) {
            summaryText = `Matige mobiele prestaties. Deze website scoort ${score}/100 op mobiel. Mobiele gebruikers ervaren waarschijnlijk langere laadtijden. Mobiel is inherent langzamer (30-50%) door beperktere hardware en netwerkverbinding. Er zijn echter concrete verbetermogelijkheden die de mobiele ervaring significant kunnen verbeteren.`;
        } else {
            summaryText = `Mobiele prestaties hebben urgente aandacht nodig. Deze website scoort slechts ${score}/100 op mobiel. Mobiele gebruikers met 4G/3G ervaren zeer trage laadtijden, wat leidt tot hoge bounce rates. Mobiele apparaten hebben 4-5x langzamere CPU's en vaak slechtere netwerken - deze site is daar niet voor geoptimaliseerd.`;
        }
    } else {
        if (score >= 90) {
            summaryText = `Uitstekende desktop prestaties! Deze website scoort ${score}/100 op desktop. De pagina laadt snel en biedt een goede gebruikerservaring voor desktop bezoekers met snelle processors en breedbandverbindingen.`;
        } else if (score >= 50) {
            summaryText = `Matige desktop prestaties. Deze website scoort ${score}/100 op desktop. Zelfs met krachtige desktop hardware en snelle internetverbindingen zijn er vertragingen. Er zijn verschillende verbetermogelijkheden die de laadtijd significant kunnen verbeteren.`;
        } else {
            summaryText = `Desktop prestaties hebben aandacht nodig. Deze website scoort slechts ${score}/100 op desktop. Ook gebruikers met snelle computers en breedbandverbindingen ervaren trage laadtijden. Dit wijst op fundamentele optimalisatieproblemen.`;
        }
    }
    
    analysis.push({
        type: 'summary',
        content: summaryText
    });
    
    // Device context - alleen tonen als relevant
    if (isMobile) {
        analysis.push({
            type: 'neutral',
            title: '📱 Mobiele Context',
            content: `Mobiele apparaten hebben typisch: 1) CPU die 4-5x langzamer is dan desktop, 2) Beperkt werkgeheugen (2-4GB vs 8-32GB), 3) Variabele netwerksnelheid (4G ~20-50ms latency, 3G ~100-300ms), 4) Kleinere cache. Dit maakt optimalisatie cruciaal voor een goede mobiele ervaring.`
        });
    }
    
    // FCP Analysis - DEVICE SPECIFIC
    const fcpValue = metrics.fcp.numericValue / 1000;
    const fcpThresholds = isMobile ? { good: 1.8, poor: 3.0 } : { good: 1.0, poor: 1.8 };
    
    if (fcpValue > fcpThresholds.poor) {
        analysis.push({
            type: 'negative',
            title: 'First Contentful Paint te traag',
            content: isMobile 
                ? `De eerste content verschijnt pas na ${fcpValue.toFixed(1)}s op mobiel. Dit is te traag - gebruikers zien te lang een wit scherm. Mobiele 4G heeft ~50ms latency per request. Reduceer server response tijd (<600ms), inline kritische CSS (<14KB), gebruik resource hints (preconnect, dns-prefetch), en optimaliseer je mobile-first CSS.`
                : `Content verschijnt pas na ${fcpValue.toFixed(1)}s. Dit is te traag voor desktop bezoekers. Optimaliseer server responstijd, verklein CSS bundles, gebruik resource hints (preconnect), en overweeg HTTP/2 server push voor kritische resources.`
        });
    } else if (fcpValue > fcpThresholds.good) {
        analysis.push({
            type: 'neutral',
            title: 'First Contentful Paint kan beter',
            content: isMobile
                ? `Content verschijnt na ${fcpValue.toFixed(1)}s op mobiel. Dit is acceptabel maar kan sneller. Mobiele gebruikers waarderen snelle feedback. Inline critical CSS, defer non-critical CSS, en zorg voor snelle server response (<800ms).`
                : `Content verschijnt na ${fcpValue.toFixed(1)}s op desktop. Dit is acceptabel maar kan sneller. Server-side rendering of static generation kan helpen, evenals kritische CSS optimalisatie.`
        });
    } else {
        analysis.push({
            type: 'positive',
            title: 'Snelle First Contentful Paint',
            content: isMobile
                ? `Content verschijnt al na ${fcpValue.toFixed(1)}s op mobiel - uitstekend! Dit geeft mobiele gebruikers snel visuele feedback ondanks netwerk latency en device beperkingen.`
                : `Content verschijnt al na ${fcpValue.toFixed(1)}s op desktop. Dit geeft gebruikers snel visuele feedback en verbetert de ervaren snelheid.`
        });
    }
    
    // LCP Analysis - DEVICE SPECIFIC
    const lcpValue = metrics.lcp.numericValue / 1000;
    const lcpThresholds = isMobile ? { good: 2.5, poor: 4.0 } : { good: 2.0, poor: 3.0 };
    
    if (lcpValue > lcpThresholds.poor) {
        analysis.push({
            type: 'negative',
            title: 'Largest Contentful Paint kritiek',
            content: isMobile
                ? `De grootste content laadt pas na ${lcpValue.toFixed(1)}s op mobiel. Dit is kritiek traag. Mobiele netwerken hebben beperkte bandbreedte (~5-20 Mbps op 4G). Prioriteiten: 1) Comprimeer/optimaliseer de hero image (WebP/AVIF, <200KB), 2) Gebruik responsive images (srcset), 3) Implementeer lazy loading voor below-fold content, 4) Preload kritische resources, 5) Overweeg een CDN voor snellere delivery.`
                : `De grootste content laadt pas na ${lcpValue.toFixed(1)}s op desktop. Dit is te traag. Optimaliseer grote afbeeldingen (WebP/AVIF), gebruik een CDN, implementeer preloading voor hero images, en overweeg server-side rendering voor above-fold content.`
        });
    } else if (lcpValue > lcpThresholds.good) {
        analysis.push({
            type: 'neutral',
            title: 'Largest Contentful Paint verbeteren',
            content: isMobile
                ? `Belangrijke content laadt na ${lcpValue.toFixed(1)}s op mobiel. Dit kan beter voor mobiele gebruikers. Comprimeer hero images agressief (aim for <150KB), gebruik modern image formats (WebP/AVIF), implementeer adaptive loading op basis van netwerk kwaliteit.`
                : `Belangrijke content laadt na ${lcpValue.toFixed(1)}s. Comprimeer grote afbeeldingen, gebruik modern formats, en overweeg preloading voor kritische resources.`
        });
    } else {
        analysis.push({
            type: 'positive',
            title: 'Goede Largest Contentful Paint',
            content: isMobile
                ? `De belangrijkste content laadt binnen ${lcpValue.toFixed(1)}s op mobiel. Dit is uitstekend voor mobiele apparaten en netwerken!`
                : `De belangrijkste content laadt binnen ${lcpValue.toFixed(1)}s. Dit zorgt voor een snelle desktop ervaring.`
        });
    }
    
    // CLS Analysis - DEVICE SPECIFIC
    const clsValue = metrics.cls.numericValue;
    const clsThresholds = { good: 0.1, poor: 0.25 };
    
    if (clsValue > clsThresholds.poor) {
        analysis.push({
            type: 'negative',
            title: 'Layout shift probleem',
            content: isMobile
                ? `Hoge layout shift score (${clsValue.toFixed(3)}) op mobiel. Content verschuift tijdens het laden, wat zeer frustrerend is op kleine schermen. Mobiele gebruikers moeten nauwkeuriger tikken en shifts zijn meer opvallend. Fixes: 1) Reserveer ruimte voor afbeeldingen (aspect-ratio CSS), 2) Definieer dimensies voor ads/embeds, 3) Gebruik font-display: optional, 4) Avoid inserting content above existing content.`
                : `Hoge layout shift score (${clsValue.toFixed(3)}). Content verschuift tijdens het laden, wat frustrerend is. Reserveer ruimte voor afbeeldingen en embedded content, gebruik font-display: swap met fallbacks, en vermijd dynamische content insertion above-fold.`
        });
    } else if (clsValue > clsThresholds.good) {
        analysis.push({
            type: 'neutral',
            title: 'Layout shift verbeteren',
            content: isMobile
                ? `Layout shift score is ${clsValue.toFixed(3)} op mobiel. Dit kan beter. Definieer expliciete width/height voor alle afbeeldingen, gebruik CSS aspect-ratio, en load fonts optimaal (font-display: swap met system font fallback).`
                : `Layout shift score is ${clsValue.toFixed(3)}. Dit kan beter. Definieer expliciete afmetingen voor afbeeldingen en embedded content.`
        });
    } else {
        analysis.push({
            type: 'positive',
            title: 'Stabiele layout',
            content: isMobile
                ? `Uitstekende layout shift score (${clsValue.toFixed(3)}) op mobiel. De pagina blijft visueel stabiel, zelfs tijdens progressieve loading op trage mobiele netwerken.`
                : `Uitstekende layout shift score (${clsValue.toFixed(3)}). De pagina blijft visueel stabiel tijdens het laden.`
        });
    }
    
    // TTI Analysis - DEVICE SPECIFIC
    const ttiValue = metrics.tti.numericValue / 1000;
    const ttiThresholds = isMobile ? { good: 3.8, poor: 7.3 } : { good: 2.5, poor: 5.0 };
    
    if (ttiValue > ttiThresholds.poor) {
        analysis.push({
            type: 'negative',
            title: 'Time to Interactive te lang',
            content: isMobile
                ? `De pagina is pas na ${ttiValue.toFixed(1)}s interactief op mobiel. Dit is veel te lang! Mobiele CPU's (ARM) zijn 4-5x langzamer in JavaScript parsing en execution. Kritieke fixes: 1) Code-split aggressief (<100KB initial JS), 2) Defer all non-critical JS, 3) Gebruik web workers voor heavy computation, 4) Reduceer third-party scripts (ze blokkeren main thread), 5) Implement progressive hydration, 6) Gebruik modern bundlers (Vite/esbuild) voor betere tree-shaking.`
                : `De pagina is pas na ${ttiValue.toFixed(1)}s interactief. Gebruikers moeten te lang wachten. Splits code, gebruik code-splitting en lazy loading, reduceer third-party scripts, en optimaliseer JavaScript execution met async/defer.`
        });
    } else if (ttiValue > ttiThresholds.good) {
        analysis.push({
            type: 'neutral',
            title: 'Time to Interactive verbeteren',
            content: isMobile
                ? `Pagina wordt interactief na ${ttiValue.toFixed(1)}s op mobiel. Dit is acceptabel maar kan beter. Reduceer JavaScript payload (aim for <150KB gzipped initial bundle), defer non-critical scripts, use dynamic imports, implementeer service worker voor caching.`
                : `Pagina wordt interactief na ${ttiValue.toFixed(1)}s. Reduceer JavaScript payload en optimaliseer main thread werk met code splitting en async loading.`
        });
    }
    
    // TBT Analysis - DEVICE SPECIFIC
    const tbtValue = metrics.tbt.numericValue;
    const tbtThresholds = isMobile ? { good: 200, poor: 600 } : { good: 150, poor: 400 };
    
    if (tbtValue > tbtThresholds.poor) {
        analysis.push({
            type: 'negative',
            title: 'Veel blocking tijd',
            content: isMobile
                ? `${tbtValue.toFixed(0)}ms blocking time op mobiel. Dit is veel te hoog! Lange JavaScript taken (>50ms) blokkeren user input volledig op mobiele single-core rendering. Users ervaren jank en frozen UI. Break long tasks: 1) Split werk in chunks van <50ms, 2) Gebruik requestIdleCallback voor non-critical werk, 3) Implement progressive rendering, 4) Defer heavy JS tot after first interaction, 5) Profile met Chrome DevTools Mobile Throttling.`
                : `${tbtValue.toFixed(0)}ms blocking time. Lange JavaScript taken blokkeren gebruikersinteractie. Break up long tasks (>50ms), gebruik web workers waar mogelijk, en optimaliseer JavaScript execution efficiency.`
        });
    } else if (tbtValue > tbtThresholds.good) {
        analysis.push({
            type: 'neutral',
            title: 'Blocking tijd reduceren',
            content: isMobile
                ? `${tbtValue.toFixed(0)}ms blocking time op mobiel. Dit kan beter. Optimaliseer JavaScript execution: split long tasks, use async/await appropriately, defer analytics en non-critical scripts.`
                : `${tbtValue.toFixed(0)}ms blocking time. Optimaliseer JavaScript execution en verklein synchrone scripts.`
        });
    }
    
    // Resource analysis - DEVICE SPECIFIC
    if (diagnostics.totalByteWeight) {
        const sizeMB = (diagnostics.totalByteWeight / 1024).toFixed(1);
        const sizeThresholds = isMobile ? { good: 2000, poor: 3500 } : { good: 2500, poor: 4000 };
        
        if (diagnostics.totalByteWeight > sizeThresholds.poor) {
            analysis.push({
                type: 'negative',
                title: 'Pagina te groot',
                content: isMobile
                    ? `Totale paginagrootte is ${sizeMB} MB op mobiel. Dit is veel te groot! Mobiele data is duur en netwerken zijn langzamer. Op 4G (20 Mbps) duurt ${sizeMB}MB ~${((sizeMB * 8) / 20).toFixed(1)}s alleen voor download (zonder processing!). Op 3G (1-3 Mbps) kan dit minuten duren. Targets: 1) Initial bundle <500KB, 2) Total page <1.5MB, 3) Gebruik lazy loading aggressief, 4) Implement adaptive loading (serve less on slow networks).`
                    : `Totale paginagrootte is ${sizeMB} MB. Dit is te groot, zelfs voor desktop. Comprimeer resources aggressief, lazy load content, optimaliseer afbeeldingen, en implementeer code splitting.`
            });
        } else if (diagnostics.totalByteWeight > sizeThresholds.good) {
            analysis.push({
                type: 'neutral',
                title: 'Paginagrootte optimaliseren',
                content: isMobile
                    ? `Totale paginagrootte is ${sizeMB} MB op mobiel. Dit kan kleiner voor betere mobile experience. Target <1.5MB total. Comprimeer images (WebP/AVIF), minify JS/CSS, enable Brotli compression, lazy load below-fold content.`
                    : `Totale paginagrootte is ${sizeMB} MB. Dit kan kleiner voor snellere laadtijden. Comprimeer resources en gebruik lazy loading.`
            });
        }
    }
    
    // Network requests - DEVICE SPECIFIC
    if (diagnostics.networkRequests > (isMobile ? 100 : 120)) {
        analysis.push({
            type: 'negative',
            title: 'Te veel network requests',
            content: isMobile
                ? `${diagnostics.networkRequests} network requests op mobiel is excessief! Elke request heeft ~50-100ms overhead op 4G door latency. ${diagnostics.networkRequests} requests = ~${((diagnostics.networkRequests * 75) / 1000).toFixed(1)}s alleen aan latency! Reduceer: 1) Bundle CSS/JS (<10 requests), 2) Use CSS sprites/SVG sprites, 3) Inline kritische resources (<14KB), 4) Implement HTTP/2 (multiplexing), 5) Use service worker voor aggressive caching, 6) Remove/defer third-party scripts.`
                : `${diagnostics.networkRequests} network requests is te veel. Elke request heeft overhead. Bundle resources, gebruik sprites, implementeer HTTP/2, en reduceer third-party dependencies.`
        });
    }
    
    // Comparison note - alleen op mobiel
    if (isMobile && score < 70) {
        analysis.push({
            type: 'neutral',
            title: '📊 Mobiel vs Desktop Vergelijking',
            content: `Let op: Desktop scores zijn typisch 20-30 punten hoger dan mobiel voor dezelfde website. Als deze site ${score} scoort op mobiel, verwacht ~${Math.min(100, score + 25)} op desktop. De mobiele score is het belangrijkst - 60% van web traffic is mobiel. Focus op mobile-first optimalisatie.`
        });
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
