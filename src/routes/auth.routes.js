const express = require("express");
const passport = require('passport');

const { registerValidation, loginValidation, updateProfileValidation, changePasswordValidation, forgotPasswordValidation, resetPasswordValidation } = require("../middleware/validator.middleware");
const { register, login, logout, getProfile, updateProfile, changePassword, forgotPassword, resetPassword, refreshToken, googleCallback, facebookCallback, twitterCallback } = require("../controllers/auth.controllers");
const { authenticate } = require("../middleware/auth.middleware");

const authRouter = express.Router();

authRouter.post('/register', registerValidation, register);

authRouter.post('/login', loginValidation, login);

authRouter.post('/logout', authenticate, logout);

authRouter.get('/me', authenticate, getProfile);

authRouter.put('/profile', authenticate, updateProfileValidation, updateProfile);

authRouter.put('/change-password', authenticate, changePasswordValidation, changePassword);

authRouter.post('/forget-password', forgotPasswordValidation, forgotPassword);

authRouter.post('/reset-password', resetPasswordValidation, resetPassword);

authRouter.post('/refresh-token', refreshToken);

// ============================================
// Google OAuth Routes
// ============================================
authRouter.get('/google', passport.authenticate('google', { scope: ['proflie', 'email'], session: false, }));

authRouter.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }, googleCallback));


// ============================================
// Facebook OAuth Routes
// ============================================
authRouter.get('/facebook', passport.authenticate('facebook', { scope: ['email'], session: false}));

authRouter.get('/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: '/login' }, facebookCallback));

// ============================================
// Twitter OAuth Routes
// ============================================
authRouter.get('/twitter', passport.authenticate('twitter', { session: false, }));

authRouter.get('/twitter/callback', passport.authenticate('twitter', { session: false, failureRedirect: '/login' }), twitterCallback);


module.exports = authRouter;