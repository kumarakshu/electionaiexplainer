import { openGoogleMapsBooth, downloadCalendarReminder, initVoiceInput } from '../src/ui/actions';

// Mock window globals not supported by JSDOM
(window as unknown as { alert: jest.Mock }).alert = jest.fn();

describe('UI Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('openGoogleMapsBooth', () => {
    it('should fallback when geolocation is unsupported', () => {
      const windowOpenMock = jest.spyOn(window, 'open').mockImplementation();
      const originalGeo = Object.getOwnPropertyDescriptor(navigator, 'geolocation');
      Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true });
      
      openGoogleMapsBooth();
      expect(windowOpenMock).toHaveBeenCalledWith('https://www.google.com/maps/search/?api=1&query=polling+booth', '_blank', 'noopener,noreferrer');
      
      if (originalGeo) Object.defineProperty(navigator, 'geolocation', originalGeo);
    });

    it('should open map on success', () => {
      const windowOpenMock = jest.spyOn(window, 'open').mockImplementation();
      const mockGeo = {
        getCurrentPosition: jest.fn((success) => success({ coords: { latitude: 28, longitude: 77 } }))
      };
      Object.defineProperty(navigator, 'geolocation', { value: mockGeo, configurable: true });
      
      openGoogleMapsBooth();
      expect(windowOpenMock).toHaveBeenCalledWith('https://www.google.com/maps/search/?api=1&query=polling+booth', '_blank', 'noopener,noreferrer');
    });

    it('should fallback on error', () => {
      const windowOpenMock = jest.spyOn(window, 'open').mockImplementation();
      const mockGeo = {
        getCurrentPosition: jest.fn((_success, error) => error(new Error('Denied')))
      };
      Object.defineProperty(navigator, 'geolocation', { value: mockGeo, configurable: true });
      
      openGoogleMapsBooth();
      expect(windowOpenMock).toHaveBeenCalledWith('https://www.google.com/maps/search/?api=1&query=polling+booth', '_blank', 'noopener,noreferrer');
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
      MockSR.lastInstance.onerror({ error: 'fail' });
      expect(onErr).toHaveBeenCalledWith('Voice input failed. Please check microphone permissions or try typing.');
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
});
