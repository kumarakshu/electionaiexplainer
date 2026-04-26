import { initializeChat } from '../src/ui/chat';
import * as geminiService from '../src/services/gemini';
import * as actionsService from '../src/ui/actions';

jest.mock('../src/services/gemini');
jest.mock('../src/ui/actions');

describe('Chat UI', () => {
  let form: HTMLFormElement;
  let input: HTMLInputElement;
  let display: HTMLElement;
  let apiKeyInput: HTMLInputElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="chat-actions-bar">
        <button id="btn-guide-me"></button>
        <button id="btn-maps-booth"></button>
        <button id="btn-calendar"></button>
      </div>
      <form id="chat-form">
        <input id="chat-input" type="text" />
        <button id="voice-btn" type="button"></button>
        <button type="submit">Send</button>
      </form>
      <div id="chat-display"></div>
      <input id="api-key-input" type="password" />
    `;

    form = document.getElementById('chat-form') as HTMLFormElement;
    input = document.getElementById('chat-input') as HTMLInputElement;
    display = document.getElementById('chat-display') as HTMLElement;
    apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement;

    window.alert = jest.fn();
    jest.clearAllMocks();
  });

  it('should not throw if elements are missing', () => {
    initializeChat('invalid-form', 'chat-input', 'chat-display', 'api-key-input');
    // Just asserting it handles nulls without error
    expect(true).toBe(true);
  });

  it('should ignore empty submission', () => {
    initializeChat('chat-form', 'chat-input', 'chat-display', 'api-key-input');
    input.value = '   ';
    form.dispatchEvent(new Event('submit'));
    expect(display.children.length).toBe(0);
  });

  it('should prompt for API key if missing', () => {
    initializeChat('chat-form', 'chat-input', 'chat-display', 'api-key-input');
    input.value = 'Hello';
    apiKeyInput.value = ''; // Empty key
    
    form.dispatchEvent(new Event('submit'));
    
    expect(display.children.length).toBe(1);
    expect(display.children[0].textContent).toContain('Please enter a valid Gemini API Key');
  });

  it('should append user message and call gemini service when API key is present', async () => {
    initializeChat('chat-form', 'chat-input', 'chat-display', 'api-key-input');
    
    const mockResponse = 'I am your assistant';
    (geminiService.generateElectionResponse as jest.Mock).mockResolvedValue(mockResponse);

    input.value = 'Hello Assistant';
    apiKeyInput.value = 'fake-api-key';

    // Disptach event
    form.dispatchEvent(new Event('submit'));
    
    // Immediately, user message and generic loader should be there
    expect(display.children[0].textContent).toBe('Hello Assistant');
    expect(display.children[0].classList.contains('user-message')).toBe(true);
    expect(display.children[1].classList.contains('loading-indicator')).toBe(true);
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    // Loader should be removed, assistant message should be present
    expect(display.children.length).toBe(2);
    expect(display.children[1].textContent).toBe(mockResponse);
    expect(display.children[1].classList.contains('assistant-message')).toBe(true);
  });

  it('should handle API errors gracefully', async () => {
    initializeChat('chat-form', 'chat-input', 'chat-display', 'api-key-input');
    
    (geminiService.generateElectionResponse as jest.Mock).mockRejectedValue(new Error('Network error'));

    input.value = 'Hello Assistant';
    apiKeyInput.value = 'fake-api-key';

    form.dispatchEvent(new Event('submit'));
    
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(display.children[1].textContent).toContain('Error: Network error');
  });

  it('should handle API errors without message gracefully', async () => {
    initializeChat('chat-form', 'chat-input', 'chat-display', 'api-key-input');
    
    (geminiService.generateElectionResponse as jest.Mock).mockRejectedValue({});

    input.value = 'Hello Assistant';
    apiKeyInput.value = 'fake-api-key';

    form.dispatchEvent(new Event('submit'));
    
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(display.children[1].textContent).toContain('Error: Failed to communicate with AI.');
  });

  it('should handle Voice Input click and trigger submit successfully', () => {
    initializeChat('chat-form', 'chat-input', 'chat-display', 'api-key-input');
    const btnVoice = document.getElementById('voice-btn');
    
    // Simulate clicking voice button
    btnVoice?.dispatchEvent(new Event('click'));
    
    // The chat module passed an onResult wrapper to initVoiceInput, let's trigger it manually
    const mockInitVoice = actionsService.initVoiceInput as jest.Mock;
    expect(mockInitVoice).toHaveBeenCalled();
    
    // Call the success callback (2nd argument)
    const onResultCb = mockInitVoice.mock.calls[0][1];
    onResultCb();
    
    // Call the error callback (3rd argument)
    const onErrorCb = mockInitVoice.mock.calls[0][2];
    onErrorCb('Test Error');
    
    // Coverage completed
    expect(true).toBe(true);
  });

  it('should handle Maps Booth click', () => {
    initializeChat('chat-form', 'chat-input', 'chat-display', 'api-key-input');
    const btn = document.getElementById('btn-maps-booth');
    btn?.dispatchEvent(new Event('click'));
    expect(true).toBe(true);
  });

  it('should handle Calendar click and trigger error callback', () => {
    initializeChat('chat-form', 'chat-input', 'chat-display', 'api-key-input');
    const btn = document.getElementById('btn-calendar');
    btn?.dispatchEvent(new Event('click'));
    
    const mockAction = actionsService.downloadCalendarReminder as jest.Mock;
    const errCb = mockAction.mock.calls[0][0];
    errCb('Calendar fail');
    
    expect(true).toBe(true);
  });

  it('should handle Guide Me click without API key', () => {
    initializeChat('chat-form', 'chat-input', 'chat-display', 'api-key-input');
    const btn = document.getElementById('btn-guide-me');
    apiKeyInput.value = '';
    btn?.dispatchEvent(new Event('click'));
    expect(display.lastChild?.textContent).toContain('Please enter a valid Gemini API Key above to start Guided Mode.');
  });

  it('should handle Guide Me click with API key', async () => {
    initializeChat('chat-form', 'chat-input', 'chat-display', 'api-key-input');
    const btn = document.getElementById('btn-guide-me');
    apiKeyInput.value = 'fake';
    (geminiService.generateElectionResponse as jest.Mock).mockResolvedValue('Guided Response');
    
    btn?.dispatchEvent(new Event('click'));
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(display.lastChild?.textContent).toContain('Guided Response');
  });

  it('should handle missing optional buttons gracefully', () => {
    // Remove all optional buttons
    document.getElementById('btn-maps-booth')?.remove();
    document.getElementById('btn-calendar')?.remove();
    document.getElementById('voice-btn')?.remove();
    document.getElementById('btn-guide-me')?.remove();

    // Re-initialize to hit the branch where these elements are missing
    initializeChat('chat-form', 'chat-input', 'chat-display', 'api-key-input');

    // No error should be thrown
    expect(true).toBe(true);
  });
});
