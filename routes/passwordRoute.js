const router = require('express').Router()
const { sendResetPasswordLinkCtrl, getResetPasswordCtrl, resetPasswordCtrl } = require('../controllers/passwordController')


// /api/password/reset-password
router.post("/reset-password-link", sendResetPasswordLinkCtrl)

// /api/password/reset-password/:userId/:token
router.route('/reset-password/:userId/:token')
    .get(getResetPasswordCtrl)
    .post(resetPasswordCtrl)

module.exports = router