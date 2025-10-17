const User = require('../models/user');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { uploadOnCloudinary } = require('../utils/cloudinary');

const signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            throw new ApiError(400, "All fields are required");
        }

        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            throw new ApiError(409, `User with email '${email}' already exists. Please choose a different email.`);
        }

        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername) {
            throw new ApiError(409, `User with username '${username}' already exists. Please choose a different username.`);
        }

        const user = await User.create({ username, email, password });
        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        res.status(201).json(new ApiResponse(201, "User registered successfully", createdUser));
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message));
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            throw new ApiError(400, "Email and password are required");
        }

        const user = await User.findOne({ email });
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const isPasswordValid = await user.validatePassword(password);
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid credentials");
        }

        const accessToken = await user.generateAuthtoken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        };

        res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, "User logged in successfully", { user: loggedInUser, accessToken, refreshToken }));
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message));
    }
};

const logout = async (req, res) => {
    try {
        const userId = req.user._id;
        
        await User.findByIdAndUpdate(userId, {
            $unset: { refreshToken: 1 }
        });

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        };

        res.status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, "User logged out successfully", {}));
    } catch (error) {
        res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message));
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -refreshToken');
        res.status(200).json(new ApiResponse(200, "Profile fetched successfully", user));
    } catch (error) {
        res.status(500).json(new ApiError(500, error.message));
    }
};

const updateProfile = async (req, res) => {
    try {
        const { username } = req.body;
        const userId = req.user._id;
        
        let avatarUrl = req.user.avatar;
        
        if (req.file) {
            const result = await uploadOnCloudinary(req.file.path);
            if (result) {
                avatarUrl = result.url;
            }
        }
        
        const user = await User.findByIdAndUpdate(
            userId,
            { 
                ...(username && { username }),
                ...(avatarUrl && { avatar: avatarUrl })
            },
            { new: true }
        ).select('-password -refreshToken');
        
        res.status(200).json(new ApiResponse(200, "Profile updated successfully", user));
    } catch (error) {
        res.status(500).json(new ApiError(500, error.message));
    }
};

module.exports = { signup, login, logout, getProfile, updateProfile };