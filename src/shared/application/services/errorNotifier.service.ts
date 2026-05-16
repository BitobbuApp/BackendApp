export interface ErrorNotificationInput {
    app: string;
    environment: string;
    severity: 'error' | 'critical';
    route: string;
    method: string;
    errorName: string;
    errorMessage: string;
    stackTrace?: string;
    requestId?: string;
    userId?: string;
    companyId?: string;
    timestamp: string;
}

export interface ErrorNotifierService {
    notifyCriticalError(input: ErrorNotificationInput): Promise<void>;
}
