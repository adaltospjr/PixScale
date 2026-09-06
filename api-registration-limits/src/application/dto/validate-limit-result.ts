export interface ValidateLimitResult {
  allowed: boolean;
  reason?: 'ACCOUNT_NOT_FOUND' | 'EXCEEDS_DAILY_LIMIT' | 'INSUFFICIENT_FUNDS';
}
