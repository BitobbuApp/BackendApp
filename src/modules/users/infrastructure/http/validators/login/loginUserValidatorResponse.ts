import Joi from 'joi';

// Defines the safe public fields returned after a successful login.
// password, salt, and other internals are intentionally excluded.
export const loginUserDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    email: Joi.string().email().required(),
    is_active: Joi.boolean().required(),
    last_access: Joi.date().allow(null),
    token: Joi.string().required(),
}).options({ stripUnknown: true });
