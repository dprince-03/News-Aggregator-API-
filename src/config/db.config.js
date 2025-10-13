require("dotenv").config();
const { Sequelize } = require("sequelize");

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
			underscored: true, // Use snake_case for column names
			createdAt: "created_at",
			updatedAt: "updated_at",
		},
		timezone: "+01:00", // Adjust to your timezone
	}
);

// Test database connection
const testConnection = async () => {
	try {
		await sequelize.authenticate();
		console.log("✅ Sequelize connected to MySQL successfully!");

		// Test a simple query
		const [results] = await sequelize.query("SELECT 1 as test");
		console.log("✅ Database query test successful:", results[0]);

		return true;
	} catch (error) {
		console.error("❌ Unable to connect to database:", error.message);
		return false;
	}
};

// Sync all models with database (use cautiously in production)
const syncDatabase = async (options = {}) => {
	try {
		await sequelize.sync(options);
		console.log("✅ Database synchronized successfully");
		return true;
	} catch (error) {
		console.error("❌ Database sync failed:", error.message);
		return false;
	}
};

// Gracefully close database connection
const closeConnection = async () => {
	try {
		await sequelize.close();
		console.log("✅ Sequelize connection closed successfully");
	} catch (error) {
		console.error("❌ Error closing connection:", error.message);
	}
};

module.exports = {
	sequelize,
	testConnection,
	syncDatabase,
	closeConnection,
};