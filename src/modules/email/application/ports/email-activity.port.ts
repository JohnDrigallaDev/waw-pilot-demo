export interface EmailActivityPort {
    record(params: {
        action: string;
        entityType?: string;
        entityId?: string | null;
    }): Promise<void>;
}
