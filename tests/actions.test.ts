import { openGoogleMapsBooth, downloadCalendarReminder, initVoiceInput, speakText, stopSpeaking } from '../src/ui/actions';

// Mock window globals not supported by JSDOM
(window as unknown as { alert: jest.Mock }).alert = jest.fn();

describe('UI Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('openGoogleMapsBooth', () => {
    it('should embed iframe in container and call onShow', () => {
      document.body.innerHTML = '<div id="maps-container"></div>';
      const onShow = jest.fn();
      
      openGoogleMapsBooth('maps-container', onShow);
      
      const container = document.getElementById('maps-container');
      expect(container?.innerHTML).toContain('<iframe');
      expect(onShow).toHaveBeenCalled();
    });

    it('should handle missing container', () => {
      document.body.innerHTML = '';
      const onShow = jest.fn();
      
      openGoogleMapsBooth('maps-container', onShow);
      expect(onShow).not.toHaveBeenCalled();
    });
  });

  describe('downloadCalendarReminder', () => {
    it('should trigger download', () => {
      const windowOpenMock = jest.spyOn(window, 'open').mockImplementation();
      downloadCalendarReminder(jest.fn());
      expect(windowOpenMock).toHaveBeenCalledWith(expect.stringContaining('calendar.google.com'), '_blank', 'noopener,noreferrer');
    });

    it('should call onError if error occurs', () => {
      jest.spyOn(window, 'open').mockImplementation(() => { throw new Error('Crashed'); });
      const err = jest.fn();
      downloadCalendarReminder(err);
      expect(err).toHaveBeenCalledWith('Failed to open Google Calendar reminder.');
    });
  });

  describe('initVoiceInput', () => {
    it('should call onError if not supported', () => {
      Object.defineProperty(window, 'SpeechRecognition', { value: undefined, configurable: true });
      Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined, configurable: true });
      const err = jest.fn();
      initVoiceInput(document.createElement('input'), jest.fn(), err);
      expect(err).toHaveBeenCalledWith('Sorry, your browser does not support Voice Input.');
    });

    it('should bind and handle results and errors', () => {
      const input = document.createElement('input');
      const onRes = jest.fn();
      const onErr = jest.fn();

      class MockSR {
        static lastInstance: MockSR;
        start() {}
        onresult!: (event: { results: { transcript: string }[][] }) => void;
        onerror!: (event: { error: string }) => void;
        constructor() { MockSR.lastInstance = this; }
      }
      Object.defineProperty(window, 'SpeechRecognition', { value: MockSR, configurable: true });

      initVoiceInput(input, onRes, onErr);

      // trigger result
      MockSR.lastInstance.onresult({ results: [[{ transcript: 'test' }]] });
      expect(input.value).toBe('test');
      expect(onRes).toHaveBeenCalledWith('test');

      // trigger error
      MockSR.lastInstance.onerror({ error: 'not-allowed' });
      expect(onErr).toHaveBeenCalledWith('Voice input failed. Please check microphone permissions.');
    });

    it('should catch init exceptions', () => {
      Object.defineProperty(window, 'SpeechRecognition', { 
        get: () => { throw new Error('API block') }, configurable: true 
      });
      const err = jest.fn();
      initVoiceInput(document.createElement('input'), jest.fn(), err);
      expect(err).toHaveBeenCalledWith('Failed to start voice recognition.');
    });
  });

  describe('Speech Synthesis', () => {
    let mockSpeak: jest.Mock;
    let mockCancel: jest.Mock;

    beforeEach(() => {
      mockSpeak = jest.fn();
      mockCancel = jest.fn();
      Object.defineProperty(window, 'speechSynthesis', {
        value: {
          speak: mockSpeak,
          cancel: mockCancel
        },
        configurable: true
      });
      // Mock SpeechSynthesisUtterance
      (window as any).SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
        text,
        lang: 'en-US',
        rate: 1
      }));
    });

    it('should speak text with English default', () => {
      speakText('hello *world*');
      expect(mockCancel).toHaveBeenCalled();
      expect(mockSpeak).toHaveBeenCalled();
      // Verifying markdown removal
      expect((window as any).SpeechSynthesisUtterance).toHaveBeenCalledWith('hello world');
    });

    it('should speak text with Hindi', () => {
      speakText('नमस्ते', 'hi');
      expect(mockSpeak).toHaveBeenCalled();
    });

    it('should do nothing if speechSynthesis is not available', () => {
      Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
      speakText('hello');
      expect(mockSpeak).not.toHaveBeenCalled();
    });

    it('should stop speaking', () => {
      stopSpeaking();
      expect(mockCancel).toHaveBeenCalled();
    });
    
    it('should do nothing on stop if not available', () => {
      Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
      stopSpeaking();
      expect(mockCancel).not.toHaveBeenCalled();
    });
  });
});
