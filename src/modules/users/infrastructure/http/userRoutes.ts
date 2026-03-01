import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ValidationError } from '../../../../shared/domain/error'
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter'
import { registerUserDtoRequestSchema, registerUserDtoResponseSchema } from './validators/register';


export async function userRoutes(app: FastifyInstance) {
    app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {

        // 1. Validate
        const { error: inputError, value } = registerUserDtoRequestSchema.validate(request.body, { abortEarly: false });
        if (inputError) {
            // Throw your custom error! The Global Handler catches it.
            throw new ValidationError(inputError.details.map(err => err.message));
        }
        // 2. Pass to Use Case (If the email exists, the UseCase throws UserAlreadyExistsError)
        // const useCase = new RegisterUserUseCase(new PrismaUserRepository());
        // const userEntity = await useCase.execute(value);
        // 3. Send uniform success response
        const rawUserEntity = {
            id: "123e4567-e89b-12d3-a456-426614174000",
            first_name: value.first_name,
            last_name: value.last_name,
            email: value.email,
            password: "hashed_password_do_not_leak", // Danger!
            salt: 10
        };

        const { error: outputError, value: outputValue } = registerUserDtoResponseSchema.validate(rawUserEntity, { abortEarly: false });
        if (outputError) {
            // Throw your custom error! The Global Handler catches it.
            throw new ValidationError(outputError.details.map(err => err.message));
        }


        return ApiResponse.success(reply, outputValue, "User successfully registered", 201);
    });
}