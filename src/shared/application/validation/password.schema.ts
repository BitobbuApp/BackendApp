import Joi from 'joi';

/**
 * Validates password according to platform security policy:
 * - Minimum 10 characters
 * - Maximum 72 BYTES UTF-8 (bcrypt hard limitation)
 * - Must contain at least one letter and at least one number
 * - Allows symbols and spaces
 */
export const passwordSchema = Joi.string()
    .min(10)
    .custom((value: string, helpers) => {
        if (Buffer.byteLength(value, 'utf8') > 72) {
            return helpers.error('string.max', { limit: '72 bytes' });
        }
        return value;
    })
    .pattern(/[A-Za-z]/, 'al menos una letra')
    .pattern(/[0-9]/, 'al menos un número')
    .required()
    .messages({
        'string.min': 'La contraseña debe tener al menos 10 caracteres.',
        'string.max': 'La contraseña no puede exceder 72 bytes.',
        'string.pattern.name': 'La contraseña debe contener {#name}.',
    });

/**
 * Contextual security check:
 * Rejects passwords that contain the user's first name or email local-part (if 4+ chars).
 */
export function validatePasswordContext(password: string, context?: { email?: string; firstName?: string }): { valid: boolean; reason?: string } {
    const lowerPassword = password.toLowerCase();

    if (context?.firstName && context.firstName.trim().length >= 4) {
        const cleanName = context.firstName.trim().toLowerCase();
        if (lowerPassword.includes(cleanName)) {
            return {
                valid: false,
                reason: 'La contraseña no puede contener tu nombre.',
            };
        }
    }

    if (context?.email) {
        const localPart = context.email.split('@')[0]?.toLowerCase();
        if (localPart && localPart.length >= 4 && lowerPassword.includes(localPart)) {
            return {
                valid: false,
                reason: 'La contraseña no puede contener tu nombre de usuario o correo.',
            };
        }
    }

    return { valid: true };
}
