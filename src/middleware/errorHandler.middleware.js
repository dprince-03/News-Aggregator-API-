const errorHandler = (err, req, res, next) => {
    console.error(`Error: ${err}`);

    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    if (err.name === "SequelizeValidationError") {
        statusCode = 400;
        message = "Validation errors occurred";
        const errors = err.errors.map((e) => ({
            field: e.path,
            message: e.message,
        }));

        return res.status(statusCode).json({
            success: false,
            message,
            errors,
        });
    }

    if (err.name === "SequelizeUniqueConstraintError") {
        statusCode = 409;
        message = "Duplicate entry error";
        const errors = err.errors[0]?.path || 'unknown';

        return res.status(statusCode).json({
            success: false,
            message: `${field} already exists`,
            field,
        });
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
        statusCode = 400;
        message = 'Invalid reference - Related resource does not exist';

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }

    if (err.name === 'SequelizeDatabaseError') {
        statusCode = 500;
        message = 'Database error occurred';
        
        return res.status(statusCode).json({
            success: false,
            message,
            error: process.env.NODE_ENV === "development" ? err.message : undefined,
        });
    }

    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token has expired';

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }

    if (err.name === 'MulterError') {
        statusCode = 400;
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File size is too large';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
           message = 'Too many files uploaded';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = 'Unexpected file field';
        } else {
            message = 'File upload error';
        }

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }

    if (err.name === 'castError') {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;

        return res.status(statusCode).json({
            success: false,
            message,
        });
    }

    if (err.isOperational) {
        return res.status(statusCode).json({
            success: false,
            message,
           ...(err.data && { data: err.data }),
        });
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "development" && { 
            stack: err.stack, 
            error: err,
        }),
    });    
};

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

class AppError extends Error {
    constructor(message, statusCode, isOperational = true, data = null) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.data = data;
        Error.captureStackTrace(this, this.constructor);
    };
};

module.exports = {
    errorHandler,
    notFound,
    asyncHandler,
    AppError,
};