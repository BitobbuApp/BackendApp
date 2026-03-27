import Joi from 'joi';

export const createMessageDtoRequestSchema = Joi.object({
    conversation_id: Joi.string().uuid().required(),
    sender_id: Joi.string().uuid().required(),
    client_msg_id: Joi.string().uuid().optional().allow(null),
    content: Joi.string().optional().allow(null, ''),
    file_url: Joi.string().uri().optional().allow(null, ''),
    file_name: Joi.string().optional().allow(null, ''),
}).or('content', 'file_url'); // A message must have either text content or a file

export const messageDtoResponseSchema = Joi.object({
    id: Joi.string().uuid().required(),
    conversation_id: Joi.string().uuid().required(),
    sender_id: Joi.string().uuid().required(),
    client_msg_id: Joi.string().uuid().optional().allow(null),
    content: Joi.string().optional().allow(null, ''),
    file_url: Joi.string().uri().optional().allow(null, ''),
    file_name: Joi.string().optional().allow(null, ''),
    is_read: Joi.boolean().default(false),
    read_at: Joi.date().optional().allow(null),
    created_at: Joi.date().required()
}).unknown(true);
