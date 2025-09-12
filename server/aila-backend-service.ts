import fetch from 'node-fetch';

// Azure token interface
interface AzureTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Evaluation interfaces matching aila-backend
interface EvaluationTestCase {
  id: string;
  case_name: string;
  input_text: string;
  context_data?: any;
  expected_behavior?: string;
  category?: string;
  difficulty_level?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  is_active: boolean;
}

interface GradeResponseRequest {
  response_id: string;
  score: number;
  feedback?: string;
  grading_criteria?: any;
}

interface EvaluationResponse {
  message: string;
  result: any;
}

interface AppSuccessResponse {
  message?: string;
}

// Service to interact with aila-backend evaluation endpoints
export class AILABackendService {
  private readonly backendUrl: string;
  private readonly azureAppId: string;
  private readonly azureClientSecret: string;
  private readonly azureTenantId: string = 'common'; // Use 'common' for multi-tenant apps
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.backendUrl = process.env.BACKEND_API_URL || "https://aila-backend.azurewebsites.net";
    this.azureAppId = process.env.AZURE_APP_ID || '';
    this.azureClientSecret = process.env.AZURE_CLIENT_SECRET || '';
    
    if (!this.azureAppId || !this.azureClientSecret) {
      throw new Error('AZURE_APP_ID and AZURE_CLIENT_SECRET environment variables are required');
    }
  }

  // Get Azure access token using client credentials flow
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.azureTenantId}/oauth2/v2.0/token`;
      
      const params = new URLSearchParams();
      params.append('client_id', this.azureAppId);
      params.append('client_secret', this.azureClientSecret);
      params.append('scope', `api://${this.azureAppId}/.default`);
      params.append('grant_type', 'client_credentials');

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Azure token error response:', errorText);
        throw new Error(`Azure token error: ${response.status} ${response.statusText}`);
      }

      const tokenData: AzureTokenResponse = await response.json();
      this.accessToken = tokenData.access_token;
      
      // Set expiry time (subtract 5 minutes for buffer)
      this.tokenExpiry = new Date(Date.now() + (tokenData.expires_in - 300) * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting Azure access token:', error);
      throw error;
    }
  }

  // Make authenticated request to aila-backend
  private async makeAuthenticatedRequest(endpoint: string, options: any = {}) {
    const token = await this.getAccessToken();
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(`${this.backendUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AILA Backend API error (${endpoint}):`, errorText);
      throw new Error(`AILA Backend API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // Get test cases from aila-backend
  async getTestCases(category?: string, limit: number = 50): Promise<EvaluationTestCase[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      params.append('limit', limit.toString());

      const queryString = params.toString();
      const endpoint = `/evaluations/test-cases${queryString ? `?${queryString}` : ''}`;
      
      const response: EvaluationResponse = await this.makeAuthenticatedRequest(endpoint);
      return response.result;
    } catch (error) {
      console.error('Error getting test cases:', error);
      throw error;
    }
  }

  // Get specific test case with responses
  async getTestCaseDetail(testCaseId: string): Promise<any> {
    try {
      const endpoint = `/evaluations/test-cases/${testCaseId}`;
      const response: EvaluationResponse = await this.makeAuthenticatedRequest(endpoint);
      return response.result;
    } catch (error) {
      console.error('Error getting test case detail:', error);
      throw error;
    }
  }

  // Submit human grade for a response
  async submitGrade(gradeRequest: GradeResponseRequest): Promise<boolean> {
    try {
      const endpoint = '/evaluations/grade';
      const response: AppSuccessResponse = await this.makeAuthenticatedRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(gradeRequest),
      });
      
      return true;
    } catch (error) {
      console.error('Error submitting grade:', error);
      throw error;
    }
  }

  // Test connection to aila-backend
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/ping`);
      return response.ok && (await response.text()) === '"pong"';
    } catch (error) {
      console.error('Error testing connection:', error);
      return false;
    }
  }
}