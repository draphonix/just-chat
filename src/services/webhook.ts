import type { ChatMessage } from './storage';
import { JWTService } from './jwt';

export interface WebhookRequest {
  message: string;
  timestamp: string;
  sessionId: string;
  context: {
    url: string;
  };
  history?: ChatMessage[];
}

export interface WebhookResponse {
  response: string;
}

export class WebhookService {
  private readonly url: string;
  private controller: AbortController | null = null;

  constructor(webhookUrl: string, private jwtService?: JWTService) {
    this.url = webhookUrl;
  }

  public async sendMessage(request: WebhookRequest): Promise<WebhookResponse> {
    // Cancel any existing request
    if (this.controller) {
      this.controller.abort();
    }

    this.controller = new AbortController();

    try {
      // Get JWT token if service is configured
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.jwtService) {
        const token = await this.jwtService.getToken();
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(this.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: this.controller.signal
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.controller = null;
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request cancelled');
      }
      throw error;
    }
  }

  public cancelRequest(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }
}