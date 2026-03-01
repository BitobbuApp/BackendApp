import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ValidationError } from '../../../../shared/domain/error'
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter'
import { registerUserDtoRequestSchema, registerUserDtoResponseSchema } from './validators/register';
import { PrismaUserRepository } from '../persistance/PrismaUserRepository';
import { RegisterUserUseCase } from '../../application/registerUserUseCase';


export async function userRoutes(app: FastifyInstance) {
    app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {

        // 1. Validate
        const { error: inputError, value } = registerUserDtoRequestSchema.validate(request.body, { abortEarly: false });
        if (inputError) {
            // Throw your custom error! The Global Handler catches it.
            throw new ValidationError(inputError.details.map(err => err.message));
        }
        // 2. Pass to Use Case (If the email exists, the UseCase throws UserAlreadyExistsError)
        const useCase = new RegisterUserUseCase(new PrismaUserRepository());
        const userEntity = await useCase.execute(value);

        const { error: outputError, value: outputValue } = registerUserDtoResponseSchema.validate(userEntity, { abortEarly: false });
        if (outputError) {
            // Throw your custom error! The Global Handler catches it.
            throw new ValidationError(outputError.details.map(err => err.message));
        }


        return ApiResponse.success(reply, outputValue, "User successfully registered", 201);
    });
}