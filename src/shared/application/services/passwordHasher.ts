import { settings } from '../../../modules/settings/application/settingsService';
import bcrypt from 'bcrypt';

export class PasswordHasher {
    private readonly fixedRounds?: number;

    // Resolved per call: the module-level singleton is created before settings are loaded.
    private get rounds(): number {
        return this.fixedRounds ?? (settings.get<number>("app.bcrypt_cost") ?? 12);
    }

    constructor(rounds?: number) {
        if (rounds !== undefined) this.fixedRounds = rounds;
    }

    async hash(password: string): Promise<string> {
        return bcrypt.hash(password, this.rounds);
    }

    async compare(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}

export const defaultPasswordHasher = new PasswordHasher();
