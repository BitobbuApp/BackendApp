import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { RegisterUserUseCase } from '../../application/registerUserUseCase';
import { LoginUserUseCase } from '../../application/loginUserUseCase';
import { UpdateUserUseCase } from '../../application/updateUserUseCase';
import { ResetPasswordUseCase } from '../../application/resetPasswordUseCase';
import { ChangePasswordUseCase } from '../../application/changePasswordUseCase';


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
    // POST /users/reset-password
    // ==========================================
    /*  
    app.post('/reset-password', async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new ResetPasswordUseCase();
        await useCase.execute(request.body);
        return ApiResponse.success(reply, null, "Contraseña actualizada exitosamente");
    });
*/
    

    // ==========================================
    // POST /users/change-password
    // ==========================================
    app.post('/change-password', { preHandler: [authMiddleware] } as any, async (request: any, reply: FastifyReply) => {
        const useCase = new ChangePasswordUseCase();
        await useCase.execute({
            ...request.body,
            userId: request.user.userId
        });
        return ApiResponse.success(reply, null, "Contraseña cambiada exitosamente");
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
