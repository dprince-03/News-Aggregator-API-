const { body, param, query, validationResult } = require("express-validator");

const validate  = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation errors",
            errors: errors.array().map((err) => ({
                field: err.path || err.param,
                message: err.msg,
            })),
        });
    }

    next();
};

const registerValidation = [
    body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

    body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters long'),

    validate,
];

const logionValidation = [
    body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

    body('password')
    .notEmpty()
    .withMessage('Password is required'),

    validate,
];

const changePasswordValidation = [
    body('currectPassword')
    .notEmpty()
    .withMessage('Current password is required'),

    body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

    body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom(
        (value, { req }) => {
			if (value !== req.body.newPassword) {
				throw new Error("Passwords do not match");
			}
			return true;
		}
    ),

    validate,
];

const resetPasswordValidation = [
	body("email")
	.trim()
	.isEmail()
	.withMessage("Please provide a valid email address")
	.normalizeEmail(),

    validate,
];