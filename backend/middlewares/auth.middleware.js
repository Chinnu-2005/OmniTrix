const jwt = require('jsonwebtoken');
const User = require('../models/user');
const ApiError = require('../utils/apiError');

const verifyJWT = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        
        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(error.statusCode || 401).json(new ApiError(error.statusCode || 401, error.message || "Invalid token"));
    }
};

module.exports = { verifyJWT };