/**
 * UI Actions for Google Services Integration and Utilities
 */

export function openGoogleMapsBooth(): void {
  if (!navigator.geolocation) {
    window.open('https://www.google.com/maps/search/?api=1&query=polling+booth', '_blank', 'noopener,noreferrer');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    () => {
      // Using Maps URLs standard for better compatibility and results
      const url = `https://www.google.com/maps/search/?api=1&query=polling+booth`;
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    () => {
      // Fallback if user denies location or error occurs
      window.open('https://www.google.com/maps/search/?api=1&query=polling+booth', '_blank', 'noopener,noreferrer');
    }
  );
}

export function downloadCalendarReminder(onError: (msg: string) => void): void {
  try {
    // Open Google Calendar web interface to add event directly instead of downloading an .ics file
    const url = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Election+Day+-+Go+Vote!&dates=20261103T023000Z/20261103T123000Z&details=Remember+to+bring+your+Voter+ID+and+check+your+polling+booth.&location=Your+Local+Polling+Booth';
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch {
    onError('Failed to open Google Calendar reminder.');
  }
}

export function initVoiceInput(
  inputEl: HTMLInputElement, 
  onResult: (text: string) => void,
  onError: (msg: string) => void
): void {
  try {
    // Securely check for SpeechRecognition API
    interface SpeechRecognitionShape {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      onresult: ((event: { results: { transcript: string }[][] }) => void) | null;
      onerror: ((event: { error: string }) => void) | null;
      start: () => void;
    }
    type SpeechRecogConstructor = { new(): SpeechRecognitionShape };

    const SpeechRec = (window as unknown as { SpeechRecognition?: SpeechRecogConstructor }).SpeechRecognition || 
                      (window as unknown as { webkitSpeechRecognition?: SpeechRecogConstructor }).webkitSpeechRecognition;
    
    if (!SpeechRec) {
      onError('Sorry, your browser does not support Voice Input.');
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = 'en-IN'; // Optimized for Hinglish/Indian English matching Gemini default
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: { results: { transcript: string }[][] }) => {
      const transcript = event.results[0][0].transcript;
      inputEl.value = transcript;
      onResult(transcript);
    };

    recognition.onerror = (event: { error: string }) => {
      console.error('Speech recognition error', event.error);
      onError('Voice input failed. Please check microphone permissions or try typing.');
    };

    recognition.start();
  } catch {
    onError('Failed to start voice recognition.');
  }
}
