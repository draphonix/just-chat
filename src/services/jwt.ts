export interface JWTConfig {
  issuer: string;
  tokenEndpoint: string;
  refreshInterval?: number;
  expirationWindow?: number;
}

export class JWTService {
  private currentToken: string | null = null;
  private refreshTimer: number | null = null;
  private isRefreshing: boolean = false;
  private tokenExpiration: number | null = null;

  constructor(private config: JWTConfig) {
    this.config.refreshInterval = this.config.refreshInterval || 300; // 5 minutes default
    this.config.expirationWindow = this.config.expirationWindow || 60; // 1 minute default
  }

  public async getToken(): Promise<string> {
    if (!this.currentToken || this.isTokenExpired()) {
      return this.refreshToken();
    }
    return this.currentToken;
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiration) return true;
    
    // Check if token is expired or will expire soon
    const now = Date.now() / 1000; // Convert to seconds
    return now >= (this.tokenExpiration - (this.config.expirationWindow || 60));
  }

  public async refreshToken(): Promise<string> {
    if (this.isRefreshing) {
      console.log('Token refresh already in progress, waiting...');
      // Wait for the existing refresh to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getToken();
    }

    this.isRefreshing = true;
    console.log('Refreshing JWT token...');

    try {
      const response = await fetch(this.config.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issuer: this.config.issuer
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.token) {
        throw new Error('Token not found in response');
      }

      this.currentToken = data.token;
      
      // Parse expiration from token if available
      try {
        if (this.currentToken) {
          const tokenParts = this.currentToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.exp) {
              this.tokenExpiration = payload.exp;
              console.log('Token refreshed successfully. Expires at:', new Date(this.tokenExpiration * 1000).toISOString());
            }
          }
        }
      } catch (e) {
        console.warn('Failed to parse token expiration:', e);
        // If we can't parse the expiration, use the refresh interval
        this.tokenExpiration = (Date.now() / 1000) + (this.config.refreshInterval || 300);
      }
      
      // Schedule next refresh
      this.scheduleRefresh();
      
      if (!this.currentToken) {
        throw new Error('Token was not set after refresh');
      }
      
      return this.currentToken;
    } catch (error) {
      this.currentToken = null;
      this.tokenExpiration = null;
      console.error('Failed to refresh token:', error);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private scheduleRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Schedule refresh based on token expiration or configured interval
    const refreshIn = this.tokenExpiration 
      ? (this.tokenExpiration - (this.config.expirationWindow || 60) - Date.now() / 1000) * 1000
      : (this.config.refreshInterval! - this.config.expirationWindow!) * 1000;

    console.log('Scheduling next token refresh in', Math.round(refreshIn / 1000), 'seconds');
    
    this.refreshTimer = window.setTimeout(
      () => this.refreshToken(),
      Math.max(0, refreshIn) // Ensure we don't set a negative timeout
    );
  }

  public destroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    this.currentToken = null;
    this.tokenExpiration = null;
    this.isRefreshing = false;
  }
}