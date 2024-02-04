const asyncHandler = require('express-async-handler')
const { validateCreateCategory, Category } = require('../models/Category')

/**---------------------
 * @desc create category
 * @route  /api/categories
 * @method POST
 * @access private (only admin)
 * ---------------------*/
module.exports.createCategoryCtrl = asyncHandler(async (req, res) => {
    const { error } = validateCreateCategory(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    const category = await Category.create({
        title: req.body.title,
        user: req.user.id
    })

    res.status(201).json(category)
})

/**---------------------
 * @desc get all category
 * @route  /api/categories
 * @method GET
 * @access public
 * ---------------------*/
module.exports.getAllCategoryCtrl = asyncHandler(async (req, res) => {
    const category = await Category.find()

    res.status(200).json(category)
})

/**---------------------
 * @desc get all category
 * @route  /api/categories
 * @method GET
 * @access public
 * ---------------------*/
module.exports.deleteCategoryCtrl = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ message: "Category Not Found!" })

    await Category.findByIdAndDelete(req.params.id)
    res.status(200).json({ message: "Category Has Been Deleted Successfully!", categoryId: category._id })
})