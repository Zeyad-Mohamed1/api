const fs = require('fs')
const path = require('path')
const asyncHandler = require('express-async-handler')
const { Post, validateCreatePost, validateUpdatePost } = require('../models/Post')
const { cloudinaryRemoveImage, cloudinaryUploadImage } = require('../utils/cloudinary')
const { Comment } = require('../models/Comment')

/**---------------------
 * @desc Crate new post
 * @route  /api/posts
 * @method POST
 * @access private (only logged in users)
 * ---------------------*/
module.exports.createPostCtrl = asyncHandler(async (req, res) => {
    // 1.validate for img
    if (!req.file) return res.status(400).json({ message: "No Image Provided" })
    // 2.validate for data
    const { error } = validateCreatePost(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })
    // 3.upload Photo
    const imgPath = path.join(__dirname, `../images/${req.file.filename}`)
    const result = await cloudinaryUploadImage(imgPath)
    // 4.create new post and save it
    const newPost = await Post.create({
        title: req.body.title,
        desc: req.body.desc,
        category: req.body.category,
        user: req.user.id,
        image: {
            url: result.secure_url,
            publicId: result.public_id
        }
    })
    // 5. send res to client
    res.status(201).json({ message: "Post Created Successfully!" })
    // 6.remove image from server
    fs.unlinkSync(imgPath)
})

/**---------------------
 * @desc Get posts
 * @route  /api/posts
 * @method GET
 * @access public
 * ---------------------*/
module.exports.getAllPostsCtrl = asyncHandler(async (req, res) => {
    const POST_PER_PAGE = 3;
    const { pageNumber, category } = req.query;
    let posts;

    if (pageNumber) {
        posts = await Post.find()
            .skip((pageNumber - 1) * POST_PER_PAGE)
            .limit(POST_PER_PAGE)
            .sort({ createdAt: -1 })
            .populate("user", ["-password"]);
    } else if (category) {
        posts = await Post.find({ category })
            .sort({ createdAt: -1 })
            .populate("user", ["-password"]);
    } else {
        posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate("user", ["-password"]);
    }
    res.status(200).json(posts);
});

/**---------------------
 * @desc Get post
 * @route  /api/posts/:id
 * @method GET
 * @access public
 * ---------------------*/
module.exports.getSinglePostCtrl = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id).populate("user", ["-password"])
        .populate("comments")
    if (!post) return res.status(404).json({ message: "Post Not Found" })

    res.status(200).json(post)
})

/**---------------------
 * @desc Get posts count
 * @route  /api/posts/count
 * @method GET
 * @access public
 * ---------------------*/
module.exports.getPostCountCtrl = asyncHandler(async (req, res) => {
    const count = await Post.countDocuments();
    res.status(200).json(count)
})

/**---------------------
 * @desc Delete post
 * @route  /api/posts/:id
 * @method DELETE
 * @access private (only admin or user)
 * ---------------------*/
module.exports.deletePostCtrl = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
        return res.status(404).json({ message: "post not found" });
    }

    if (req.user.isAdmin || req.user.id === post.user.toString()) {
        await Post.findByIdAndDelete(req.params.id);
        await cloudinaryRemoveImage(post.image.publicId);

        // Delete all comments that belong to this post
        await Comment.deleteMany({ postId: post._id });

        res.status(200).json({
            message: "post has been deleted successfully",
            postId: post._id,
        });
    } else {
        res.status(403).json({ message: "access denied, forbidden" });
    }
});

/**---------------------
 * @desc update post
 * @route  /api/posts/:id
 * @method PUT
 * @access private (only user)
 * ---------------------*/
module.exports.updatePostCtrl = asyncHandler(async (req, res) => {
    // 1.validation
    const { error } = validateUpdatePost(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })
    // 2.get post from db and check if exist
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: "Post Not Found" })
    // 3.check if post belong to user
    if (req.user.id !== post.user.toString()) {
        return res.status(403).json({ message: "Access Denied" })
    }
    // 4.update post
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, {
        $set: {
            title: req.body.title,
            desc: req.body.desc,
            category: req.body.category,
        }
    }, { new: true }).populate('user', ['-password']).populate('comments')

    // 5.send res to client
    res.status(200).json(updatedPost)
})

/**---------------------
 * @desc update post image
 * @route  /api/posts/upload-image/:id
 * @method PUT
 * @access private (only user)
 * ---------------------*/
module.exports.updatePostImgCtrl = asyncHandler(async (req, res) => {
    // 1.validation
    if (!req.file) return res.status(400).json({ message: "No Image Provided" })
    // 2.get post from db and check if exist
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ message: "Post Not Found" })
    // 3.check if post belong to user
    if (req.user.id !== post.user.toString()) {
        return res.status(403).json({ message: "Access Denied" })
    }
    // 4.delete old image
    await cloudinaryRemoveImage(post.image.publicId)

    // 5.upload new image
    const imgPath = path.join(__dirname, `../images/${req.file.filename}`)
    const result = await cloudinaryUploadImage(imgPath)

    // update img in db
    const updatedImage = await Post.findByIdAndUpdate(req.params.id, {
        $set: {
            image: {
                url: result.secure_url,
                publicId: result.public_id
            }
        }
    }, { new: true })
    // .send res to client
    res.status(200).json(updatedImage)

    // remove photo from server
    fs.unlinkSync(imgPath)
})

/**---------------------
 * @desc Toggle Like
 * @route  /api/posts/like/:id
 * @method PUT
 * @access private (only loggedIn user)
 * ---------------------*/
module.exports.toggleLikeCtrl = asyncHandler(async (req, res) => {
    const loggedInUser = req.user.id
    const { id: postId } = req.params
    let post = await Post.findById(postId)
    if (!post) return res.status(404).json({ message: "Post Not Found" })

    const isPostAlreadyLiked = post.likes.find((user) => user.toString() === loggedInUser)

    if (isPostAlreadyLiked) {
        post = await Post.findByIdAndUpdate(postId, {
            $pull: { likes: loggedInUser },
        }, { new: true })
    } else {
        post = await Post.findByIdAndUpdate(postId, {
            $push: { likes: loggedInUser },
        }, { new: true })
    }

    res.status(200).json(post)
})
