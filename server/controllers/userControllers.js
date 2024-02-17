const HttpError = require("../models/errorModel")
const User = require("../models/userModel")

// REGISTER A NEW USER
// POST : api/users/register
// UNPROTECTED
const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, password2 } = req.body;
        if (!name || !email || !password) {
            return next(new HttpError("Fill in all fields.", 422))
        }

        const newEmail = email.toLowerCase()

        const emailExists = await User.findOne({email: newEmail})

        if(emailExists){
            return next(new HttpError("Email already exists.", 422))
        }

        if((password.trim()).length < 6){
            return next(new HttpError("Password should be at least 6 characters.", 422))
        }

        if(password != password2){
            return next(new HttpError("Passwords do not match.", 422))
        }

        


    } catch (error) {
        return next(new HttpError("User registration failed.", 422))
    }
};

// LOGIN A REGISTERED USER
// POST : api/users/login
// UNPROTECTED
const loginUser = async (req, res, next) => {
    res.json("Login User");
};

// USER PROFILE
// POST : api/users/:id
// PROTECTED
const getUser = async (req, res, next) => {
    res.json("User Profile");
};

// CHANGE USER AVATAR
// POST : api/users/change-avatar
// PROTECTED
const changeAvatar = async (req, res, next) => {
    res.json("Change User avatar");
};


// EDIT USER DETAILS
// POST : api/users/edit-user
// PROTECTED
const editUser = async (req, res, next) => {
    res.json("Edit User Detail");
};


// GET AUTHORS
// POST : api/users/authors
// UNPROTECTED
const getAuthors = async (req, res, next) => {
    res.json("Get all users/authors");
};

module.exports = { registerUser, loginUser, getUser, changeAvatar, editUser, getAuthors }