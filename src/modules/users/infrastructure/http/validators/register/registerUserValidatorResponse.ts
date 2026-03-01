import Joi from 'joi';


export const registerUserDtoResponseSchema = Joi.object({
    id: Joi.string().required(),
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    email: Joi.string().email().required(),
}).options({
    stripUnknown: true
});