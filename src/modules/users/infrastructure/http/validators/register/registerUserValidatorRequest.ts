import Joi from "joi";

export const registerUserDtoRequestSchema = Joi.object({
    first_name: Joi.string().min(2).max(50).required(),
    last_name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),

    password: Joi.string()  // this is an example
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
        .required()
        .messages({
            'string.pattern.base': 'Password must be alphanumeric and 3-30 characters long'
        })
});