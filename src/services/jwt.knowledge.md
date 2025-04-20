# JWT Authentication Knowledge

## Configuration
- Required fields: issuer and tokenEndpoint
- Optional: refreshInterval (default: 300s) and expirationWindow (default: 60s)

## Token Management
- Tokens are stored in memory only, never persisted
- Automatic token refresh based on expiration or refresh interval
- Handles concurrent refresh requests safely

## Error Handling
- Automatically retries with token refresh on 401 errors
- Provides user-friendly error messages
- Cleans up resources on component destruction

## Security Notes
- Never store tokens in localStorage or sessionStorage
- Always use HTTPS for token endpoints
- Validate issuer and token endpoint before initialization