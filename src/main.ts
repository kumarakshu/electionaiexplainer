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
});
