import Joi from 'joi';

export const loginUserDtoRequestSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});
