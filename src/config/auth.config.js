require('dotenv').config();

module.exports = {
    // JWT Configuration
	jwt: {
		secret: process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this_in_production",
		expiresIn: process.env.JWT_EXPIRE || "7d",
		refreshSecret: process.env.JWT_REFRESH_SECRET || "your_refresh_secret_key",
		refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || "30d",
	},

	// Google OAuth Configuration
	google: {
		clientID: process.env.GOOGLE_CLIENT_ID || "",
		clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
		callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback",
	},

	// Facebook OAuth Configuration
	facebook: {
		clientID: process.env.FACEBOOK_APP_ID || "",
		clientSecret: process.env.FACEBOOK_APP_SECRET || "",
		callbackURL: process.env.FACEBOOK_CALLBACK_URL || "http://localhost:3000/api/auth/facebook/callback",
		profileFields: ["id", "emails", "name", "displayName", "photos"],
	},

	// Twitter (X) OAuth Configuration
	twitter: {
		consumerKey: process.env.TWITTER_CONSUMER_KEY || "",
		consumerSecret: process.env.TWITTER_CONSUMER_SECRET || "",
		callbackURL: process.env.TWITTER_CALLBACK_URL || "http://localhost:3000/api/auth/twitter/callback",
	},

	// Password Reset Configuration
	passwordReset: {
		tokenExpiry: 3600000, // 1 hour in milliseconds
		emailFrom: process.env.EMAIL_FROM || "noreply@newsaggregator.com",
	},

	// Session Configuration (for OAuth)
	session: {
		secret: process.env.SESSION_SECRET || "your_session_secret_key",
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
			maxAge: 24 * 60 * 60 * 1000, // 24 hours
		},
	},
};