const asyncHandler = require('express-async-handler')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { User, validateRegisterUser, validateLoginUser } = require('../models/User')
const { VerificationTokenModel } = require('../models/VerificationToken')
const crypto = require('crypto')
const sendEmails = require('../utils/sendEmails');

/**---------------------
 * @desc Register a new user
 * @route  /api/auth/register
 * @method POST
 * @access Public
 * ---------------------*/
module.exports.registerUserCtrl = asyncHandler(async (req, res) => {
    const { error } = validateRegisterUser(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })
    // is user exist
    const user = await User.findOne({ email: req.body.email })
    if (user) return res.status(400).json({ message: 'User already exist' })
    // hash password
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)
    // save user
    const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword
    })
    await newUser.save()

    // create new verification token and save it to db
    const verificationToken = new VerificationTokenModel({
        userId: newUser._id,
        token: crypto.randomBytes(32).toString('hex'),
    });
    await verificationToken.save();

    // Making link 
    const link = `${process.env.BASE_URL}/users/${newUser._id}/verify/${verificationToken.token}`;

    // putting link into html template
    const htmlTemplate = `
        <div>
            <h1>Please verify your email</h1>
            <a href="${link}">Verify Email</a>
        </div>
    `

    // send email to user
    await sendEmails(newUser.email, 'Verify Your Email', htmlTemplate);

    // send response to client
    res.status(201).json({ message: "Please check your email messages to verify your account" })
})

/**---------------------
 * @desc login user
 * @route  /api/auth/login
 * @method POST
 * @access Public
 * ---------------------*/
module.exports.loginUserCtrl = asyncHandler(async (req, res) => {
    const { error } = validateLoginUser(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    // is user exist
    const user = await User.findOne({ email: req.body.email })
    if (!user) return res.status(400).json({ message: "Invalid Email or Password" })

    const isPasswordMatch = await bcrypt.compare(req.body.password, user.password)
    if (!isPasswordMatch) return res.status(400).json({ message: "Invalid Email or Password" })


    if (!user.isAccountVerified) {

        let verificationToken = await VerificationTokenModel.findOne({
            userId: user._id,
        })

        if (!verificationToken) {
            verificationToken = await VerificationTokenModel.create({
                userId: user._id,
                token: crypto.randomBytes(32).toString('hex'),
            })
        }
        // Making link 
        const link = `${process.env.BASE_URL}/users/${user._id}/verify/${verificationToken.token}`;

        // putting link into html template
        const htmlTemplate = `
        <div>
            <h1>Please verify your email</h1>
            <a href="${link}">Verify Email</a>
        </div>
    `
        // send email to user
        await sendEmails(user.email, 'Verify Your Email', htmlTemplate);

        return res.status(400).json({ message: "Please verify your email" })
    }

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, `${process.env.JWT_SECRET}`, {
        expiresIn: "3d"
    })

    res.status(200).json({
        _id: user._id,
        isAdmin: user.isAdmin,
        profilePhoto: user.profilePhoto,
        token,
        username: user.username
    })
});

/**---------------------
 * @desc login user
 * @route  /api/auth/:userId/verify/:token
 * @method GET
 * @access Public
 * ---------------------*/
module.exports.verifyUserAccountCtrl = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(400).json({ message: "Invalid Link" });

    const verificationToken = await VerificationTokenModel.findOne({
        userId: user._id,
        token: req.params.token,
    });
    if (!verificationToken) return res.status(400).json({ message: "Invalid Link" });

    user.isAccountVerified = true;
    await user.save();

    await verificationToken.deleteOne();
    res.status(200).json({ message: "Email Verified. Please login" });
})