const passport = require('passport');

const User = require('../models/user.models');
const { asyncHandler, AppError } = require('../middleware/errorHandler.middleware');
const { generateToken, generateRefreshToken, generateResetToken, verifyResetToken } = require('../middleware/auth.middleware');
// const emailService = require("../utils/emailService");

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

// ============================================
// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
// ============================================
const updateProfile = asyncHandler(async (req, res, next) => {
    const { name, email } = req.body;

    const user = await User.findByPk(req.user.id);

    if (user) {
        throw new AppError("User not found", 404);
    }

    if (email && email !== user.email) {
        const existingUser = await User.findByOne({ where: { email } });
        if (existingUser) {
            throw new AppError("Email already in use", 409);
        }
    }

    await user.update({
        name: name || user.name,
        email: email || user.email,
    });

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            user: user.toJSON(),
        },
    });
});

// ============================================
// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
// ============================================
const changePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByEmailWithPassword(req.user.email);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    const isMatch = await User.comparePassword(currentPassword);

    if (!isMatch) {
        throw new AppError("Current password is incorrect", 401);
    }

    await user.update({ password: newPassword });

    res.status(200).json({
        success: true,
        message: 'Password changed successfully',
    });
});

// ============================================
// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
// ============================================
const forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ where: {email} });

    if (user) {
        return res.json({
            success: true,
            message: 'ok',
        });
    }

    const resetToken = generateResetToken(user);

    // send email with reset link here
    // await emailService.sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({
        success: true,
        message: 'Password reset link sent to email',
        ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
});

// ============================================
// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
// ============================================
const resetPassword = asyncHandler(async (req, res, next) => {
    const { token, newPassword } = req.body;

    let decoded;
    try {
        decoded = verifyResetToken(token);
    } catch (error) {
        throw new AppError("Invalid or expired reset token", 400);
    };

    const user = await User.findByPk(decoded.id);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
            token: newToken,
            refreshToken: newRefreshToken,
        },
    });
});

// ============================================
// OAuth Callbacks
// ============================================

// Google OAuth Callback
const googleCallback = asyncHandler(async (req, res, next) => {
	const token = generateToken(req.user);
	const refreshToken = generateRefreshToken(req.user);

	// Redirect to frontend with token
	res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}&refreshToken=${refreshToken}`);
});

// Twitter OAuth Callback
const twitterCallback = asyncHandler(async (req, res, next) => {
	const token = generateToken(req.user);
	const refreshToken = generateRefreshToken(req.user);

	res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}&refreshToken=${refreshToken}`);
});


module.exports = {
	register: registerUser,
	login,
	logout,
	getProfile,
	updateProfile,
	changePassword,
	forgotPassword,
	resetPassword,
	refreshToken,
	googleCallback,
	facebookCallback,
	twitterCallback,
};