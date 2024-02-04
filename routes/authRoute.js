const { registerUserCtrl, loginUserCtrl, verifyUserAccountCtrl } = require('../controllers/authController')
const router = require('express').Router()

// register
router.post('/register', registerUserCtrl)

// login
router.post('/login', loginUserCtrl)

// verify
router.get('/:userId/verify/:token', verifyUserAccountCtrl)


module.exports = router