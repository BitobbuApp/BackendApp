# Plantilla Genérica de Inicialización — Backend Clean Architecture & DDD

Este documento sirve como guía paso a paso y repositorio de código base para inicializar un nuevo proyecto backend desde cero, siguiendo estrictamente la arquitectura limpia (Clean Architecture) inspirada en Domain-Driven Design (DDD) utilizada en este proyecto.

---

## 📂 Estructura General del Proyecto

El proyecto se organiza con una separación estricta de responsabilidades (Capas: **Dominio → Aplicación → Infraestructura**):

```
src/
├── index.ts                    # Punto de entrada
├── server.ts                   # Configuración del servidor (Fastify)
├── routes.ts                   # Registro global de rutas
├── shared/                     # Código compartido transversalmente
│   ├── application/            # Clase abstracta base UseCase
│   ├── domain/                 # Errores globales y base (ApplicationError, ValidationError)
│   └── infrastructure/         # Base de datos, logger, formateador de HTTP y middlewares
└── modules/                    # Módulos de funcionalidad (DDD-inspired)
    └── {nombreModulo}/
        ├── domain/             # Reglas puras del negocio
        │   ├── entities/       # Clases de Entidad (objetos de dominio)
        │   ├── repositories/   # Interfaces del repositorio (contratos)
        │   └── errors/         # Errores específicos del módulo
        ├── application/        # Casos de uso + esquemas de validación/DTOs
        │   └── dtos/           # Schemas de Joi (Request/Response)
        └── infrastructure/     # Implementaciones concretas de la tecnología
            ├── persistence/    # Repositorio concreto de Prisma
            └── http/           # Controladores/Manejadores de rutas HTTP (Fastify)
```

---

## 🚦 Reglas de Oro y Flujo de Dependencias

1. **Flujo Hacia Adentro:** Las dependencias deben fluir únicamente hacia adentro: **Infraestructura → Aplicación → Dominio**. El dominio no conoce la existencia de la base de datos ni de HTTP.
2. **Prohibido importar repositorios cruzados:** Un módulo no debe importar directamente el repositorio de otro módulo. En su lugar, debe importar y ejecutar el **Caso de Uso** (UseCase) correspondiente.
3. **Autonomía de Casos de Uso:** Cada caso de uso debe validar su entrada (`inputSchema`) y sanitizar su salida (`outputSchema`), además de instanciar sus propias dependencias en el constructor.
4. **Sanitización Explícita:** Los esquemas de salida Joi siempre deben incluir `.options({ stripUnknown: true })` para evitar fugas de información interna (como contraseñas o hashes).
5. **Base de Datos en snake_case y TypeScript en camelCase:** Mapea siempre los registros de la base de datos a las entidades del dominio usando una función `mapToEntity()` en los repositorios concretos.

---

## 🛠️ Paso 1: Configuración de Dependencias (`package.json`)

Crea un archivo `package.json` en la raíz del nuevo proyecto e instala las dependencias clave.

```json
{
  "name": "generic-backend-app",
  "version": "1.0.0",
  "description": "Backend boilerplate using Clean Architecture, DDD, Fastify and Prisma",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "npx prisma generate",
    "prisma:migrate": "npx prisma migrate dev"
  },
  "dependencies": {
    "@fastify/cors": "^10.0.0",
    "@fastify/multipart": "^9.0.0",
    "@prisma/adapter-pg": "^7.0.0",
    "@prisma/client": "^7.0.0",
    "bcrypt": "^5.1.1",
    "dotenv": "^16.4.5",
    "fastify": "^5.0.0",
    "joi": "^17.13.3",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.12.0",
    "pino": "^9.2.0",
    "pino-pretty": "^11.2.1"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.14.9",
    "@types/pg": "^8.11.6",
    "prisma": "^7.0.0",
    "tsx": "^4.15.7",
    "typescript": "^5.5.2"
  }
}
```

Para instalarlo en la terminal ejecuta:
```bash
npm install
```

---

## ⚙️ Paso 2: Configuración de TypeScript (`tsconfig.json`)

Crea el archivo `tsconfig.json` en la raíz:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
```

---

## 💾 Paso 3: Configuración de Base de Datos y Prisma

Crea el archivo `prisma/schema.prisma` con una configuración base estructurada:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["relationLoadStrategy"]
}

model User {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email      String   @unique @db.VarChar(255)
  password   String   @db.VarChar(255)
  is_active  Boolean  @default(true)
  created_at DateTime @default(now()) @db.Timestamptz
  updated_at DateTime @default(now()) @db.Timestamptz

  @@map("users")
}
```

Agrega el archivo `.env` inicial:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/my_database?schema=public"
JWT_SECRET="mi_clave_secreta_super_segura"
CORS_ORIGIN="http://localhost:5173"
LOG_LEVEL="info"
```

---

## 🏢 Paso 4: Capa Compartida (`src/shared`)

### 1. Categoría y Códigos de Error (`src/shared/domain/error-codes.ts`)
```typescript
export type ErrorCategory =
    | "VALIDATION"
    | "AUTHENTICATION"
    | "AUTHORIZATION"
    | "NOT_FOUND"
    | "CONFLICT"
    | "BUSINESS"
    | "INFRASTRUCTURE"
    | "INTERNAL";

export type ErrorCode =
    | "VALIDATION_ERROR"
    | "INTERNAL_SERVER_ERROR"
    | "NOT_FOUND_ERROR"
    | "AUTH_MISSING_TOKEN"
    | "AUTH_INVALID_TOKEN"
    | string;
```

### 2. Base de Errores (`src/shared/domain/error.ts`)
```typescript
import { ErrorCode, ErrorCategory } from './error-codes.js';

export class ApplicationError extends Error {
    public code: ErrorCode;
    public category: ErrorCategory;
    public details: any;
    public isOperational: boolean;

    constructor(
        public statusCode: number,
        message: string,
        code: ErrorCode = "INTERNAL_SERVER_ERROR",
        category: ErrorCategory = "INTERNAL",
        details: any = null,
        isOperational: boolean = true
    ) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.category = category;
        this.details = details;
        this.isOperational = isOperational;
    }
}

export class ValidationError extends ApplicationError {
    constructor(public messages: string[]) {
        super(400, "Validation Failed", "VALIDATION_ERROR", "VALIDATION", messages);
    }
}
```

### 3. Base para los Casos de Uso (`src/shared/application/useCase.ts`)
```typescript
import Joi from 'joi';
import { ValidationError } from '../domain/error.js';
import logger from '../infrastructure/logger.js';

export abstract class UseCase<TInput, TOutput> {
    protected abstract inputSchema: Joi.Schema;
    protected abstract outputSchema: Joi.Schema;

    // Lógica pura de negocio implementada por la subclase
    protected abstract implementation(data: TInput): Promise<TOutput>;

    // Punto de entrada principal con validación integrada
    public async execute(data: any): Promise<TOutput> {
        // 1. Validar la Entrada
        const { error: inErr, value: validatedIn } = this.inputSchema.validate(data, { abortEarly: false });
        if (inErr) {
            throw new ValidationError(inErr.details.map((detail) => detail.message));
        }

        // 2. Ejecutar Lógica
        const result = await this.implementation(validatedIn);

        // 3. Validar/Sanitizar la Salida
        const { error: outErr, value: validatedOut } = this.outputSchema.validate(result, { abortEarly: false });
        if (outErr) {
            logger.error({ details: outErr.details }, 'Output validation error during data sanitization');
            throw new ValidationError(['Internal server error during data sanitization']);
        }

        return validatedOut;
    }
}
```

### 4. Logger (`src/shared/infrastructure/logger.ts`)
```typescript
import pino from 'pino';

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        }
    }
});

export default logger;
```

### 5. Singleton de Base de Datos y Pool (`src/shared/infrastructure/database.ts`)
```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import logger from './logger.js';

const connectionString = process.env.DATABASE_URL || '';

// Pool de PostgreSQL con control de conexiones simultáneas
const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
    adapter,
    log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
    ],
});

prisma.$on('error', (e) => {
    logger.error(e, '❌ Prisma Database Error');
});

prisma.$on('warn', (e) => {
    logger.warn(e, '⚠️ Prisma Database Warning');
});

export async function connectDatabase() {
    try {
        await prisma.$connect();
        logger.info('📦 Successfully connected to PostgreSQL Database');
    } catch (error) {
        logger.error(error, '❌ Failed to connect to the database');
        process.exit(1);
    }
}

export async function disconnectDatabase() {
    await prisma.$disconnect();
}
```

### 6. Formateador de Respuestas HTTP (`src/shared/infrastructure/http/responseFormatter.ts`)
```typescript
import { FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { ErrorCode, ErrorCategory } from '../../domain/error-codes.js';

export class ApiResponse {
    static success(reply: FastifyReply, data: any, message: string = "Success", statusCode: number = 200) {
        return reply.status(statusCode).send({
            success: true,
            message,
            data
        });
    }

    static error(
        reply: FastifyReply,
        message: string = "Error",
        statusCode: number = 400,
        errors?: any,
        code: ErrorCode = "INTERNAL_SERVER_ERROR",
        category: ErrorCategory = "INTERNAL",
        traceId?: string
    ) {
        const reqTraceId = (reply.request?.headers?.['x-trace-id'] as string) || randomUUID();
        const finalTraceId = traceId || reqTraceId;

        return reply.status(statusCode).send({
            success: false,
            error: {
                code,
                message,
                category,
                status: statusCode,
                details: errors || {},
                traceId: finalTraceId
            },
            message
        });
    }
}
```

### 7. Manejador Global de Errores (`src/shared/infrastructure/http/errorHandler.ts`)
```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApplicationError, ValidationError } from '../../domain/error.js';
import { randomUUID } from 'crypto';

export function errorHandler(app: FastifyInstance) {
    app.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
        const traceId = (request.headers['x-trace-id'] as string) || randomUUID();

        // Control de Errores de Aplicación Conocidos
        if (error instanceof ApplicationError) {
            const details = error instanceof ValidationError ? error.messages : error.details;

            app.log.error({ err: error, traceId, code: error.code, category: error.category }, error.message);

            reply.status(error.statusCode).send({
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                    category: error.category,
                    status: error.statusCode,
                    details: details || {},
                    traceId
                },
                message: error.message
            });
            return;
        }

        // Errores Genéricos con código status explícito (e.g. JWT expirados)
        const customStatusCode = (error as any).statusCode;
        if (customStatusCode && typeof customStatusCode === 'number' && customStatusCode >= 400 && customStatusCode < 500) {
            app.log.error({ err: error, traceId, code: "BUSINESS_ERROR", category: "BUSINESS" }, error.message);
            reply.status(customStatusCode).send({
                success: false,
                error: {
                    code: "BUSINESS_ERROR",
                    message: error.message,
                    category: "BUSINESS",
                    status: customStatusCode,
                    details: {},
                    traceId
                },
                message: error.message
            });
            return;
        }

        // Errores Internos Inesperados (500)
        app.log.error({ err: error, traceId, code: "INTERNAL_SERVER_ERROR", category: "INTERNAL" }, 'Unhandled exception');

        reply.status(500).send({
            success: false,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "An unexpected error occurred",
                category: "INTERNAL",
                status: 500,
                details: {},
                traceId
            },
            message: "An unexpected error occurred"
        });
    });
}
```

### 8. Middleware de Autenticación Genérico (`src/shared/infrastructure/http/middlewares/authMiddleware.ts`)
```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../responseFormatter.js';
import logger from '../../logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            userId: string;
            email: string;
            [key: string]: any;
        }
    }
}

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return ApiResponse.error(reply, "Authentication token missing or invalid", 401, undefined, "AUTH_MISSING_TOKEN", "AUTHENTICATION");
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return ApiResponse.error(reply, "Authentication token missing", 401, undefined, "AUTH_MISSING_TOKEN", "AUTHENTICATION");
        }

        // Decodificación y verificación del Token
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (!decoded || !decoded.userId || !decoded.email) {
            return ApiResponse.error(reply, "Invalid or expired token", 401, undefined, "AUTH_INVALID_TOKEN", "AUTHENTICATION");
        }

        request.user = {
            userId: decoded.userId,
            email: decoded.email,
        };

    } catch (error: any) {
        logger.error(error, 'Authentication middleware error');
        return ApiResponse.error(reply, "Invalid or expired token", 401, undefined, "AUTH_INVALID_TOKEN", "AUTHENTICATION");
    }
};
```

---

## 🚀 Paso 5: Inicialización del Servidor

### 1. Registro de Rutas Global (`src/routes.ts`)
```typescript
import { FastifyInstance } from 'fastify';

export async function routes(app: FastifyInstance) {
    // Registra aquí las rutas de tus módulos
    // app.register(userRoutes, { prefix: '/users' });
}
```

### 2. Configuración de Fastify (`src/server.ts`)
```typescript
import fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { routes } from './routes.js';
import { connectDatabase } from './shared/infrastructure/database.js';
import logger from './shared/infrastructure/logger.js';
import { errorHandler } from './shared/infrastructure/http/errorHandler.js';

const app = fastify({
    loggerInstance: logger,
});

const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(url => url.trim())
    : ['http://localhost:5173'];

app.register(cors, {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

app.register(multipart, {
    limits: {
        fileSize: 5 * 1024 * 1024 // Límite de 5MB
    }
});

// Registrar Manejador de Errores Global
errorHandler(app);

// Prefijo global de API
app.register(routes, { prefix: '/api/v1' });

app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});

export const start = async () => {
    try {
        await connectDatabase();

        await app.listen({
            port: Number(process.env.PORT) || 3000,
            host: '0.0.0.0'
        });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
```

### 3. Entry Point (`src/index.ts`)
```typescript
import 'dotenv/config'; // Debe ser lo primero que se ejecute para cargar variables de entorno
import { start } from './server.js';

start();
```

---

## 🛠️ Paso 6: Plantilla para Crear un Módulo (`{nombreModulo}`)

Cuando crees un nuevo módulo, utiliza estas plantillas reemplazando `Item` por el nombre de tu Entidad.

### 1. Entidad de Dominio (`domain/entities/item.entity.ts`)
```typescript
export class Item {
    constructor(
        public id: string,
        public name: string,
        public description: string | null = null,
        public created_at: Date | null = null,
        public updated_at: Date | null = null
    ) {}
}
```

### 2. Interfaz de Repositorio (`domain/repositories/item.repository.ts`)
```typescript
import { Item } from '../entities/item.entity.js';

export interface ItemRepository {
    create(item: Partial<Item>): Promise<Item>;
    findById(id: string): Promise<Item | null>;
    update(id: string, item: Partial<Item>): Promise<Item>;
    delete(id: string): Promise<void>;
}
```

### 3. Errores específicos (`domain/errors/item.errors.ts`)
```typescript
import { ApplicationError } from '../../../../shared/domain/error.js';

export class ItemNotFoundError extends ApplicationError {
    constructor(id: string) {
        super(404, `Item with ID ${id} not found`, "ITEM_NOT_FOUND", "NOT_FOUND");
    }
}
```

### 4. DTOs de Entrada y Salida con Joi (`application/dtos/item.dto.ts`)
```typescript
import Joi from 'joi';

// Validación de entrada
export const createItemDtoRequestSchema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).allow(null, '').optional(),
});

export const updateItemDtoRequestSchema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(500).allow(null, '').optional(),
}).min(1);

// Sanitización de salida (Elimina campos no declarados para evitar fugas)
export const itemDtoResponseSchema = Joi.object({
    id: Joi.string().uuid().required(),
    name: Joi.string().required(),
    description: Joi.string().allow(null).optional(),
    created_at: Joi.date().required(),
}).options({ stripUnknown: true });
```

### 5. Implementación del Caso de Uso (`application/createItemUseCase.ts`)
```typescript
import { UseCase } from '../../../shared/application/useCase.js';
import { Item } from '../domain/entities/item.entity.js';
import { ItemRepository } from '../domain/repositories/item.repository.js';
import { PrismaItemRepository } from '../infrastructure/persistence/PrismaItemRepository.js';
import { createItemDtoRequestSchema, itemDtoResponseSchema } from './dtos/item.dto.js';
import Joi from 'joi';

interface CreateItemInput {
    name: string;
    description?: string;
}

export class CreateItemUseCase extends UseCase<CreateItemInput, Item> {
    protected inputSchema: Joi.Schema = createItemDtoRequestSchema;
    protected outputSchema: Joi.Schema = itemDtoResponseSchema;
    private readonly itemRepository: ItemRepository;

    constructor() {
        super();
        this.itemRepository = new PrismaItemRepository();
    }

    protected async implementation(data: CreateItemInput): Promise<Item> {
        return await this.itemRepository.create(data);
    }
}
```

### 6. Implementación Concreta de Prisma (`infrastructure/persistence/PrismaItemRepository.ts`)
```typescript
import { ItemRepository } from '../../domain/repositories/item.repository.js';
import { Item } from '../../domain/entities/item.entity.js';
import { prisma } from '../../../../shared/infrastructure/database.js';

export class PrismaItemRepository implements ItemRepository {
    async create(item: Partial<Item>): Promise<Item> {
        const created = await prisma.item.create({
            data: {
                name: item.name!,
                description: item.description ?? null,
            }
        });
        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<Item | null> {
        const found = await prisma.item.findUnique({ where: { id } });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async update(id: string, item: Partial<Item>): Promise<Item> {
        const updated = await prisma.item.update({
            where: { id },
            data: {
                // Conditional spread para evitar conflictos de Prisma con undefined
                ...(item.name !== undefined && { name: item.name }),
                ...(item.description !== undefined && { description: item.description }),
            }
        });
        return this.mapToEntity(updated);
    }

    async delete(id: string): Promise<void> {
        await prisma.item.delete({ where: { id } });
    }

    private mapToEntity(db: any): Item {
        return new Item(
            db.id,
            db.name,
            db.description,
            db.created_at,
            db.updated_at
        );
    }
}
```

### 7. Rutas HTTP (`infrastructure/http/itemRoutes.ts`)
```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter.js';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware.js';
import { CreateItemUseCase } from '../../application/createItemUseCase.js';

export async function itemRoutes(app: FastifyInstance) {
    // POST /items (Ruta protegida por JWT middleware)
    app.post('/', { preHandler: [authMiddleware] } as any, async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new CreateItemUseCase();
        const result = await useCase.execute(request.body);
        return ApiResponse.success(reply, result, "Item created successfully", 201);
    });
}
```

---

## 🚦 Verificación del Entorno de Desarrollo

Para comprobar que todo está listo y no hay errores de sintaxis en el tipado:
1. Genera los tipos de Prisma: `npm run prisma:generate`
2. Compila el TypeScript sin emitir archivos: `npx tsc --noEmit`
3. Arranca el entorno local de desarrollo: `npm run dev`
