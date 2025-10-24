const passport = require('passport');

const User = require('../models/user.models');
const { 
    asyncHandler,
    AppError, 
} = require('../middleware/errorHandler.middleware');
const { 
    generateToken, 
    generateRefreshToken
} = require('../middleware/auth.middleware');

// ============================================
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ============================================
const registerUser = asyncHandler( async (req, res, next) => {
    const { email, password, name } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        throw new AppError('User with this email already exists', 409);
    }

    const user = await User.create({
        email,
        password,
        name, 
    });

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: user.toJSON(),
            token,
            refreshToken,
        },
    });
});

// ============================================
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ============================================
const login = asyncHandler(async (req, res, next) => {
    passport.authenticate('local', { session: true }, (err, user, info) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            throw new AppError(info?.message || "Invalid credentials", 401);            
        }

        const token = generateToken();
        const refreshToken = generateRefreshToken();

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.toJSON(),
                token,
                refreshToken,
            },
        })
    });
});

// ============================================
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
// ============================================
const logout = asyncHandler(async (req, res, next) => {
    res.status(200).json({
        success: true,
		message: "Logout successful",
    });
});

// ============================================
// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
// ============================================
const getProfile = asyncHandler(async (req, res, next) => {
    const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] },
    });

    if ( !user ) {
        throw new AppError("User not found", 404);
    }

    res.status(200).json({
        success: true,
        data: { user },
    });
});