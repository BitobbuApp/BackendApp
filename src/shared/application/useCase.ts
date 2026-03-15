import Joi from 'joi';
import { ValidationError } from '../domain/error';
import logger from '../infrastructure/logger';

// --- shared/application/UseCase.ts ---
export abstract class UseCase<TInput, TOutput> {
    protected abstract inputSchema: Joi.Schema;
    protected abstract outputSchema: Joi.Schema;

    // El método que contiene la lógica pura de negocio
    protected abstract implementation(data: TInput): Promise<TOutput>;

    // El punto de entrada "seguro" que valida todo
    public async execute(data: any): Promise<TOutput> {
        // 1. Validar Entrada
        const { error: inErr, value: validatedIn } = this.inputSchema.validate(data, { abortEarly: false });
        if (inErr) {
            throw new ValidationError(inErr.details.map((detail) => detail.message));
        }

        // 2. Ejecutar Lógica
        const result = await this.implementation(validatedIn);

        // 3. Validar/Sanitizar Salida
        const { error: outErr, value: validatedOut } = this.outputSchema.validate(result, { abortEarly: false });
        if (outErr) {
            logger.error({ details: outErr.details }, 'Output validation error');
            throw new ValidationError(['Internal server error during data sanitization']);
        }

        return validatedOut;
    }
}
