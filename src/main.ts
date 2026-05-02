import { renderTimeline, HI_TIMELINE, EN_TIMELINE } from './ui/timeline';
import { initializeChat } from './ui/chat';
import { initializeFirebase, loadUserPreference, saveUserPreference } from './services/firebase';

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
    navChat: 'Chat',
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
    navChat: 'चैट',
  },
};

type Language = 'en' | 'hi';

function applyTranslations(lang: Language): void {
  const t = translations[lang];
  const headerTitle = document.getElementById('header-title');
  const isChatOpen = !document.getElementById('tab-chat')?.classList.contains('hidden-tab');
  if (headerTitle) headerTitle.textContent = isChatOpen ? t.headerTitleChat : t.headerTitleAsst;

  const heroGreeting = document.querySelector('.hero-greeting');
  if (heroGreeting) heroGreeting.textContent = t.heroGreeting;

  const btnGuideMe = document.getElementById('btn-guide-me');
  if (btnGuideMe && btnGuideMe.childNodes.length > 2)
    btnGuideMe.childNodes[2].textContent = t.guideMe;

  const btnStartChat = document.getElementById('btn-start-chat');
  if (btnStartChat && btnStartChat.childNodes.length > 2)
    btnStartChat.childNodes[2].textContent = t.quickChat;

  const sectionTitle = document.querySelector('.section-title');
  if (sectionTitle) sectionTitle.textContent = t.popularTools;

  updateCard('card-eligibility', t.eligibilityTitle, t.eligibilityDesc);
  updateCard('card-maps', t.pollingBoothTitle, t.pollingBoothDesc);
  updateCard('card-timeline', t.timelineTitle, t.timelineDesc);
  updateCard('card-calendar', t.remindersTitle, t.remindersDesc);

  const navLabels = document.querySelectorAll('.nav-label');
  if (navLabels.length >= 2) {
    navLabels[0].textContent = t.navHome;
    navLabels[1].textContent = t.navChat;
  }

  renderTimeline('timeline-container', lang === 'hi' ? HI_TIMELINE : EN_TIMELINE);
}

function updateCard(id: string, title: string, desc: string): void {
  const el = document.getElementById(id);
  if (el) {
    const h4 = el.querySelector('h4');
    const p = el.querySelector('p');
    if (h4) h4.textContent = title;
    if (p) p.textContent = desc;
  }
}

function initTheme(savedTheme: string): void {
  if (savedTheme === 'dark') document.body.classList.add('dark-mode');
  const toggleBtn = document.getElementById('toggle-theme');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      saveUserPreference('theme', isDark ? 'dark' : 'light');
    });
  }
}

function initLanguageToggle(savedLang: Language, onLangChange: (l: Language) => void): void {
  const langToggle = document.getElementById('lang-toggle') as HTMLSelectElement | null;
  if (langToggle) {
    langToggle.value = savedLang;
    langToggle.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      onLangChange(target.value as Language);
    });
  }
}

function updateContextChip(currentLang: Language, userType: string): void {
  const contextChip = document.getElementById('context-chip');
  if (contextChip) {
    contextChip.textContent = `User: ${userType} | Lang: ${currentLang.toUpperCase()}`;
  }
}

function getEligibilityPlan(
  age: number,
  isCitizen: boolean,
  hasVoterId: boolean,
  lang: Language,
): { planHtml: string; explanation: string; userType: string } {
  const confIndicator = `<p style="font-size: 0.75rem; color: var(--primary); margin-top: 0.5rem; font-weight: bold;">Confidence: High (based on your inputs)</p>`;

  if (age >= 18 && isCitizen) {
    const title = lang === 'hi' ? 'आपका मतदान प्लान' : 'Your Voting Plan';
    const eligibleTxt = lang === 'hi' ? 'आप मतदान के योग्य हैं ✅' : 'You are eligible to vote ✅';

    if (hasVoterId) {
      const readyTxt = lang === 'hi' ? 'आपके पास वोटर आईडी है ✅' : 'You have a Voter ID ✅';
      const nextStep =
        lang === 'hi' ? 'मतदान केंद्र खोजें और वोट दें!' : 'Find your polling booth and vote!';
      const explanation =
        lang === 'hi'
          ? 'चूंकि आपके पास पहले से ही वोटर आईडी है, आपको बस मतदान के दिन अपना पोलिंग बूथ ढूंढकर वोट डालना है।'
          : 'Since you already have a Voter ID, you just need to locate your polling booth and vote on election day.';
      const planHtml = `<div class="plan-card"><h4>${title}</h4><p>${eligibleTxt}</p><p>${readyTxt}</p><ul><li><strong>Next Step:</strong> ${nextStep}</li></ul>${confIndicator}</div>`;
      return { planHtml, explanation, userType: 'Ready Voter' };
    } else {
      const noIdTxt =
        lang === 'hi' ? 'आपके पास वोटर आईडी नहीं है ❗' : 'You do not have a Voter ID ❗';
      const nextStep =
        lang === 'hi'
          ? 'ऑनलाइन रजिस्टर करें (voters.eci.gov.in)'
          : 'Register online at voters.eci.gov.in';
      const docs = lang === 'hi' ? 'आधार कार्ड, निवास प्रमाण पत्र' : 'Aadhaar Card, Address Proof';
      const explanation =
        lang === 'hi'
          ? 'आपको वोट देने के लिए वोटर आईडी की आवश्यकता है। कृपया बताए गए दस्तावेजों के साथ ऑनलाइन आवेदन करें। आईडी मिलने के बाद आप वोट दे सकेंगे।'
          : "You need to register because you don't have a voter ID. After registration, you will receive your ID and can vote.";
      const planHtml = `<div class="plan-card"><h4>${title}</h4><p>${eligibleTxt}</p><p>${noIdTxt}</p><ul><li><strong>Next Step:</strong> ${nextStep}</li><li><strong>Required:</strong> ${docs}</li></ul>${confIndicator}</div>`;
      return { planHtml, explanation, userType: 'First-time Voter' };
    }
  } else {
    const title = lang === 'hi' ? 'आपका मतदान प्लान' : 'Your Voting Plan';
    const notEligibleTxt =
      lang === 'hi'
        ? 'क्षमा करें, आप अभी मतदान के योग्य नहीं हैं ❌'
        : 'Sorry, you are not eligible to vote yet ❌';
    const explanation =
      lang === 'hi'
        ? 'भारत में वोट देने के लिए आपकी उम्र 18 वर्ष या उससे अधिक होनी चाहिए और आपको भारत का नागरिक होना चाहिए।'
        : 'To vote in India, you must be at least 18 years old and a citizen of India.';
    const planHtml = `<div class="plan-card"><h4>${title}</h4><p>${notEligibleTxt}</p><ul><li>Must be 18+ and a Citizen.</li></ul>${confIndicator}</div>`;
    return { planHtml, explanation, userType: 'Ineligible' };
  }
}

function initEligibilityChecker(getLang: () => Language): void {
  const btnCheck = document.getElementById('btn-check-eligibility');
  const ageInput = document.getElementById('eligibility-age') as HTMLInputElement | null;
  const citizenInput = document.getElementById('eligibility-citizen') as HTMLSelectElement | null;
  const voterIdInput = document.getElementById('eligibility-voterid') as HTMLSelectElement | null;
  const eligibilityResult = document.getElementById('eligibility-result');

  if (!btnCheck || !ageInput || !citizenInput || !voterIdInput || !eligibilityResult) return;

  btnCheck.addEventListener('click', () => {
    const age = parseInt(ageInput.value, 10);
    const isCitizen = citizenInput.value === 'yes';
    const hasVoterId = voterIdInput.value === 'yes';
    const currentLang = getLang();

    if (isNaN(age) || age < 1) {
      eligibilityResult.innerHTML =
        currentLang === 'hi'
          ? '<span class="error">कृपया सही उम्र दर्ज करें।</span>'
          : '<span class="error">Please enter a valid age.</span>';
      updateContextChip(currentLang, 'Unknown');
      return;
    }

    const { planHtml, explanation, userType } = getEligibilityPlan(
      age,
      isCitizen,
      hasVoterId,
      currentLang,
    );
    updateContextChip(currentLang, userType);

    const explainBtnTxt =
      currentLang === 'hi' ? 'इसे आसान शब्दों में समझाएं' : 'Explain this in simple terms';
    const fullHtml =
      planHtml +
      `
      <button id="btn-explain-plan" class="chip-btn" style="margin-top: 1rem; border: 1px solid var(--primary); color: var(--primary);">
        ✨ ${explainBtnTxt}
      </button>
      <div id="explain-text" class="hidden plan-card" style="margin-top: 0.5rem; background: var(--bg); border-left: 4px solid var(--primary);">
        <p style="font-size: 0.9rem; color: var(--text);">${explanation}</p>
      </div>
    `;

    eligibilityResult.innerHTML = fullHtml;

    const explainBtn = document.getElementById('btn-explain-plan');
    const explainText = document.getElementById('explain-text');
    if (explainBtn && explainText) {
      explainBtn.addEventListener('click', () => {
        explainText.classList.remove('hidden');
        explainBtn.classList.add('hidden');
      });
    }
  });
}

function switchTab(targetId: string): void {
  const tabHome = document.getElementById('tab-home');
  const tabChat = document.getElementById('tab-chat');
  const chatForm = document.getElementById('chat-form');
  const headerTitle = document.getElementById('header-title');
  const navTabs = document.querySelectorAll('.nav-tab');

  tabHome?.classList.add('hidden-tab');
  tabChat?.classList.add('hidden-tab');
  navTabs.forEach((tab) => tab.classList.remove('active'));

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

function initTabs(): void {
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      if (target) switchTab(target);
    });
  });

  document.getElementById('btn-start-chat')?.addEventListener('click', () => switchTab('tab-chat'));
  document.getElementById('btn-guide-me')?.addEventListener('click', () => switchTab('tab-chat'));
}

function initOverlays(): void {
  const overlayEligibility = document.getElementById('overlay-eligibility');
  const overlayTimeline = document.getElementById('overlay-timeline');
  const overlayMaps = document.getElementById('maps-section');

  document
    .getElementById('card-eligibility')
    ?.addEventListener('click', () => overlayEligibility?.classList.remove('hidden-overlay'));
  document
    .getElementById('card-timeline')
    ?.addEventListener('click', () => overlayTimeline?.classList.remove('hidden-overlay'));
  document
    .getElementById('card-maps')
    ?.addEventListener('click', () => document.getElementById('btn-maps-booth')?.click());
  document
    .getElementById('card-calendar')
    ?.addEventListener('click', () => document.getElementById('btn-calendar')?.click());

  document.querySelectorAll('.close-overlay').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const overlay = (e.target as HTMLElement).closest('.overlay');
      if (overlay) overlay.classList.add('hidden-overlay');
    });
  });

  document.getElementById('btn-close-maps')?.addEventListener('click', () => {
    overlayMaps?.classList.add('hidden-overlay');
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  initializeFirebase();

  let currentLang = (await loadUserPreference('language', 'en')) as Language;
  const savedTheme = await loadUserPreference('theme', 'light');

  initTheme(savedTheme);
  applyTranslations(currentLang);

  initLanguageToggle(currentLang, (newLang) => {
    currentLang = newLang;
    saveUserPreference('language', currentLang);
    applyTranslations(currentLang);
  });

  initEligibilityChecker(() => currentLang);
  initTabs();
  initOverlays();

  initializeChat(
    'chat-form',
    'chat-input',
    'chat-display',
    import.meta.env.VITE_GEMINI_API_KEY,
    () => currentLang,
  );
});
