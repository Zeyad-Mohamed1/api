const { createCategoryCtrl, getAllCategoryCtrl, deleteCategoryCtrl } = require('../controllers/categoryController')
const validateObjectId = require('../middlewares/validateObjectId')
const { verifyTokenAndAdmin } = require('../middlewares/verifyToken')

const router = require('express').Router()

router.route('/')
    .post(verifyTokenAndAdmin, createCategoryCtrl)
    .get(getAllCategoryCtrl)

router.route('/:id')
    .delete(validateObjectId, verifyTokenAndAdmin, deleteCategoryCtrl)

module.exports = router