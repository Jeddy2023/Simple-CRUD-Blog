const HttpError = require("../models/errorModel")
const User = require("../models/userModel")
const Post = require("../models/postModel")
const fs = require('fs')
const path = require('path')
const { v4: uuid } = require('uuid')


//Create a post
//POST: api/posts
//PROTECTED 
const createPost = async (req, res, next) => {
    try {
        let { title, category, description } = req.body
        if (!title || !category || !description || !req.files) {
            return next(new HttpError("Fill in all fields.", 422))
        }

        const { thumbnail } = req.files
        //check the thumbnail size
        if (thumbnail.size > 2000000) {
            return next(new HttpError("Thumbnail is too big, File should be less than 2mb."))
        }

        let fileName = thumbnail.name
        let splittedFilename = fileName.split('.')
        let newFileName = splittedFilename[0] + uuid() + '.' + splittedFilename[splittedFilename.length - 1]
        thumbnail.mv(path.join(__dirname, '..', '/uploads', newFileName), async (err) => {
            if (err) {
                return next(new HttpError(err))
            } else {
                const newPost = await Post.create({ title, category, description, thumbnail: fileName, creator: req.user.id })

                if (!newPost) {
                    return next(new HttpError("Post couldn't be created.", 422))
                }

                //find user and increase postcount by 1
                const currentUser = await User.findById(req.user.id)
                const userPostCount = currentUser.posts + 1
                await User.findByIdAndUpdate(req.user.id, { posts: userPostCount })

                res.status(201).json(newPost)
            }
        })
    } catch (error) {
        return next(new HttpError(error))
    }
}

//Get all posts
//GET: api/posts
//UNPROTECTED 
const getPosts = async (req, res, next) => {
    try {
        const posts = await Post.find().sort({ updatedAt: -1 })
        res.status(200).json(posts)
    } catch (error) {
        return next(new HttpError(error))
    }
}

//Get single posts
//GET: api/posts/:Id
//UNPROTECTED 
const getPost = async (req, res, next) => {
    try {
        const postId = req.params.id
        const post = await Post.findById(postId)
        if (!post) {
            return next(new HttpError("Post not found", 404))
        }
        res.status(200).json(post)
    } catch (error) {
        return next(new HttpError(error))
    }
}
//Get posts by category
//GET: api/posts/categories/:category
//UNPROTECTED 
const getCatPosts = async (req, res, next) => {
    try {
        const { category } = req.params
        const catPosts = await Post.find({ category }).sort({ createdAt: -1 })
        res.status(200).json(catPosts)
    } catch (error) {
        return next(new HttpError(error))
    }
}

//Get posts by user/author
//GET: api/posts/users/:id
//UNPROTECTED 
const getUserPosts = async (req, res, next) => {
    try {
        const { id } = req.params
        const posts = await Post.find({ creator: id }).sort({ createdAt: -1 })
        res.status(200).json(posts)
    } catch (error) {
        return next(new HttpError(error))
    }
}

//Edit post
//PATCH: api/posts/:id
//PROTECTED 
const editPost = async (req, res, next) => {
    try {
        let fileName
        let newFileName
        let updatedPost
        const postId = req.params.id
        let { title, category, description } = req.body
        // ReactQuill has a paragraph opening and closing tag in between so there are 11 characters in there already
        if (!title || !category || !description.length < 12) {
            return next(new HttpError("Fill in all fields.", 422))
        }
        //get old post from database
        const oldPost = await Post.findById(postId)
        if (req.user.id == oldPost.creator) {
            if (!req.files) {
                updatedPost = await Post.findByIdAndUpdate(postId, { title, category, description }, { new: true })
            } else {
                //get old post from database
                const oldPost = await Post.findById(postId)
                //delete old thumbnail from upload
                fs.unlink(path.join(__dirname, '..', 'uploads', oldPost.thumbnail), async (err) => {
                    if (err) {
                        return next(new HttpError(err))
                    }
                })

                //upload new thumbnail
                const { thumbnail } = req.files
                //check the thumbnail size
                if (thumbnail.size > 2000000) {
                    return next(new HttpError("Thumbnail is too big, File should be less than 2mb."))
                }

                let fileName = thumbnail.name
                let splittedFilename = fileName.split('.')
                let newFileName = splittedFilename[0] + uuid() + '.' + splittedFilename[splittedFilename.length - 1]
                thumbnail.mv(path.join(__dirname, '..', '/uploads', newFileName), async (err) => {
                    if (err) {
                        return next(new HttpError(err))
                    }
                })

                updatedPost = await Post.findByIdAndUpdate(postId, { title, category, description, thumbnail: newFileName }, { new: true })
            }
        }

        if (!updatedPost) {
            return next(new HttpError("Could not update post.", 400))
        }

        res.status(200).json(updatedPost)
    } catch (error) {
        return next(new HttpError(error))
    }
}

//Delete post
//Delete: api/posts/:id
//PROTECTED 
const deletePosts = async (req, res, next) => {
    try {
        const postId = req.params.id
        if (!postId) {
            return next(new HttpError("Post unavialable.", 400))
        }
        const post = await Post.findById(postId)
        const fileName = post?.thumbnail
        if (req.user.id == post.creator) {
            //delete thumbnail from uploads folder
            fs.unlink(path.join(__dirname, '..', 'uploads', fileName), async (err) => {
                if (err) {
                    return next(new HttpError(err))
                } else {
                    await Post.findByIdAndUpdate(postId)
                    //find user and reduce post count by 1
                    const currentUser = await User.findById(req.user.id)
                    const userPostCount = currentUser.posts - 1
                    await User.findByIdAndUpdate(req.user.id, { posts: userPostCount })
                    res.json(`Post ${postId} deleted successfully`)
                }
            })
        } else {
            return next(new HttpError("Post couldn't be deleted.", 403))
        }
    } catch (error) {
        return next(new HttpError(error))
    }
}

module.exports = { createPost, editPost, deletePosts, getCatPosts, getPost, getPosts, getUserPosts }