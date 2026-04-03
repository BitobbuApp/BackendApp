import Joi from 'joi';

export const listConversationsQuerySchema = Joi.object({
    company_id: Joi.string().uuid().required()
}).options({ stripUnknown: true });

export const createConversationDtoRequestSchema = Joi.object({
    participant_1_id: Joi.string().uuid().required(),
    participant_2_id: Joi.string().uuid().required(),
    request_id: Joi.string().uuid().optional().allow(null),
    quote_response_id: Joi.string().uuid().optional().allow(null),
    transaction_id: Joi.string().uuid().optional().allow(null),
}).options({ stripUnknown: true });

export const conversationDtoResponseSchema = Joi.object({
    id: Joi.string().uuid().required(),
    participant_1_id: Joi.string().uuid().required(),
    participant_2_id: Joi.string().uuid().required(),
    request_id: Joi.string().uuid().optional().allow(null),
    quote_response_id: Joi.string().uuid().optional().allow(null),
    transaction_id: Joi.string().uuid().optional().allow(null),
    last_message: Joi.string().optional().allow(null),
    last_message_date: Joi.date().optional().allow(null),
    unread_count_1: Joi.number().integer().default(0),
    unread_count_2: Joi.number().integer().default(0),
    created_at: Joi.date().required(),
    updated_at: Joi.date().required()
}).unknown(true);

export const conversationListDtoResponseSchema = Joi.array()
    .items(conversationDtoResponseSchema);
