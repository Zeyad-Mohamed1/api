const mongoose = require('mongoose')
const Joi = require('joi')


const CommentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
})

// CommentSchema.virtual('user', {
//     ref: 'User',
//     localField: 'user',
//     foreignField: '_id',
// })

const Comment = mongoose.model("Comment", CommentSchema)

// validate create comment
function validateCreateComment(obj) {
    const schema = Joi.object({
        postId: Joi.string().required(),
        text: Joi.string().trim().min(1).required(),
    })
    return schema.validate(obj)
}

function validateUpdateComment(obj) {
    const schema = Joi.object({
        text: Joi.string().trim().min(1).required(),
    })
    return schema.validate(obj)
}

module.exports = {
    Comment,
    validateCreateComment,
    validateUpdateComment
}