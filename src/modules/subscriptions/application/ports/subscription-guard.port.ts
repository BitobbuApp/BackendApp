export type ProtectedOperation = 'rfq' | 'quote' | 'offer';

export interface ISubscriptionGuard {
  authorize(companyId: string, operation: ProtectedOperation): Promise<void>;
}
