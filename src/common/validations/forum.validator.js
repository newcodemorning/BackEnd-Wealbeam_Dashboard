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
    author: Joi.string().required(),
    content: Joi.string().required(),
    tags: Joi.array().items(Joi.string()),
    parentId: Joi.string().allow('', null),
    upvotes: Joi.number().default(0),
    likes: Joi.array().items(Joi.string()),
    createdAt: Joi.date().iso(),
    replies: Joi.array().items(replySchema)
});

const updatePostSchema = postSchema.fork(
    ['author', 'content'],
    schema => schema.optional()
);

module.exports = {
    postSchema,
    updatePostSchema,
    replySchema
}; 