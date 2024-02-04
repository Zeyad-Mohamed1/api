const { createPostCtrl, getAllPostsCtrl, getSinglePostCtrl, getPostCountCtrl, deletePostCtrl, updatePostCtrl, updatePostImgCtrl, toggleLikeCtrl } = require('../controllers/postController')
const photoUpload = require('../middlewares/photoUpload')
const validateObjectId = require('../middlewares/validateObjectId')
const { verifyToken } = require('../middlewares/verifyToken')

const router = require('express').Router()



router
    .route('/')
    .post(verifyToken, photoUpload.single("image"), createPostCtrl)
    .get(getAllPostsCtrl)

router
    .route('/count')
    .get(getPostCountCtrl)

router
    .route('/:id')
    .get(validateObjectId, getSinglePostCtrl)
    .delete(validateObjectId, verifyToken, deletePostCtrl)
    .put(validateObjectId, verifyToken, updatePostCtrl)



router.route('/update-image/:id')
    .put(validateObjectId, verifyToken, photoUpload.single('image'), updatePostImgCtrl)

router.route('/like/:id')
    .put(validateObjectId, verifyToken, toggleLikeCtrl)
module.exports = router