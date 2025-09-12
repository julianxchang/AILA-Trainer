import fetch from 'node-fetch';

// Interface matching aila-backend's AI agents
interface AIPromptData {
  prompt: string;
  email_content?: string | null;
  attachments?: any[];
}

interface AIResponse {
  response: string;
  metadata?: any;
}

// FastAPI service that mimics aila-backend's AI agents structure
export class FastAPIService {
  private readonly openaiApiKey: string;
  private readonly openaiEndpoint = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
  }

  // Mimic aila-backend's compose_agent.completion()
  async composeAgentCompletion(chatId: string, userId: string, promptData: AIPromptData): Promise<AIResponse> {
    try {
      const response = await fetch(this.openaiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a Legal Document Assistant specialized in real estate law. You help draft professional legal responses and documents. Focus on document review, contract analysis, and formal legal correspondence. Always include specific next steps and required documentation.'
            },
            {
              role: 'user',
              content: promptData.email_content 
                ? `Email context: ${promptData.email_content}\n\nUser request: ${promptData.prompt}`
                : promptData.prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error response:', errorText);
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return {
        response: data.choices[0]?.message?.content || 'No response generated',
        metadata: { chatId, userId, model: 'compose_agent' }
      };
    } catch (error) {
      console.error('Error calling compose agent:', error);
      throw error;
    }
  }

  // Mimic aila-backend's research_agent.completion()
  async researchAgentCompletion(chatId: string, userId: string, promptData: AIPromptData): Promise<AIResponse> {
    try {
      const response = await fetch(this.openaiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a Real Estate Legal Advisor with expertise in property transactions and client relations. You conduct research and provide practical legal advice. Focus on building client relationships, clear communication, and actionable guidance for real estate matters.'
            },
            {
              role: 'user',
              content: promptData.email_content 
                ? `Email context: ${promptData.email_content}\n\nUser request: ${promptData.prompt}`
                : promptData.prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error response:', errorText);
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return {
        response: data.choices[0]?.message?.content || 'No response generated',
        metadata: { chatId, userId, model: 'research_agent' }
      };
    } catch (error) {
      console.error('Error calling research agent:', error);
      throw error;
    }
  }

  // Get both responses using the same pattern as aila-backend
  async getBothResponses(prompt: string, chatId?: string, userId?: string): Promise<{ modelAResponse: string; modelBResponse: string }> {
    try {
      const promptData: AIPromptData = { prompt };
      const defaultChatId = chatId || 'trainer-chat';
      const defaultUserId = userId || 'trainer-user';

      const [composeResult, researchResult] = await Promise.all([
        this.composeAgentCompletion(defaultChatId, defaultUserId, promptData),
        this.researchAgentCompletion(defaultChatId, defaultUserId, promptData)
      ]);

      return { 
        modelAResponse: composeResult.response, 
        modelBResponse: researchResult.response 
      };
    } catch (error) {
      console.error('Error getting AI responses:', error);
      throw error;
    }
  }
}