import { renderTimeline } from './ui/timeline';
import { initializeChat } from './ui/chat';
import { initializeFirebase, loadUserPreference, saveUserPreference } from './services/firebase';

// Initialize the App
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Firebase (or local fallback)
  initializeFirebase();

  // Load Preferences
  const savedLang = await loadUserPreference('language', 'en');
  const savedTheme = await loadUserPreference('theme', 'light');

  // Theme Toggle
  if (savedTheme === 'dark') document.body.classList.add('dark-mode');
  
  const toggleBtn = document.getElementById('toggle-theme');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      saveUserPreference('theme', isDark ? 'dark' : 'light');
    });
  }

  // UI Translations
  const translations = {
    en: {
      headerTitleChat: 'AI Chat',
      headerTitleAsst: 'AI Assistant',
      heroGreeting: 'What would you like to know today?',
      guideMe: 'Guide Me',
      quickChat: 'Quick Chat',
      popularTools: 'Popular Tools',
      eligibilityTitle: 'Eligibility',
      eligibilityDesc: 'Check right now',
      pollingBoothTitle: 'Polling Booth',
      pollingBoothDesc: 'Find nearby',
      timelineTitle: 'Timeline',
      timelineDesc: 'Election process',
      remindersTitle: 'Reminders',
      remindersDesc: 'Sync calendar',
      navHome: 'Home',
      navChat: 'Chat'
    },
    hi: {
      headerTitleChat: 'एआई चैट',
      headerTitleAsst: 'एआई असिस्टेंट',
      heroGreeting: 'आज आप क्या जानना चाहेंगे?',
      guideMe: 'मेरा मार्गदर्शन करें',
      quickChat: 'त्वरित चैट',
      popularTools: 'लोकप्रिय टूल्स',
      eligibilityTitle: 'पात्रता',
      eligibilityDesc: 'अभी जांचें',
      pollingBoothTitle: 'मतदान केंद्र',
      pollingBoothDesc: 'आस-पास खोजें',
      timelineTitle: 'समयरेखा',
      timelineDesc: 'चुनाव प्रक्रिया',
      remindersTitle: 'रिमाइंडर',
      remindersDesc: 'कैलेंडर सिंक करें',
      navHome: 'होम',
      navChat: 'चैट'
    }
  };

  function applyTranslations(lang: 'en' | 'hi') {
    const t = translations[lang];
    const headerTitle = document.getElementById('header-title');
    const isChatOpen = !document.getElementById('tab-chat')?.classList.contains('hidden-tab');
    if (headerTitle) headerTitle.textContent = isChatOpen ? t.headerTitleChat : t.headerTitleAsst;

    const heroGreeting = document.querySelector('.hero-greeting');
    if (heroGreeting) heroGreeting.textContent = t.heroGreeting;

    const btnGuideMe = document.getElementById('btn-guide-me');
    if (btnGuideMe) btnGuideMe.childNodes[2].textContent = t.guideMe;

    const btnStartChat = document.getElementById('btn-start-chat');
    if (btnStartChat) btnStartChat.childNodes[2].textContent = t.quickChat;

    const sectionTitle = document.querySelector('.section-title');
    if (sectionTitle) sectionTitle.textContent = t.popularTools;

    const cElig = document.getElementById('card-eligibility');
    if (cElig) { cElig.querySelector('h4')!.textContent = t.eligibilityTitle; cElig.querySelector('p')!.textContent = t.eligibilityDesc; }

    const cMaps = document.getElementById('card-maps');
    if (cMaps) { cMaps.querySelector('h4')!.textContent = t.pollingBoothTitle; cMaps.querySelector('p')!.textContent = t.pollingBoothDesc; }

    const cTime = document.getElementById('card-timeline');
    if (cTime) { cTime.querySelector('h4')!.textContent = t.timelineTitle; cTime.querySelector('p')!.textContent = t.timelineDesc; }

    const cCal = document.getElementById('card-calendar');
    if (cCal) { cCal.querySelector('h4')!.textContent = t.remindersTitle; cCal.querySelector('p')!.textContent = t.remindersDesc; }

    const navLabels = document.querySelectorAll('.nav-label');
    if (navLabels.length >= 2) {
      navLabels[0].textContent = t.navHome;
      navLabels[1].textContent = t.navChat;
    }
  }

  // Language Toggle
  const langToggle = document.getElementById('lang-toggle') as HTMLSelectElement | null;
  let currentLang = savedLang as 'en' | 'hi';
  
  if (langToggle) {
    langToggle.value = savedLang;
    langToggle.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      currentLang = target.value as 'en' | 'hi';
      saveUserPreference('language', currentLang);
      applyTranslations(currentLang);
    });
  }

  applyTranslations(currentLang);

  // Eligibility Checker & Voting Plan Engine
  const btnCheck = document.getElementById('btn-check-eligibility');
  const ageInput = document.getElementById('eligibility-age') as HTMLInputElement | null;
  const citizenInput = document.getElementById('eligibility-citizen') as HTMLSelectElement | null;
  const voterIdInput = document.getElementById('eligibility-voterid') as HTMLSelectElement | null;
  const eligibilityResult = document.getElementById('eligibility-result');
  const contextChip = document.getElementById('context-chip');

  function updateContextChip(userType: string) {
    if (contextChip) {
      contextChip.textContent = `User: ${userType} | Lang: ${currentLang.toUpperCase()}`;
    }
  }

  if (btnCheck && ageInput && citizenInput && voterIdInput && eligibilityResult) {
    btnCheck.addEventListener('click', () => {
      const age = parseInt(ageInput.value, 10);
      const isCitizen = citizenInput.value === 'yes';
      const hasVoterId = voterIdInput.value === 'yes';

      if (isNaN(age) || age < 1) {
        eligibilityResult.innerHTML = currentLang === 'hi' ? '<span class="error">कृपया सही उम्र दर्ज करें।</span>' : '<span class="error">Please enter a valid age.</span>';
        updateContextChip('Unknown');
        return;
      }

      let planHtml = '';
      
      if (age >= 18 && isCitizen) {
        const title = currentLang === 'hi' ? 'आपका मतदान प्लान' : 'Your Voting Plan';
        const eligibleTxt = currentLang === 'hi' ? 'आप मतदान के योग्य हैं ✅' : 'You are eligible to vote ✅';
        
        if (hasVoterId) {
          const readyTxt = currentLang === 'hi' ? 'आपके पास वोटर आईडी है ✅' : 'You have a Voter ID ✅';
          const nextStep = currentLang === 'hi' ? 'मतदान केंद्र खोजें और वोट दें!' : 'Find your polling booth and vote!';
          planHtml = `<div class="plan-card"><h4>${title}</h4><p>${eligibleTxt}</p><p>${readyTxt}</p><ul><li><strong>Next Step:</strong> ${nextStep}</li></ul></div>`;
          updateContextChip('Ready Voter');
        } else {
          const noIdTxt = currentLang === 'hi' ? 'आपके पास वोटर आईडी नहीं है ❗' : 'You do not have a Voter ID ❗';
          const nextStep = currentLang === 'hi' ? 'ऑनलाइन रजिस्टर करें (voters.eci.gov.in)' : 'Register online at voters.eci.gov.in';
          const docs = currentLang === 'hi' ? 'आधार कार्ड, निवास प्रमाण पत्र' : 'Aadhaar Card, Address Proof';
          planHtml = `<div class="plan-card"><h4>${title}</h4><p>${eligibleTxt}</p><p>${noIdTxt}</p><ul><li><strong>Next Step:</strong> ${nextStep}</li><li><strong>Required:</strong> ${docs}</li></ul></div>`;
          updateContextChip('First-time Voter');
        }
      } else {
        const title = currentLang === 'hi' ? 'आपका मतदान प्लान' : 'Your Voting Plan';
        const notEligibleTxt = currentLang === 'hi' ? 'क्षमा करें, आप अभी मतदान के योग्य नहीं हैं ❌' : 'Sorry, you are not eligible to vote yet ❌';
        planHtml = `<div class="plan-card"><h4>${title}</h4><p>${notEligibleTxt}</p><ul><li>Must be 18+ and a Citizen.</li></ul></div>`;
        updateContextChip('Ineligible');
      }
      
      // Safe assignment without scripts
      eligibilityResult.innerHTML = planHtml;
    });
  }

  // Render the interactive timeline
  renderTimeline('timeline-container');

  // Initialize the Chat interface
  initializeChat('chat-form', 'chat-input', 'chat-display', import.meta.env.VITE_GEMINI_API_KEY, () => currentLang);

  // ==========================================
  // Premium Tab & Overlay Logic
  // ==========================================
  
  const tabHome = document.getElementById('tab-home');
  const tabChat = document.getElementById('tab-chat');
  const chatForm = document.getElementById('chat-form');
  const headerTitle = document.getElementById('header-title');
  const navTabs = document.querySelectorAll('.nav-tab');

  function switchTab(targetId: string) {
    // Hide all tabs
    tabHome?.classList.add('hidden-tab');
    tabChat?.classList.add('hidden-tab');
    
    // Deactivate all nav buttons
    navTabs.forEach(tab => tab.classList.remove('active'));
    
    // Activate target
    const targetElement = document.getElementById(targetId);
    if (targetElement) targetElement.classList.remove('hidden-tab');
    
    const targetNav = document.querySelector(`.nav-tab[data-tab="${targetId}"]`);
    if (targetNav) targetNav.classList.add('active');

    if (targetId === 'tab-chat') {
      chatForm?.classList.remove('hidden-form');
      if (headerTitle) headerTitle.textContent = 'AI Chat';
    } else {
      chatForm?.classList.add('hidden-form');
      if (headerTitle) headerTitle.textContent = 'AI Assistant';
    }
  }

  // Bind bottom nav clicks
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      if (target) switchTab(target);
    });
  });

  // Home Hero Buttons
  document.getElementById('btn-start-chat')?.addEventListener('click', () => switchTab('tab-chat'));
  
  // Note: btn-guide-me is already bound in chat.ts, but we just need to switch tab to see it happen
  document.getElementById('btn-guide-me')?.addEventListener('click', () => switchTab('tab-chat'));

  // Tool Cards opening overlays / triggering actions
  const overlayEligibility = document.getElementById('overlay-eligibility');
  const overlayTimeline = document.getElementById('overlay-timeline');
  const overlayMaps = document.getElementById('maps-section');

  document.getElementById('card-eligibility')?.addEventListener('click', () => overlayEligibility?.classList.remove('hidden-overlay'));
  document.getElementById('card-timeline')?.addEventListener('click', () => overlayTimeline?.classList.remove('hidden-overlay'));
  
  document.getElementById('card-maps')?.addEventListener('click', () => {
    // The maps overlay is managed by chat.ts openGoogleMapsBooth callback
    document.getElementById('btn-maps-booth')?.click();
  });
  
  document.getElementById('card-calendar')?.addEventListener('click', () => {
    document.getElementById('btn-calendar')?.click();
  });

  // Close overlay buttons
  document.querySelectorAll('.close-overlay').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const overlay = (e.target as HTMLElement).closest('.overlay');
      if (overlay) overlay.classList.add('hidden-overlay');
    });
  });
  
  // Custom close for maps overlay which uses a specific button ID for tests
  document.getElementById('btn-close-maps')?.addEventListener('click', () => {
    overlayMaps?.classList.add('hidden-overlay');
  });
});
