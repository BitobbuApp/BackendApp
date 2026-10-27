import bcrypt from 'bcrypt';

export class PasswordHasher {
    private readonly rounds: number;

    constructor(rounds?: number) {
        this.rounds = rounds ?? (Number(process.env.BCRYPT_COST) || 12);
    }

    async hash(password: string): Promise<string> {
        return bcrypt.hash(password, this.rounds);
    }

    async compare(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}

export const defaultPasswordHasher = new PasswordHasher();
