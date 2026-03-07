import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { PrismaUserRepository } from '../persistence/PrismaUserRepository';
import { RegisterUserUseCase } from '../../application/registerUserUseCase';
import { LoginUserUseCase } from '../../application/loginUserUseCase';


export async function userRoutes(app: FastifyInstance) {

    // ==========================================
    // POST /users/register
    // ==========================================
    app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new RegisterUserUseCase(new PrismaUserRepository());
        const outputValue = await useCase.execute(request.body);

        return ApiResponse.success(reply, outputValue, "User successfully registered", 201);
    });

    // ==========================================
    // POST /users/login
    // ==========================================
    app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new LoginUserUseCase(new PrismaUserRepository());
        const outputValue = await useCase.execute(request.body);

        return ApiResponse.success(reply, outputValue, "Login successful");
    });
}
