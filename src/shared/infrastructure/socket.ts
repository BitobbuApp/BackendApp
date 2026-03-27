import { Server as SocketIOServer, Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';
import logger from './logger';
import { registerMessageHandlers } from '../../modules/messages/infrastructure/socket/messageHandler';
import { JwtService } from '../application/services/jwtService';

let io: SocketIOServer;

export const initializeSocket = (app: any) => {
    const jwtService = new JwtService();

    // 1. Inicializar el servidor de Socket.io acoplado al servidor HTTP de Fastify
    io = new SocketIOServer(app.server, {
        cors: {
            origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
            methods: ['GET', 'POST'],
        },
    });

    // 2. Middleware de Autenticación
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
            // Permitir conexión temporalmente en desarrollo aunque falte el token
            logger.warn(`⚠️ Conexión de socket sin token permitida (Modo Dev). SocketID: ${socket.id}`);
            socket.data.user = { id: 'mock-user-id' };
            return next();
        }
        
        try {
            // Limpiar el token si viene con prefijo 'Bearer '
            const cleanToken = token.replace('Bearer ', '');
            
            // Validar y decodificar el JWT real
            const decoded = jwtService.verifyToken(cleanToken);
            
            // Almacenar el payload del usuario (contiene companyId, userId, etc.) en el socket
            socket.data.user = decoded;
            
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    // 3. Manejador de Conexiones
    io.on('connection', (socket: Socket) => {
        logger.info(`🔌 Cliente conectado: ${socket.id} (User: ${socket.data.user?.id})`);

        // Registrar módulos
        registerMessageHandlers(socket);

        // Evento genérico para unirse a salas (conversaciones)
        socket.on('join_conversation', (conversationId: string) => {
            // TODO: Opcional: Validar si el usuario pertenece a esta conversación en la BD.
            socket.join(conversationId);
            logger.info(`Socket ${socket.id} se unió a la conversación: ${conversationId}`);
        });

        // Evento genérico para salir de salas
        socket.on('leave_conversation', (conversationId: string) => {
            socket.leave(conversationId);
            logger.info(`Socket ${socket.id} abandonó la conversación: ${conversationId}`);
        });

        socket.on('disconnect', () => {
            logger.info(`🔌 Cliente desconectado: ${socket.id}`);
        });
    });

    logger.info('🚀 Servidor Socket.io inicializado correctamente');
    return io;
};

// Exportar un getter para usar 'io' desde otros módulos (ej. casos de uso)
export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io no ha sido inicializado');
    }
    return io;
};
