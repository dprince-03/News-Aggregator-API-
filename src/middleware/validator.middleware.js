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

const loginValidation = [
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

const forgotPasswordValidation = [
	body("email")
	.trim()
	.isEmail()
	.withMessage("Please provide a valid email address")
	.normalizeEmail(),

    validate,
];

const resetPasswordValidation = [
    body('token')
    .notEmpty()
    .withMessage('Reset token is required'),

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

const updateProfileValidation = [
    body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters long'),

    body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

    body('profile_picture')
    .optional()
    .isURL()
    .withMessage('Profile picture must be a valid URL'),

    validate,
];

// Article Search Validation
const searchArticlesValidation = [
	query("q").optional().trim().isLength({ min: 2 }).withMessage("Search query must be at least 2 characters"),
	query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
	query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
	validate,
];

// Article Filter Validation
const filterArticlesValidation = [
	query("source").optional().trim(),
	query("category").optional().trim(),
	query("author").optional().trim(),
	query("startDate").optional().isISO8601().withMessage("Start date must be a valid date"),
	query("endDate").optional().isISO8601().withMessage("End date must be a valid date"),
	query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
	query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
	validate,
];

// Preference Update Validation
const updatePreferenceValidation = [
	body("preferred_sources")
		.optional()
		.isArray()
		.withMessage("Preferred sources must be an array")
		.custom((value) => {
			if (value.some((item) => typeof item !== "string")) {
				throw new Error("All sources must be strings");
			}
			return true;
		}),
	body("preferred_categories")
		.optional()
		.isArray()
		.withMessage("Preferred categories must be an array")
		.custom((value) => {
			if (value.some((item) => typeof item !== "string")) {
				throw new Error("All categories must be strings");
			}
			return true;
		}),
	body("preferred_authors")
		.optional()
		.isArray()
		.withMessage("Preferred authors must be an array")
		.custom((value) => {
			if (value.some((item) => typeof item !== "string")) {
				throw new Error("All authors must be strings");
			}
			return true;
		}),
	validate,
];

// ID Parameter Validation
const idParamValidation = [param("id").isInt().withMessage("ID must be a valid integer"), validate];

module.exports = {
	validate,
	registerValidation,
	loginValidation,
	changePasswordValidation,
	forgotPasswordValidation,
	resetPasswordValidation,
	updateProfileValidation,
	searchArticlesValidation,
	filterArticlesValidation,
	updatePreferenceValidation,
	idParamValidation,
};