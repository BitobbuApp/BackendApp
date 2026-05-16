import Joi from 'joi';

export const createMessageDtoRequestSchema = Joi.object({
    conversation_id: Joi.string().uuid().required(),
    sender_id: Joi.string().uuid().required(),
    client_msg_id: Joi.string().uuid().optional().allow(null),
    content: Joi.string().optional().allow(null, ''),
    file_url: Joi.string().uri().optional().allow(null, ''),
    file_name: Joi.string().optional().allow(null, ''),
}).or('content', 'file_url').options({ stripUnknown: true }); // A message must have either text content or a file

export const messageDtoResponseSchema = Joi.object({
    id: Joi.string().uuid().required(),
    conversation_id: Joi.string().uuid().required(),
    sender_id: Joi.string().uuid().allow(null).required(),
    message_type: Joi.string().optional().default('user'),
    event_key: Joi.string().optional().allow(null),
    event_payload: Joi.any().optional().allow(null),
    client_msg_id: Joi.string().uuid().optional().allow(null),
    content: Joi.string().optional().allow(null, ''),
    file_url: Joi.string().uri().optional().allow(null, ''),
    file_name: Joi.string().optional().allow(null, ''),
    is_read: Joi.boolean().default(false),
    read_at: Joi.date().optional().allow(null),
    created_at: Joi.date().required()
}).unknown(true);

export const listMessagesDtoRequestSchema = Joi.object({
    conversation_id: Joi.string().uuid().required(),
    requester_company_id: Joi.string().uuid().required(),
    limit: Joi.number().integer().min(1).max(200).default(50),
    offset: Joi.number().integer().min(0).default(0)
}).options({ stripUnknown: true });

export const messageListDtoResponseSchema = Joi.array()
    .items(messageDtoResponseSchema);

export const createMessageUseCaseResponseSchema = Joi.object({
    message: messageDtoResponseSchema.required(),
    isDuplicate: Joi.boolean().required()
}).options({ stripUnknown: true });
