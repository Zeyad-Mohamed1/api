const { createCommentCtrl, getCommentCtrl, deleteCommentCtrl, updateCommentCtrl } = require('../controllers/commentsController')
const validateObjectId = require('../middlewares/validateObjectId')
const { verifyToken, verifyTokenAndAdmin } = require('../middlewares/verifyToken')

const router = require('express').Router()

router.route('/')
    .post(verifyToken, createCommentCtrl)
    .get(verifyTokenAndAdmin, getCommentCtrl)

router.route('/:id')
    .delete(validateObjectId, verifyToken, deleteCommentCtrl)
    .put(validateObjectId, verifyToken, updateCommentCtrl)


module.exports = router