# JWT Authentication Implementation Plan

## 1. Create JWT Service
Create a new service to handle JWT token management:
```typescript
interface JWTConfig {
  issuer: string;
  tokenEndpoint: string;
  refreshInterval?: number;
  expirationWindow?: number;
}

class JWTService {
  private currentToken: string | null = null;
  private refreshTimer: number | null = null;
  
  async getToken(): Promise<string>
  async refreshToken(): Promise<void>
  private scheduleRefresh(): void
}
```

## 2. Update WebhookService
Modify WebhookService to include JWT authentication:
```typescript
class WebhookService {
  constructor(webhookUrl: string, private jwtService?: JWTService)
  
  async sendMessage(request: WebhookRequest): Promise<WebhookResponse> {
    const token = await this.jwtService?.getToken();
    // Add Authorization header
  }
}
```

## 3. Update Configuration Types
Extend the configuration interface in main.ts:
```typescript
interface ChatConfig {
  webhookUrl: string;
  jwtConfig?: {
    issuer: string;
    tokenEndpoint: string;
    refreshInterval?: number;
    expirationWindow?: number;
  };
  // ... existing config
}
```

## 4. Update Components
- Modify ChatWidget to accept JWT configuration
- Update ChatWindow to handle authentication errors
- Add error states and messages for auth failures

## 5. Error Handling
- Add specific error handling for 401 responses
- Implement user-friendly error messages
- Add retry logic for failed token refreshes

## Implementation Steps:
1. Create new JWT service file
2. Update webhook service with authentication
3. Modify configuration interfaces
4. Update component implementations
5. Add error handling
6. Test token refresh flow
7. Verify error scenarios