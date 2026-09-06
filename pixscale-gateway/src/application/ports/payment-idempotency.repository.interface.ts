export type IdempotencyClaim = 'CLAIMED' | 'DUPLICATE' | 'CONFLICT';

export interface PaymentIdempotencyRepository {
  claim(key: string, requestHash: string): Promise<IdempotencyClaim>;
  release(key: string): Promise<void>;
}
