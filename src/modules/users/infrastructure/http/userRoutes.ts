import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ValidationError } from '../../../../shared/domain/error';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { registerUserDtoRequestSchema, registerUserDtoResponseSchema } from './validators/register';
import { loginUserDtoRequestSchema, loginUserDtoResponseSchema } from './validators/login';
import { PrismaUserRepository } from '../persistance/PrismaUserRepository';
import { RegisterUserUseCase } from '../../application/registerUserUseCase';
import { LoginUserUseCase } from '../../application/loginUserUseCase';


export async function userRoutes(app: FastifyInstance) {

    // ==========================================
    // POST /users/register
    // ==========================================
    app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {

        // 1. Validate input
        const { error: inputError, value } = registerUserDtoRequestSchema.validate(request.body, { abortEarly: false });
        if (inputError) throw new ValidationError(inputError.details.map(err => err.message));

        // 2. Execute use case
        const useCase = new RegisterUserUseCase(new PrismaUserRepository());
        const userEntity = await useCase.execute(value);

        // 3. Sanitize output (strips password, salt, etc.)
        const { error: outputError, value: outputValue } = registerUserDtoResponseSchema.validate(userEntity, { abortEarly: false });
        if (outputError) throw new ValidationError(outputError.details.map(err => err.message));

        return ApiResponse.success(reply, outputValue, "User successfully registered", 201);
    });

    // ==========================================
    // POST /users/login
    // ==========================================
    app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {

        // 1. Validate input
        const { error: inputError, value } = loginUserDtoRequestSchema.validate(request.body, { abortEarly: false });
        if (inputError) throw new ValidationError(inputError.details.map(err => err.message));

        // 2. Execute use case (throws InvalidCredentialsError or UserNotFoundError on failure)
        const useCase = new LoginUserUseCase(new PrismaUserRepository());
        const result = await useCase.execute(value);

        // 3. Sanitize output — merges user fields and token into a flat object for the schema
        const { error: outputError, value: outputValue } = loginUserDtoResponseSchema.validate({
            ...result.user,
            token: result.token,
        }, { abortEarly: false });
        if (outputError) throw new ValidationError(outputError.details.map(err => err.message));

        return ApiResponse.success(reply, outputValue, "Login successful");
    });
}