import { generateElectionResponse, ChatMessage } from '../src/services/gemini';
import { GoogleGenerativeAI } from '@google/generative-ai';

jest.mock('@google/generative-ai');

describe('Gemini Service', () => {
  const MockGoogleGenerativeAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw if no API key is provided', async () => {
    await expect(generateElectionResponse('Hello', '')).rejects.toThrow('API Key is required');
  });

  it('should generate a response successfully without history', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: {
        text: () => 'Election info response',
      },
    });

    const mockGetGenerativeModel = jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    });

    MockGoogleGenerativeAI.mockImplementation(() => {
      return {
        getGenerativeModel: mockGetGenerativeModel,
      } as unknown as GoogleGenerativeAI;
    });

    const response = await generateElectionResponse('How do I vote?', 'fake-key');

    expect(MockGoogleGenerativeAI).toHaveBeenCalledWith('fake-key');
    expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-2.5-flash' });
    expect(mockGenerateContent).toHaveBeenCalled();
    expect(response).toBe('Election info response');
  });

  it('should format history correctly in prompt when provided', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      response: { text: () => 'Response with history' },
    });
    const mockGetGenerativeModel = jest
      .fn()
      .mockReturnValue({ generateContent: mockGenerateContent });
    MockGoogleGenerativeAI.mockImplementation(
      () => ({ getGenerativeModel: mockGetGenerativeModel }) as unknown as GoogleGenerativeAI,
    );

    const history: ChatMessage[] = [
      { role: 'user', text: 'Hi' },
      { role: 'assistant', text: 'Hello' },
    ];

    await generateElectionResponse('Next question', 'key', history);

    const calledPrompt = mockGenerateContent.mock.calls[0][0];
    expect(calledPrompt).toContain('User Question: Hi');
    expect(calledPrompt).toContain('Assistant Response: Hello');
    expect(calledPrompt).toContain('User Question: Next question');
  });

  it('should handle API errors gracefully safely wrapping random objects', async () => {
    const mockGenerateContent = jest.fn().mockRejectedValue('String Error');
    const mockGetGenerativeModel = jest
      .fn()
      .mockReturnValue({ generateContent: mockGenerateContent });
    MockGoogleGenerativeAI.mockImplementation(
      () => ({ getGenerativeModel: mockGetGenerativeModel }) as unknown as GoogleGenerativeAI,
    );

    await expect(generateElectionResponse('test', 'key')).rejects.toThrow(
      'Could not connect to the AI service: String Error',
    );
  });

  it('should handle API Error instances safely', async () => {
    const mockGenerateContent = jest.fn().mockRejectedValue(new Error('Network Fail'));
    const mockGetGenerativeModel = jest
      .fn()
      .mockReturnValue({ generateContent: mockGenerateContent });
    MockGoogleGenerativeAI.mockImplementation(
      () => ({ getGenerativeModel: mockGetGenerativeModel }) as unknown as GoogleGenerativeAI,
    );

    await expect(generateElectionResponse('test', 'key')).rejects.toThrow(
      'Could not connect to the AI service: Network Fail',
    );
  });

  it('should parse 429 quota errors gracefully', async () => {
    const mockGenerateContent = jest
      .fn()
      .mockRejectedValue(new Error('Error 429 Quota Exceeded JSON info blob'));
    const mockGetGenerativeModel = jest
      .fn()
      .mockReturnValue({ generateContent: mockGenerateContent });
    MockGoogleGenerativeAI.mockImplementation(
      () => ({ getGenerativeModel: mockGetGenerativeModel }) as unknown as GoogleGenerativeAI,
    );

    await expect(generateElectionResponse('test', 'key')).rejects.toThrow(
      'Could not connect to the AI service: The API usage limit has been reached. Please wait a moment or check your Google AI Studio quota.',
    );
  });

  it('should parse 503 errors gracefully', async () => {
    const mockGenerateContent = jest
      .fn()
      .mockRejectedValue(new Error('Error [503] The model is currently overloaded.'));
    const mockGetGenerativeModel = jest
      .fn()
      .mockReturnValue({ generateContent: mockGenerateContent });
    MockGoogleGenerativeAI.mockImplementation(
      () => ({ getGenerativeModel: mockGetGenerativeModel }) as unknown as GoogleGenerativeAI,
    );

    await expect(generateElectionResponse('test', 'key')).rejects.toThrow(
      'Could not connect to the AI service: The AI model is experiencing high demand. Please try again later.',
    );
  });
});
