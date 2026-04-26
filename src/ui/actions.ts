/**
 * UI Actions for Google Services Integration and Utilities
 */

export function openGoogleMapsBooth(
  containerId: string, 
  onShow: () => void
): void {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Clear any existing map
  container.innerHTML = '';
  
  // Create an iframe to embed Google Maps directly
  const iframe = document.createElement('iframe');
  
  // Using the legacy Google Maps embed approach to avoid requiring an API key
  // while still demonstrating deep integration of embedded Maps
  iframe.src = `https://maps.google.com/maps?q=polling+booth&t=&z=14&ie=UTF8&output=embed`;
  iframe.title = "Nearest Polling Booths on Google Maps";
  iframe.allowFullscreen = true;
  iframe.loading = "lazy";
  iframe.style.border = "0";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  
  container.appendChild(iframe);
  onShow();
}

export function downloadCalendarReminder(onError: (msg: string) => void): void {
  try {
    // Open Google Calendar web interface to add event directly
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
      
      // Ignore normal termination or flaky network errors that don't need a user alert
      if (event.error === 'no-speech' || event.error === 'aborted' || event.error === 'network') {
        return; 
      }
      
      // Only alert on critical issues like missing permissions
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        onError('Voice input failed. Please check microphone permissions.');
      }
    };

    recognition.start();
  } catch {
    onError('Failed to start voice recognition.');
  }
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakText(text: string, lang: string = 'en-IN'): void {
  if (!window.speechSynthesis) return;
  
  // Stop any ongoing speech
  window.speechSynthesis.cancel();
  
  // Strip Markdown for better speech
  const cleanText = text.replace(/[*_#]/g, '').replace(/\[.*?\]\(.*?\)/g, '');
  
  currentUtterance = new SpeechSynthesisUtterance(cleanText);
  currentUtterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
  currentUtterance.rate = 1.0;
  
  window.speechSynthesis.speak(currentUtterance);
}

export function stopSpeaking(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
