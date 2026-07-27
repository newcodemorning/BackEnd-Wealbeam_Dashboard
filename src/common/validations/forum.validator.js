const Joi = require('joi');

const replySchema = Joi.object({
    postId: Joi.string().allow('', null),
    author: Joi.string().allow('', null),
    content: Joi.string().required(),
    upvotes: Joi.number().default(0),
    likes: Joi.array().items(Joi.string()),
    createdAt: Joi.date().iso()
});

const postSchema = Joi.object({
    content: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).optional(),
    parentId: Joi.string().allow('', null).optional(),
    upvotes: Joi.number().default(0),
    likes: Joi.array().items(Joi.string()),
    createdAt: Joi.date().iso(),
    replies: Joi.array().items(replySchema)
});

const updatePostSchema = postSchema.fork(
    ['content'],
    schema => schema.optional()
);

const likeSchema = Joi.object({
    userId: Joi.string().required()
});

module.exports = {
    postSchema,
    updatePostSchema,
    replySchema,
    likeSchema
}; 