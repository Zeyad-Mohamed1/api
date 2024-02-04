const mongoose = require('mongoose')
const joi = require('joi')
const passwordComplexity = require('joi-password-complexity');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        minlength: 2
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        minlength: 5,
        maxlength: 255
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        trim: true
    },
    profilePhoto: {
        type: Object,
        default: {
            url: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png',
            publicId: null
        }
    },
    bio: {
        type: String,
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isAccountVerified: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

// populate posts that related to user
UserSchema.virtual("posts", {
    ref: "Post",
    foreignField: "user",
    localField: "_id"
})

const complexityOptions = {
    min: 8,             // الحد الأدنى لطول كلمة المرور
    max: 100,           // الحد الأقصى لطول كلمة المرور
    lowerCase: 1,       // الحد الأدنى لعدد الحروف الصغيرة
    upperCase: 1,       // الحد الأدنى لعدد الحروف الكبيرة
    numeric: 1,         // الحد الأدنى لعدد الأرقام
    symbol: 0,          // الحد الأدنى لعدد الرموز
    requirementCount: 4 // عدد الشروط التي يجب تلبيتها
};

// validate
function validateRegisterUser(obj) {
    const schema = joi.object({
        username: joi.string().min(2).max(100).required(),
        email: joi.string().min(5).max(100).required().email(),
        password: passwordComplexity(complexityOptions).required(),
    })

    return schema.validate(obj)
}


// validate login
function validateLoginUser(obj) {
    const schema = joi.object({
        email: joi.string().min(5).max(100).required().email(),
        password: joi.string().min(8).required()
    })
    return schema.validate(obj)
}

function validateEmail(obj) {
    const schema = joi.object({
        email: joi.string().min(5).max(100).required().email(),
    })
    return schema.validate(obj);
}

function validateNewPassword(obj) {
    const schema = joi.object({
        password: passwordComplexity().required(),
    })
    return schema.validate(obj)
}

function validateUpdateUser(obj) {
    const schema = joi.object({
        username: joi.string().trim().min(2).max(100),
        password: passwordComplexity({
            max: 50,
        }),
        bio: joi.string()
    })

    return schema.validate(obj)
}

const User = mongoose.model('User', UserSchema)
module.exports = { User, validateRegisterUser, validateLoginUser, validateUpdateUser, validateEmail, validateNewPassword }