import { renderTimeline } from './ui/timeline';
import { initializeChat } from './ui/chat';

// Initialize the App
document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle
  const toggleBtn = document.getElementById('toggle-theme');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
    });
  }

  // Render the interactive timeline
  renderTimeline('timeline-container');

  // Initialize the Chat interface
  initializeChat('chat-form', 'chat-input', 'chat-display', import.meta.env.VITE_GEMINI_API_KEY);
});
