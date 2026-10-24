export const MAILGUN_TEMPLATES: Record<string, string> = {
    'action_required': 'acción requerida: tu verificación',
    'welcome': 'bienvenida',
    'verification': 'confirma tu correo en bitobbu',
    'payment_confirmation': 'confirmación de pago en bitobbu',
    'profile_under_review': 'estamos revisando tu perfil',
    'password_reset': 'recuperación de contraseña',
    'trial_ending_3_days': 'te quedan 3 días de acceso gratuito',
    'account_paused': 'tu acceso a bitobbu está pausado',
    'password_updated': 'tu contraseña fue actualizada',
    'trial_ending_today': 'tu prueba en bitobbu termina hoy',
    'profile_verified': '¡tu perfil ya está verificado!',
    'otp_verification': 'código de verificación',
    'rfq_match': 'nuevo solicitud de rfq',
    'two_factor_changed': 'cambio en la seguridad de tu cuenta'
};

/**
 * Subject per template. Mailgun templates do not store a subject, so without one every email would go out with the
 * generic fallback. Keys match MAILGUN_TEMPLATES.
 */
export const MAILGUN_SUBJECTS: Record<string, string> = {
    'action_required': 'Acción requerida: verifica tu cuenta',
    'welcome': 'Te damos la bienvenida a Bitobbu',
    'verification': 'Confirma tu correo en Bitobbu',
    'payment_confirmation': 'Confirmación de pago en Bitobbu',
    'profile_under_review': 'Estamos revisando tu perfil',
    'password_reset': 'Restablece tu contraseña de Bitobbu',
    'trial_ending_3_days': 'Te quedan 3 días de acceso gratuito',
    'account_paused': 'Tu acceso a Bitobbu está pausado',
    'password_updated': 'Tu contraseña fue actualizada',
    'trial_ending_today': 'Tu prueba en Bitobbu termina hoy',
    'profile_verified': '¡Tu perfil ya está verificado!',
    'otp_verification': 'Tu código de verificación',
    'rfq_match': 'Nueva solicitud de cotización para ti',
    'two_factor_changed': 'Cambió la seguridad de tu cuenta'
};
