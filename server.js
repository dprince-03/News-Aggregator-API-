require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const { contentSecurityPolicy, default: helmet } = require('helmet');

const { testConnection, closeConnection } = require('./src/config/db.config');


const app = express();
const PORT = process.env.PORT || 5080

app.set('trust-proxy', 1); // trust first proxy if behind a proxy like Nginx

// ========================
//      MIDDLEWARES
// ========================
const corsConfig = {
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5000', 'http://localhost:5080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
};

const limiter = rateLimit({
    windowMs: 15 + 60 * 1000, // 15 minutes
    max: 100,
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
});

const helmetConfig = {
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			styleSrce: ["'self'", "https:", "'unsafe-inline'"],
			scriptSrc: ["'self'", "https:", "'unsafe-inline'"],
			imgSrc: ["'self'", "data:", "https:"],
			connectSrc: ["'self'", "https:"],
			fontSrc: ["'self'", "https:", "data:"],
			objectSrc: ["'none'"],
			upgradeInsecureRequests: [],
		},
	},
};

// ✅ Temporary debug middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    console.log('Body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    next();
}); // remove later

app.use(cors(corsConfig));
app.use(helmet(helmetConfig));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

// ========================
//      ROUTES
// ========================
// health check
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'News Aggregator API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        // environment: process.env.NODE_ENV || 'development',
    });
});

// ========================
//      ERROR HANDLING
// ========================
// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Resource not found',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(`Error ${err}`);
    
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: err.name && err.message,
        stack: err.stack,
    });
});

// ========================
//      SERVER SETUP
// ========================
const start_server = async () => {
    try {
        console.log('');
        console.log('='.repeat(50));
        console.log("🚀 Starting News Aggregator API...");
        console.log('='.repeat(50));
        console.log('');

        // Initialize database
        const dbconnect = await testConnection();
        if (!dbconnect) {
            console.error("❌ Failed to connect to database");
            console.error("Please check your database configuration in .env file");
            process.exit(1);
        }

        const server = app.listen(PORT, () => {
            console.log('');
            console.log('='.repeat(50));
            console.log(`✅ Server is running on port ${PORT}`);
            console.log(`✅ API URL: http://localhost:${PORT}/api`);
            console.log('='.repeat(50));
            console.log('');
            console.log('📡 Server Information:');
            console.log(`   Base URL:        http://localhost:${PORT}`);
            console.log(`   API URL:         http://localhost:${PORT}/api`);
            console.log('');

            console.log('💡 Tips:');
            console.log('   - Use Postman or curl to test the API');
            console.log('   - Check /api for complete endpoint list');
            console.log('');
            console.log('='.repeat(50));
            console.log('       Press CTRL+C to stop the server         ');
            console.log('='.repeat(50));
            console.log('');

        });

        const shutdown = async (signal) => {
            console.log('');
            console.log('='.repeat(50));
            console.log(`⚠️  ${signal} received. Shutting down gracefully...`);
            console.log('='.repeat(50));

            server.close(async () => {
                console.log('');
                console.log('✅ HTTP server closed');
                
                // Close database connections
                console.log('🔄 Closing database connections...');
                await closeConnection();

                console.log('✅ All connections closed');
                console.log('');
                console.log('👋 Goodbye!');
                console.log('');
                process.exit(0);
            });

            // Force close after 10 seconds
            setTimeout(() => {
            console.error('');
            console.error('⚠️  Forcing server shutdown after timeout...');
            console.error('');
            process.exit(1);
            }, 10000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // Handle uncaught exceptions
        process.on('uncaughtException', (err) => {
            console.error('');
            console.error('❌ Uncaught Exception:', err);
            console.error('');
            shutdown('UNCAUGHT_EXCEPTION');
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('');
            console.error('❌ Unhandled Rejection at:', promise);
            console.error('❌ Reason:', reason);
            console.error('');
            shutdown('UNHANDLED_REJECTION');
        });
        
    } catch (error) {
        console.error('');
        console.error('='.repeat(60));
        console.error('❌ Failed to start server');
        console.error('='.repeat(60));
        console.error('');
        console.error('Error:', error.message);
        console.error('');
        process.exit(1);
    }
};

start_server();