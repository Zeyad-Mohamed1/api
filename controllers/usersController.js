const asyncHandler = require('express-async-handler')
const { User, validateUpdateUser } = require('../models/User')
const bcrypt = require('bcryptjs')
const path = require("path")
const fs = require('fs')
const { cloudinaryUploadImage, cloudinaryRemoveImage, cloudinaryRemoveMultipleImage } = require('../utils/cloudinary')
const { Post } = require('../models/Post')
const { Comment } = require('../models/Comment')
/**---------------------
 * @desc get All users
 * @route  /api/users/profile
 * @method GET
 * @access Admin
 * ---------------------*/
module.exports.getAllUsersCtrl = asyncHandler(async (req, res) => {
    if (!req.user.isAdmin) return res.status(403).json({ message: "Admin Only Can get this Data" })
    const users = await User.find().select("-password").populate('posts')
    // const { password, ...others } = users._doc
    res.status(200).json(users)
})

/**---------------------
 * @desc get user profile
 * @route  /api/users/profile/:id
 * @method GET
 * @access Public
 * ---------------------*/
module.exports.getUserProfileCtrl = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).populate('posts').select("-password");
    if (!user) return res.status(404).json({ message: "User Not Found!" });


    res.status(200).json(user)
})

/**---------------------
 * @desc update user profile
 * @route  /api/users/profile/:id
 * @method PUT
 * @access private(only user)
 * ---------------------*/
module.exports.updateUserProfileCtrl = asyncHandler(async (req, res) => {
    const { error } = validateUpdateUser(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    if (req.body.password) {
        const salt = await bcrypt.genSalt(12)
        req.body.password = await bcrypt.hash(req.body.password, salt)
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        $set: req.body
    }, { new: true })
        .select("-password")
        .populate('posts');

    res.status(200).json(updatedUser)
})

/**---------------------
 * @desc get users count
 * @route  /api/users/count
 * @method GET
 * @access private(only admin)
 * ---------------------*/
module.exports.getUsersCountCtrl = asyncHandler(async (req, res) => {
    const count = await User.countDocuments()
    res.status(200).json(count)
})

/**---------------------
 * @desc    Profile Photo Upload
 * @route   /api/users/profile/profile-photo-upload
 * @method  POST
 * @access  private (only logged in user)
 ------------------------------------------------*/
module.exports.profilePhotoUploadCtrl = asyncHandler(async (req, res) => {
    // 1. Validation
    if (!req.file) {
        return res.status(400).json({ message: "no file provided" });
    }

    // 2. Get the path to the image
    const imagePath = path.join(__dirname, `../images/${req.file.filename}`);

    // 3. Upload to cloudinary
    const result = await cloudinaryUploadImage(imagePath);

    // 4. Get the user from DB
    const user = await User.findById(req.user.id);

    // 5. Delete the old profile photo if exist
    if (user.profilePhoto?.publicId !== null) {
        await cloudinaryRemoveImage(user.profilePhoto.publicId);
    }

    // 6. Change the profilePhoto field in the DB
    user.profilePhoto = {
        url: result.secure_url,
        publicId: result.public_id,
    };
    await user.save();

    // 7. Send response to client
    res.status(200).json({
        message: "your profile photo uploaded successfully",
        profilePhoto: { url: result.secure_url, publicId: result.public_id },
    });

    // 8. Remvoe image from the server
    fs.unlinkSync(imagePath);
});
/**---------------------
 * @desc delet user profile 
 * @route  /api/users/profile/:id
 * @method DELETE
 * @access private(only admin or userHimself)
 * ---------------------*/
module.exports.deleteUserProfileCtrl = asyncHandler(async (req, res) => {
    // get user from db
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: "User Not Found" })

    //  get all posts
    const posts = await Post.find({ user: user._id })
    // get publicIds from posts
    const publicIds = posts?.map((post) => post.image.publicId)
    // Delete all posts image from cloudinary 
    if (publicIds?.length > 0) {
        await cloudinaryRemoveMultipleImage(publicIds)
    }
    // delete profile picture from cloudinary
    if (user.profilePhoto?.publicId !== null) {
        await cloudinaryRemoveImage(user.profilePhoto.publicId)
    }

    // delete user posts and comments
    await Post.deleteMany({ user: user._id })
    await Comment.deleteMany({ user: user._id })
    // delete user himself
    await User.findByIdAndDelete(req.params.id)
    // send res to client  
    res.status(200).json({ message: "User Deleted Successfully!" })
})