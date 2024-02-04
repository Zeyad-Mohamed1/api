const asyncHandler = require('express-async-handler')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { User, validateEmail, validateNewPassword } = require('../models/User')
const { VerificationTokenModel } = require('../models/VerificationToken')
const crypto = require('crypto')
const sendEmails = require('../utils/sendEmails');

/**---------------------
 * @desc Send reset password link
 * @route  /api/password/reset-password-link
 * @method POST
 * @access Public
 * ---------------------*/
module.exports.sendResetPasswordLinkCtrl = asyncHandler(async (req, res) => {
    // validate
    const { error } = validateEmail(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    // get user by email
    const user = await User.findOne({ email: req.body.email })
    if (!user) return res.status(400).json({ message: "User With This Email Not Found" })

    // create token
    let verificationToken = await VerificationTokenModel.findOne({
        userId: user._id,
    })
    if (!verificationToken) {
        verificationToken = new VerificationTokenModel({
            userId: user._id,
            token: crypto.randomBytes(32).toString('hex'),
        })
        await verificationToken.save()
    }

    // create link
    const link = `${process.env.BASE_URL}/reset-password/${user._id}/${verificationToken.token}`;

    // create html template
    const htmlTemplate = `
        <a href="${link}">Click Here To Reset Password</a>
    `
    // send email
    await sendEmails(user.email, "Reset Password", htmlTemplate)
    // send response
    res.status(200).json({ message: "Reset Password Link Sent To Your Email" })
})

/**---------------------
 * @desc get reset password link
 * @route  /api/password/reset-password/:userId/:token
 * @method GET
 * @access Public
 * ---------------------*/
module.exports.getResetPasswordCtrl = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(400).json({ message: "Invalid Link" });

    const verificationToken = await VerificationTokenModel.findOne({
        userId: user._id,
        token: req.params.token,
    });
    if (!verificationToken) return res.status(400).json({ message: "Invalid Link" });

    res.status(200).json({ message: "Valid Link" })
})

/**---------------------
 * @desc reset password
 * @route  /api/password/reset-password/:userId/:token
 * @method POST
 * @access Public
 * ---------------------*/
module.exports.resetPasswordCtrl = asyncHandler(async (req, res) => {
    const { error } = validateNewPassword(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(400).json({ message: "Invalid Link" });

    const verificationToken = await VerificationTokenModel.findOne({
        userId: user._id,
        token: req.params.token,
    });
    if (!verificationToken) return res.status(400).json({ message: "Invalid Link" });

    if (!user.isAccountVerified) {
        user.isAccountVerified = true;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    user.password = hashedPassword;
    await user.save();
    await VerificationTokenModel.findByIdAndDelete(verificationToken._id);

    res.status(200).json({ message: "Password Reset Successfully Please Login" })
})
