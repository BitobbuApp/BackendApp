import { User } from '../domain/userEntity';
import { UserRepository } from '../domain/userRepository';
import { UserAlreadyExistsError } from '../domain/userErrors';
import bcrypt from 'bcrypt';

export class RegisterUserUseCase {
    constructor(private readonly userRepository: UserRepository) { }

    async execute(user: User) {
        const { password, ...userData } = user;
        if (userData.email) {
            const userExist = await this.userRepository.findByEmail(userData.email);
            if (userExist) throw new UserAlreadyExistsError(userData.email);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        return this.userRepository.create({ ...userData, password: hashedPassword });
    }
}