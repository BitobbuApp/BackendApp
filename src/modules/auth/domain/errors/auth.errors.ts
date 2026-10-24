import { ApplicationError } from '../../../../shared/domain/error';

export class ResetTokenInvalidError extends ApplicationError {
    constructor(message: string = 'El enlace de recuperación es inválido o ha expirado.') {
        super(400, message, 'RESET_TOKEN_INVALID');
    }
}

export class PasswordRecentlyUsedError extends ApplicationError {
    constructor(message: string = 'No puedes reutilizar ninguna de tus últimas 5 contraseñas.') {
        super(422, message, 'PASSWORD_RECENTLY_USED');
    }
}

export class TwoFactorRequiredError extends ApplicationError {
    constructor(message: string = 'Se requiere autenticación de dos factores (TOTP).') {
        super(400, message, 'TWO_FACTOR_REQUIRED');
    }
}

export class TwoFactorInvalidError extends ApplicationError {
    constructor(message: string = 'Código de verificación incorrecto.') {
        super(401, message, 'TWO_FACTOR_INVALID');
    }
}

export class TwoFactorEnforcedByCompanyError extends ApplicationError {
    constructor(message: string = 'Tu empresa exige la autenticación en dos pasos obligatoria y no puede desactivarse.') {
        super(403, message, 'TWO_FACTOR_ENFORCED_BY_COMPANY');
    }
}

export class TooManyRequestsError extends ApplicationError {
    constructor(message: string = 'Demasiadas solicitudes. Por favor espera unos momentos antes de reintentar.') {
        super(429, message, 'TOO_MANY_REQUESTS');
    }
}
