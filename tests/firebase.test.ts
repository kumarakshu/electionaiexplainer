import {
  initializeFirebase,
  saveUserPreference,
  loadUserPreference,
} from '../src/services/firebase';

describe('Firebase Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize successfully', () => {
    initializeFirebase();
    expect(true).toBe(true);
  });

  it('should save and load a preference', async () => {
    await saveUserPreference('language', 'hi');
    const lang = await loadUserPreference('language', 'en');
    expect(lang).toBe('hi');
  });

  it('should return default value if not set', async () => {
    const lang = await loadUserPreference('theme', 'dark');
    expect(lang).toBe('dark');
  });

  it('should handle load error gracefully', async () => {
    // Simulate JSON parse error
    localStorage.setItem('election_ai_user_prefs', 'invalid-json');
    const theme = await loadUserPreference('theme', 'light');
    expect(theme).toBe('light');
  });

  it('should save to existing preferences', async () => {
    await saveUserPreference('language', 'hi');
    await saveUserPreference('theme', 'dark');
    const theme = await loadUserPreference('theme', 'light');
    expect(theme).toBe('dark');
  });

  it('should return default value if preference is missing in existing data', async () => {
    await saveUserPreference('theme', 'dark');
    const lang = await loadUserPreference('language', 'en');
    expect(lang).toBe('en');
  });

  it('should handle save error gracefully', async () => {
    // Simulate quota exceeded
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });

    await saveUserPreference('theme', 'dark');
    expect(console.error).toHaveBeenCalledWith(
      'Failed to save preference to Firebase:',
      expect.any(Error),
    );
  });
});
