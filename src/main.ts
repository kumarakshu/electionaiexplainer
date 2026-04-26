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

  // Language Toggle
  const langToggle = document.getElementById('lang-toggle') as HTMLSelectElement | null;
  let currentLang = savedLang;
  
  if (langToggle) {
    langToggle.value = savedLang;
    langToggle.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      currentLang = target.value;
      saveUserPreference('language', currentLang);
    });
  }

  // Eligibility Checker
  const btnCheck = document.getElementById('btn-check-eligibility');
  const ageInput = document.getElementById('eligibility-age') as HTMLInputElement | null;
  const citizenInput = document.getElementById('eligibility-citizen') as HTMLSelectElement | null;
  const eligibilityResult = document.getElementById('eligibility-result');

  if (btnCheck && ageInput && citizenInput && eligibilityResult) {
    btnCheck.addEventListener('click', () => {
      const age = parseInt(ageInput.value, 10);
      const isCitizen = citizenInput.value === 'yes';

      if (isNaN(age) || age < 1) {
        eligibilityResult.textContent = currentLang === 'hi' ? 'कृपया सही उम्र दर्ज करें।' : 'Please enter a valid age.';
        eligibilityResult.className = 'eligibility-result error';
        return;
      }

      if (age >= 18 && isCitizen) {
        eligibilityResult.textContent = currentLang === 'hi' 
          ? 'बधाई हो! आप मतदान करने के योग्य हैं। रजिस्ट्रेशन के लिए असिस्टेंट से पूछें।' 
          : 'Congratulations! You are eligible to vote. Ask the assistant how to register.';
        eligibilityResult.className = 'eligibility-result success';
      } else {
        eligibilityResult.textContent = currentLang === 'hi'
          ? 'क्षमा करें, आप अभी मतदान के योग्य नहीं हैं। मतदान के लिए आयु 18+ और नागरिक होना आवश्यक है।'
          : 'Sorry, you are not eligible to vote yet. Must be 18+ and a citizen.';
        eligibilityResult.className = 'eligibility-result error';
      }
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
