import { createElement } from './dom-utils';
import { generateElectionResponse, ChatMessage } from '../services/gemini';
import {
  initVoiceInput,
  openGoogleMapsBooth,
  downloadCalendarReminder,
  speakText,
  stopSpeaking,
} from './actions';

export function initializeChat(
  formId: string,
  inputId: string,
  displayId: string,
  apiKeyParam?: string,
  getLanguage: () => string = () => 'en',
): void {
  const form = document.getElementById(formId) as HTMLFormElement;
  const input = document.getElementById(inputId) as HTMLInputElement;
  const display = document.getElementById(displayId);

  if (!form || !input || !display) return;

  const getApiKey = () => {
    const globalAny = globalThis as unknown as {
      process?: { env?: { VITE_GEMINI_API_KEY?: string } };
    };
    return apiKeyParam || (globalAny.process?.env?.VITE_GEMINI_API_KEY ?? '');
  };

  const chatHistory: ChatMessage[] = [];

  // Voice Output State
  let voiceOutputEnabled = true;

  const handleMessageSubmit = async (userMessage: string, apiKey: string) => {
    appendMessage(display, userMessage, 'user');
    input.value = '';

    const loadingId = appendLoadingItem(display);

    try {
      const lang = getLanguage();
      const responseText = await generateElectionResponse(userMessage, apiKey, chatHistory, lang);

      chatHistory.push({ role: 'user', text: userMessage });
      chatHistory.push({ role: 'assistant', text: responseText });

      removeElement(loadingId);
      appendMessage(display, responseText, 'assistant');

      if (voiceOutputEnabled) {
        speakText(
          responseText,
          lang,
          () => btnToggleVoice?.classList.add('speaking'),
          () => btnToggleVoice?.classList.remove('speaking'),
        );
      }
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
  const btnVoiceInput = document.getElementById('voice-btn') as HTMLButtonElement | null;
  const btnToggleVoice = document.getElementById('btn-toggle-voice');

  if (btnMapsBooth) {
    btnMapsBooth.addEventListener('click', () => {
      const mapsSection = document.getElementById('maps-section');
      if (mapsSection) {
        mapsSection.classList.remove('hidden');
        openGoogleMapsBooth('maps-container', () => {
          mapsSection.scrollIntoView({ behavior: 'smooth' });
        });
      }
    });
  }

  // Maps close button
  const btnCloseMaps = document.getElementById('btn-close-maps');
  if (btnCloseMaps) {
    btnCloseMaps.addEventListener('click', () => {
      const mapsSection = document.getElementById('maps-section');
      if (mapsSection) mapsSection.classList.add('hidden');
    });
  }

  if (btnCalendar) {
    btnCalendar.addEventListener('click', () => downloadCalendarReminder((msg) => alert(msg)));
  }

  if (btnVoiceInput) {
    btnVoiceInput.addEventListener('click', () => {
      stopSpeaking(); // Stop AI voice if user starts talking
      initVoiceInput(
        input,
        () => {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        },
        (msg) => alert(msg),
        () => btnVoiceInput.classList.add('listening'),
        () => btnVoiceInput.classList.remove('listening'),
      );
    });
  }

  if (btnToggleVoice) {
    btnToggleVoice.addEventListener('click', () => {
      voiceOutputEnabled = !voiceOutputEnabled;
      if (voiceOutputEnabled) {
        btnToggleVoice.textContent = '🔊 Voice Output: ON';
        btnToggleVoice.classList.add('voice-active');
      } else {
        btnToggleVoice.textContent = '🔇 Voice Output: OFF';
        btnToggleVoice.classList.remove('voice-active');
        stopSpeaking();
      }
    });
  }

  if (btnGuideMe) {
    btnGuideMe.addEventListener('click', async () => {
      const apiKey = getApiKey();
      if (!apiKey) {
        appendMessage(
          display,
          'Please configure VITE_GEMINI_API_KEY in your .env file to start Guided Mode.',
          'assistant',
        );
        return;
      }
      stopSpeaking();
      const triggerMessage =
        getLanguage() === 'hi'
          ? 'मैं वोट देना चाहता हूँ। एक इंटरैक्टिव डिसीजन असिस्टेंट के रूप में स्टेप-बाय-स्टेप गाइड करें। सबसे पहले पूछें कि क्या मेरी उम्र 18+ है।'
          : 'I want to vote. Guide me step-by-step as an interactive decision assistant. First ask if I am 18+.';
      await handleMessageSubmit(triggerMessage, apiKey);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    stopSpeaking();

    const userMessage = input.value.trim();
    const apiKey = getApiKey();

    if (!userMessage) return;

    if (!apiKey) {
      appendMessage(
        display,
        'Please configure VITE_GEMINI_API_KEY in your .env file to chat with the assistant.',
        'assistant',
      );
      return;
    }

    await handleMessageSubmit(userMessage, apiKey);
  });
}

function appendMessage(display: HTMLElement, text: string, role: 'user' | 'assistant'): void {
  const msgEl = createElement('div', {
    classes: ['message', `${role}-message`],
    textContent: text,
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
    children: [dot1, dot2, dot3],
  });

  display.appendChild(loaderEl);
  display.scrollTop = display.scrollHeight;
  return id;
}

function removeElement(id: string): void {
  const el = document.getElementById(id);
  el?.remove();
}
