const { getAllUsersCtrl, getUserProfileCtrl, updateUserProfileCtrl, getUsersCountCtrl, profilePhotoUploadCtrl, deleteUserProfileCtrl } = require('../controllers/usersController')
const photoUpload = require('../middlewares/photoUpload')
const validateObjectId = require('../middlewares/validateObjectId')
const { verifyToken, verifyTokenAndAdmin, verifyTokenAndOnlyUser, verifyTokenAndAdminOrUser } = require('../middlewares/verifyToken')
const router = require('express').Router()

// get all users
router.get('/profile', verifyTokenAndAdmin, getAllUsersCtrl)
router.get('/profile/:id', validateObjectId, getUserProfileCtrl)
router.put('/profile/:id', validateObjectId, verifyTokenAndOnlyUser, updateUserProfileCtrl)
router.get('/count', verifyTokenAndAdmin, getUsersCountCtrl)
// /api/users/profile/profile-photo-upload
router
    .route("/profile/profile-photo-upload")
    .post(verifyToken, photoUpload.single("image"), profilePhotoUploadCtrl);
router.delete('/profile/:id', validateObjectId, verifyTokenAndAdminOrUser, deleteUserProfileCtrl)





module.exports = router