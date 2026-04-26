import { createElement } from './dom-utils';
import { generateElectionResponse, ChatMessage } from '../services/gemini';
import { initVoiceInput, openGoogleMapsBooth, downloadCalendarReminder } from './actions';

export function initializeChat(
  formId: string, 
  inputId: string, 
  displayId: string, 
  apiKeyInputId: string
): void {
  const form = document.getElementById(formId) as HTMLFormElement;
  const input = document.getElementById(inputId) as HTMLInputElement;
  const display = document.getElementById(displayId);
  const apiKeyInput = document.getElementById(apiKeyInputId) as HTMLInputElement;

  if (!form || !input || !display || !apiKeyInput) return;

  const chatHistory: ChatMessage[] = [];

  const handleMessageSubmit = async (userMessage: string, apiKey: string) => {
    appendMessage(display, userMessage, 'user');
    input.value = '';

    const loadingId = appendLoadingItem(display);

    try {
      const responseText = await generateElectionResponse(userMessage, apiKey, chatHistory);
      
      chatHistory.push({ role: 'user', text: userMessage });
      chatHistory.push({ role: 'assistant', text: responseText });

      removeElement(loadingId);
      appendMessage(display, responseText, 'assistant');
    } catch (err: unknown) {
      removeElement(loadingId);
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to communicate with AI.';
      appendMessage(display, `Error: ${errorMessage}`, 'assistant');
    }
  };

  const btnGuideMe = document.getElementById('btn-guide-me');
  const btnMapsBooth = document.getElementById('btn-maps-booth');
  const btnCalendar = document.getElementById('btn-calendar');
  const btnVoice = document.getElementById('voice-btn') as HTMLButtonElement | null;

  if (btnMapsBooth) {
    btnMapsBooth.addEventListener('click', () => openGoogleMapsBooth());
  }

  if (btnCalendar) {
    btnCalendar.addEventListener('click', () => downloadCalendarReminder((msg) => alert(msg)));
  }

  if (btnVoice) {
    btnVoice.addEventListener('click', () => {
      initVoiceInput(input, () => {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }, (msg) => alert(msg));
    });
  }

  if (btnGuideMe) {
    btnGuideMe.addEventListener('click', async () => {
      const apiKey = apiKeyInput.value.trim();
      if (!apiKey) {
        appendMessage(display, 'Please enter a valid Gemini API Key above to start Guided Mode.', 'assistant');
        return;
      }
      const triggerMessage = "I want to vote. Guide me step-by-step as an interactive decision assistant. First ask if I am 18+.";
      await handleMessageSubmit(triggerMessage, apiKey);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userMessage = input.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!userMessage) return;

    if (!apiKey) {
      appendMessage(display, 'Please enter a valid Gemini API Key above to chat with the assistant.', 'assistant');
      return;
    }

    await handleMessageSubmit(userMessage, apiKey);
  });
}

function appendMessage(display: HTMLElement, text: string, role: 'user' | 'assistant'): void {
  const msgEl = createElement('div', {
    classes: ['message', `${role}-message`],
    textContent: text
  });
  display.appendChild(msgEl);
  display.scrollTop = display.scrollHeight;
}

function appendLoadingItem(display: HTMLElement): string {
  const id = `loading-${Date.now()}`;
  const dot1 = createElement('span', { classes: ['dot'], textContent: '.' });
  const dot2 = createElement('span', { classes: ['dot'], textContent: '.' });
  const dot3 = createElement('span', { classes: ['dot'], textContent: '.' });
  
  const loaderEl = createElement('div', {
    id,
    classes: ['message', 'assistant-message', 'loading-indicator'],
    children: [dot1, dot2, dot3]
  });

  display.appendChild(loaderEl);
  display.scrollTop = display.scrollHeight;
  return id;
}

function removeElement(id: string): void {
  const el = document.getElementById(id);
  el?.remove();
}
