const jwt = require('jsonwebtoken');
const passport = require('passport');
const { User } = require('../models');
const authConfig = require('../config/auth.config');

// Middleware to verify JWT token
const authenticate = (req, res, next) => {
    passport.authenticate( 
        'jwt',
        { session: false },
        (err, user, info) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Authentication error',
                    error: err.message,
                });
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized - Invalid or expired token',
                });
            }

            req.user = user;
            next();
        },
    ); 
};

const optionalAuth = (req, res, next) => {
    passport.authenticate(
        'jwt',
        { session: false },
        (err, user ) => {
            if (user) {
                req.user = user;
            }
            next();
        },
    );
};

const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
    };

    return jwt.sign( 
        payload, 
        authConfig.jwt.secret, 
        {
            expiresIn: authConfig.jwt.expiresIn,
        },
    );
};

const generateRefreshToken = (user) => {
    const payload = {
        id: user.id,
        type: 'refresh',
    };

    return jwt.sign(
        payload,
        authConfig.jwt.refreshSecret,
        {
            expiresIn: authConfig.jwt.refreshExpiresIn,
        },
    );
};

const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(
            token, 
            authConfig.jwt.refreshSecret,
        );
    } catch (error) {
        throw new Error("Invalid refresh token");
    }
};

const generateResetToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        type: 'reset',
    };

    return jwt.sign(
        payload,
        authConfig.jwt.secret,
        {
            expiresIn: "1h",
        },
    );
};

const verifyResetToken = (token) => {
    try {
        const decoded = jwt.verify(
            token,
            authConfig.jwt.secret,
        );

        if (decoded.type !== 'reset') {
            throw new Error("Invalid token type");
        }

        return decoded;
    } catch (error) {
        throw new Error("Invalid or expired reset token");
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Forbidden - You do not have permission to access this resource',
            });
        }

        if (roles.length && !roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: "Forbidden - You do not have permission to access this resource",
            });
        }

        next();
    };
};

module.exports = {
	authenticate,
	optionalAuth,
	generateToken,
	generateRefreshToken,
	verifyRefreshToken,
	generateResetToken,
	verifyResetToken,
	authorize,
};