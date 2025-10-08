require('dotenv').config();
const { Sequelize } = require('sequelize');

// Create Sequelize instance
const sequelize = new Sequelize(
	process.env.DB_NAME || "news_aggregator",
	process.env.DB_USER || "root",
	process.env.DB_PASSWORD || "",
	{
		host: process.env.DB_HOST || "localhost",
		port: process.env.DB_PORT || 3306,
		dialect: "mysql",
		logging: process.env.NODE_ENV === "development" ? console.log : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 60000,
            idle: 10000,
        },
        define: {
            timestamps: true,
            underscored: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
        timestamps: '+01:00',
	}
);

let isConnected = false; 
let connectionRetries = 0;
const MAX_RETRIES = 3;

// test database connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        isConnected = true;
        connectionRetries = 0;
        console.log('✅ Sequelize connected to MySQL successfully!');

        return true;
    } catch (error) {
        isConnected = false;
        connectionRetries++;
        console.error(`❌ Database connection test failed (attempt ${connectionRetries}): ${error.message}`);
        
        if (connectionRetries < MAX_RETRIES) {
            console.log(`🔄 Retrying connection in 5 seconds...`);
            setTimeout(testConnection, 5000);
        }
        console.error(`❌ Unable to connect to database: ${error.message}`);
        
        return false;   
    };
};

/**
 * Get connection status
 */
const getConnectionStatus = () => {
    return {
        isConnected,
        connectionRetries,
        canConnect: isConnected && connectionRetries < MAX_RETRIES
    };
};

/**
 * Health check - more comprehensive than testConnection
 */
const healthCheck = async () => {
    try {
        // Test basic connection
        await sequelize.authenticate();
        
        // Test query execution
        const [results] = await sequelize.query('SELECT NOW() as current_time, @@version as mysql_version');
        
        // Check pool status
        const poolStatus = sequelize.connectionManager.pool;
        
        return {
            status: 'healthy',
            database: 'connected',
            timestamp: new Date(),
            mysqlVersion: results[0].mysql_version,
            pool: {
                using: poolStatus.using,
                available: poolStatus.available,
                max: poolStatus.max,
                min: poolStatus.min
            }
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            database: 'disconnected',
            timestamp: new Date(),
            error: error.message
        };
    };
};

/**
 * Initialize database connection with retry logic
 */
const initializeDatabase = async (maxRetries = 3, retryInterval = 5000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`🔄 Database connection attempt ${attempt}/${maxRetries}...`);
        
        const connected = await testConnection();
        if (connected) {
            console.log('🎉 Database initialized successfully!');
            return true;
        }
        
        if (attempt < maxRetries) {
            console.log(`⏳ Retrying in ${retryInterval / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryInterval));
        }
    };
    
    console.error('💥 Failed to initialize database after all retries');
    return false;
};

// Sync all models with database
const syncDatabase = async (options = { alter: false, force: false }) => {
    if (!isConnected) {
        console.error('❌ Cannot sync database - no active connection');
        return false;
    }
    
    try {
        console.log('🔄 Synchronizing database models...');
        await sequelize.sync(options);
        console.log("✅ Database synchronized successfully");
        return true;
    } catch (error) {
        console.error("❌ Database sync failed:", error.message);
        return false;
    };
};

// Gracefully close database connection
const closeConnection = async () => {
	try {
		await sequelize.close();
		console.log("✅ Sequelize connection closed successfully");
	} catch (error) {
		console.error("❌ Error closing connection:", error.message);
	};
};

// Event listeners for connection management
sequelize.addHook('afterDisconnect', () => {
    isConnected = false;
    console.log('🔌 Database connection disconnected');
});

sequelize.addHook('afterConnect', () => {
    isConnected = true;
    console.log('🔌 Database connection established');
});

module.exports = {
	sequelize,
	testConnection,
	initializeDatabase,
	getConnectionStatus,
	healthCheck,
	syncDatabase,
	closeConnection,
	isConnected: () => isConnected,
};