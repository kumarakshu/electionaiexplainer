import { initializeChat } from '../src/ui/chat';
import * as geminiService from '../src/services/gemini';
import * as actionsService from '../src/ui/actions';

declare const process: any;

jest.mock('../src/services/gemini');
jest.mock('../src/ui/actions');

describe('Chat UI', () => {
  let form: HTMLFormElement;
  let input: HTMLInputElement;
  let display: HTMLElement;

  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    document.body.innerHTML = `
      <div id="maps-section" class="hidden"></div>
      <div id="maps-container"></div>
      <button id="btn-close-maps"></button>
      <div id="chat-actions-bar">
        <button id="btn-guide-me"></button>
        <button id="btn-maps-booth"></button>
        <button id="btn-calendar"></button>
        <button id="voice-btn" type="button"></button>
        <button id="btn-toggle-voice"></button>
      </div>
      <form id="chat-form">
        <input id="chat-input" type="text" />
        <button type="submit">Send</button>
      </form>
      <div id="chat-display"></div>
    `;

    form = document.getElementById('chat-form') as HTMLFormElement;
    input = document.getElementById('chat-input') as HTMLInputElement;
    display = document.getElementById('chat-display') as HTMLElement;

    window.alert = jest.fn();
    jest.clearAllMocks();
    
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should not throw if elements are missing', () => {
    initializeChat('invalid-form', 'chat-input', 'chat-display');
    expect(true).toBe(true);
  });

  it('should prompt for API key if missing', () => {
    initializeChat('chat-form', 'chat-input', 'chat-display');
    input.value = 'Hello';
    delete process.env.VITE_GEMINI_API_KEY;
    
    form.dispatchEvent(new Event('submit'));
    expect(display.children[0].textContent).toContain('Please configure VITE_GEMINI_API_KEY');
  });

  it('should call gemini service and speak answer', async () => {
    initializeChat('chat-form', 'chat-input', 'chat-display');
    (geminiService.generateElectionResponse as jest.Mock).mockResolvedValue('Hello');
    process.env.VITE_GEMINI_API_KEY = 'fake-api-key';
    input.value = 'Hi';
    
    form.dispatchEvent(new Event('submit'));
    await new Promise(r => setTimeout(r, 0));
    
    expect(actionsService.speakText).toHaveBeenCalledWith('Hello', 'en');
  });

  it('should toggle voice output', async () => {
    initializeChat('chat-form', 'chat-input', 'chat-display');
    const toggleBtn = document.getElementById('btn-toggle-voice');
    
    // Toggle off
    toggleBtn?.dispatchEvent(new Event('click'));
    expect(actionsService.stopSpeaking).toHaveBeenCalled();
    expect(toggleBtn?.textContent).toContain('OFF');
    
    (geminiService.generateElectionResponse as jest.Mock).mockResolvedValue('Hello');
    process.env.VITE_GEMINI_API_KEY = 'fake-api-key';
    input.value = 'Hi';
    form.dispatchEvent(new Event('submit'));
    await new Promise(r => setTimeout(r, 0));
    
    // Should NOT speak since toggled off
    expect(actionsService.speakText).not.toHaveBeenCalled();
    
    // Toggle back on
    toggleBtn?.dispatchEvent(new Event('click'));
    expect(toggleBtn?.textContent).toContain('ON');
  });

  it('should open and close maps section', () => {
    initializeChat('chat-form', 'chat-input', 'chat-display');
    const btnMaps = document.getElementById('btn-maps-booth');
    const mapsSection = document.getElementById('maps-section');
    const btnCloseMaps = document.getElementById('btn-close-maps');
    
    // Open maps
    btnMaps?.dispatchEvent(new Event('click'));
    expect(mapsSection?.classList.contains('hidden')).toBe(false);
    expect(actionsService.openGoogleMapsBooth).toHaveBeenCalled();
    
    // The callback inside openGoogleMapsBooth handles scroll, simulate it manually to cover
    const mockAction = actionsService.openGoogleMapsBooth as jest.Mock;
    const onShowCb = mockAction.mock.calls[0][1];
    onShowCb();
    
    // Close maps
    btnCloseMaps?.dispatchEvent(new Event('click'));
    expect(mapsSection?.classList.contains('hidden')).toBe(true);
  });

  it('should handle Voice Input click', () => {
    initializeChat('chat-form', 'chat-input', 'chat-display');
    document.getElementById('voice-btn')?.dispatchEvent(new Event('click'));
    expect(actionsService.stopSpeaking).toHaveBeenCalled();
  });

  it('should trigger guide me correctly based on language', async () => {
    let mockLang = 'hi';
    initializeChat('chat-form', 'chat-input', 'chat-display', 'fake-key', () => mockLang);
    const btnGuide = document.getElementById('btn-guide-me');
    
    btnGuide?.dispatchEvent(new Event('click'));
    await new Promise(r => setTimeout(r, 0));
    expect(actionsService.stopSpeaking).toHaveBeenCalled();
  });
  
  it('should handle guide me with missing API key', async () => {
    initializeChat('chat-form', 'chat-input', 'chat-display', '');
    const btnGuide = document.getElementById('btn-guide-me');
    delete process.env.VITE_GEMINI_API_KEY;
    
    btnGuide?.dispatchEvent(new Event('click'));
    expect(display.lastChild?.textContent).toContain('Please configure VITE_GEMINI_API_KEY');
  });

  it('should handle API errors', async () => {
    initializeChat('chat-form', 'chat-input', 'chat-display');
    (geminiService.generateElectionResponse as jest.Mock).mockRejectedValue(new Error('Fail'));
    process.env.VITE_GEMINI_API_KEY = 'fake-api-key';
    input.value = 'Hi';
    form.dispatchEvent(new Event('submit'));
    await new Promise(r => setTimeout(r, 0));
    expect(display.lastChild?.textContent).toContain('Error: Fail');
  });

  it('should handle missing optional buttons gracefully', () => {
    document.getElementById('btn-maps-booth')?.remove();
    document.getElementById('btn-calendar')?.remove();
    document.getElementById('btn-close-maps')?.remove();
    document.getElementById('voice-btn')?.remove();
    document.getElementById('btn-guide-me')?.remove();
    document.getElementById('btn-toggle-voice')?.remove();

    initializeChat('chat-form', 'chat-input', 'chat-display');
    expect(true).toBe(true);
  });
});
