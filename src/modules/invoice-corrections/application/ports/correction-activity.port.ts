export interface CorrectionActivityPort {
    record(params: {
        action: string;
        entityType: string;
        entityId: string;
    }): Promise<void>;
}
