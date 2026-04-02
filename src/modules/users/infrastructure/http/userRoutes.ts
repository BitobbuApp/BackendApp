import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { RegisterUserUseCase } from '../../application/registerUserUseCase';
import { LoginUserUseCase } from '../../application/loginUserUseCase';
import { UpdateUserUseCase } from '../../application/updateUserUseCase';


export async function userRoutes(app: FastifyInstance) {

    // ==========================================
    // POST /users/register
    // ==========================================
    app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new RegisterUserUseCase();
        console.log(request.body);
        const outputValue = await useCase.execute(request.body);

        return ApiResponse.success(reply, outputValue, "User successfully registered", 201);
    });

    // ==========================================
    // POST /users/login
    // ==========================================
    app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new LoginUserUseCase();
        const outputValue = await useCase.execute(request.body);

        return ApiResponse.success(reply, outputValue, "Login successful");
    });

    // ==========================================
    // PATCH /users/profile
    // ==========================================
    app.patch('/profile', { preHandler: [authMiddleware] } as any, async (request: any, reply: FastifyReply) => {
        const useCase = new UpdateUserUseCase();
        const result = await useCase.execute({
            ...request.body,
            id: request.user.userId
        });
        return ApiResponse.success(reply, result, "Profile updated successfully");
    });
}
