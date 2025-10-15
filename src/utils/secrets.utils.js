const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/**
 * Generate cryptographically secure random string
 * @param {number} length - Length in bytes
 * @returns {string} - Hex encoded string
 */
const generateSecret = (length = 64) => {
	return crypto.randomBytes(length).toString("hex");
};

/**
 * Generate base64 encoded secret (for OAuth)
 * @param {number} length - Length in bytes
 * @returns {string} - Base64 encoded string
 */
const generateBase64Secret = (length = 32) => {
	return crypto.randomBytes(length).toString("base64");
};

/**
 * Check if .env file exists, create if not
 */
const ensureEnvFile = () => {
	const envPath = path.join(process.cwd(), ".env");

	if (!fs.existsSync(envPath)) {
		console.log("📝 Creating .env file...");
		fs.writeFileSync(envPath, "# News Aggregator Environment Variables\n\n");
	}

	return envPath;
};

/**
 * Read existing .env file content
 * @param {string} envPath - Path to .env file
 * @returns {string} - File content
 */
const readEnvFile = (envPath) => {
	try {
		return fs.readFileSync(envPath, "utf8");
	} catch (error) {
		return "";
	}
};

/**
 * Update or add environment variable in .env content
 * @param {string} content - Current .env content
 * @param {string} key - Variable name
 * @param {string} value - Variable value
 * @returns {string} - Updated content
 */
const updateEnvVariable = (content, key, value) => {
	const regex = new RegExp(`^${key}=.*$`, "gm");

	if (regex.test(content)) {
		// Update existing variable
		return content.replace(regex, `${key}=${value}`);
	} else {
		// Add new variable
		return content + `${key}=${value}\n`;
	}
};

/**
 * Check if a secret already exists and is valid
 * @param {string} content - .env content
 * @param {string} key - Variable name
 * @returns {boolean} - True if valid secret exists
 */
const hasValidSecret = (content, key) => {
	const regex = new RegExp(`^${key}=(.+)$`, "gm");
	const match = regex.exec(content);

	if (match && match[1]) {
		const value = match[1].trim();
		// Check if secret is at least 32 characters and not a placeholder
		return (
			value.length >= 32 &&
			!value.includes("your_") &&
			!value.includes("change_this") &&
			!value.includes("placeholder")
		);
	}

	return false;
};

/**
 * Generate all required secrets for the project
 * @param {boolean} force - Force regenerate even if secrets exist
 */
const generateAllSecrets = (force = false) => {
	console.log("🔐 News Aggregator Secrets Generator\n");

	// Ensure .env file exists
	const envPath = ensureEnvFile();

	// Read existing content
	let envContent = readEnvFile(envPath);

	// Define all secrets needed
	const secrets = {
		// JWT Secrets
		JWT_SECRET: {
			value: generateSecret(64),
			description: "Main JWT signing secret",
			required: true,
		},
		JWT_REFRESH_SECRET: {
			value: generateSecret(64),
			description: "JWT refresh token secret",
			required: true,
		},

		// Session Secret
		SESSION_SECRET: {
			value: generateSecret(32),
			description: "Express session secret (for OAuth)",
			required: true,
		},

		// Password Reset Token Secret
		PASSWORD_RESET_SECRET: {
			value: generateSecret(32),
			description: "Password reset token secret",
			required: false,
		},

		// API Rate Limiting Secret
		RATE_LIMIT_SECRET: {
			value: generateSecret(16),
			description: "Rate limiting key salt",
			required: false,
		},

		// Encryption Key (for sensitive data)
		ENCRYPTION_KEY: {
			value: generateSecret(32),
			description: "Data encryption key",
			required: false,
		},
	};

	let updated = false;
	const generatedSecrets = [];
	const skippedSecrets = [];

	// Process each secret
	for (const [key, config] of Object.entries(secrets)) {
		const exists = hasValidSecret(envContent, key);

		if (!exists || force) {
			envContent = updateEnvVariable(envContent, key, config.value);
			generatedSecrets.push({
				key,
				value: config.value,
				description: config.description,
			});
			updated = true;
		} else {
			skippedSecrets.push({
				key,
				description: config.description,
			});
		}
	}

	// Add section headers if content is new
	if (!envContent.includes("# JWT Configuration")) {
		envContent = addSectionHeaders(envContent);
	}

	// Write updated content back to file
	if (updated) {
		fs.writeFileSync(envPath, envContent);
		console.log("✅ Secrets generated and saved to .env file\n");
	} else {
		console.log("ℹ️  All secrets already exist in .env file\n");
	}

	// Display results
	if (generatedSecrets.length > 0) {
		console.log("🔑 Generated Secrets:");
		console.log("━".repeat(60));
		generatedSecrets.forEach(({ key, value, description }) => {
			console.log(`\n${key}`);
			console.log(`  Description: ${description}`);
			console.log(`  Value: ${value.substring(0, 32)}...`);
		});
		console.log("\n" + "━".repeat(60));
	}

	if (skippedSecrets.length > 0) {
		console.log("\n⏭️  Skipped (already exists):");
		skippedSecrets.forEach(({ key, description }) => {
			console.log(`  • ${key} - ${description}`);
		});
	}

	// Security warnings
	console.log("\n⚠️  SECURITY REMINDERS:");
	console.log("  1. Never commit .env file to version control");
	console.log("  2. Add .env to .gitignore");
	console.log("  3. Use different secrets for production");
	console.log("  4. Rotate secrets periodically");
	console.log("  5. Keep backups of production secrets securely\n");

	return generatedSecrets;
};

/**
 * Add organized section headers to .env content
 * @param {string} content - Current .env content
 * @returns {string} - Content with headers
 */
const addSectionHeaders = (content) => {
	// Only add if not already present
	if (!content.includes("# JWT Configuration")) {
		content += "\n# ============================================\n";
		content += "# JWT Configuration\n";
		content += "# ============================================\n";
	}

	if (!content.includes("# Session Configuration")) {
		content += "\n# ============================================\n";
		content += "# Session Configuration\n";
		content += "# ============================================\n";
	}

	return content;
};

/**
 * Validate existing secrets in .env file
 * @returns {Object} - Validation results
 */
const validateSecrets = () => {
	console.log("🔍 Validating existing secrets...\n");

	const envPath = path.join(process.cwd(), ".env");

	if (!fs.existsSync(envPath)) {
		console.log("❌ No .env file found!");
		return { valid: false, missing: ["all"], weak: [], errors: [] };
	}

	const envContent = readEnvFile(envPath);
	const requiredSecrets = [
		"JWT_SECRET",
		"JWT_REFRESH_SECRET",
		"SESSION_SECRET",
	];

	const results = {
		valid: true,
		missing: [],
		weak: [],
		errors: [],
	};

	requiredSecrets.forEach((key) => {
		if (!hasValidSecret(envContent, key)) {
			results.missing.push(key);
			results.valid = false;
		} else {
			// Check strength
			const regex = new RegExp(`^${key}=(.+)$`, "gm");
			const match = regex.exec(envContent);
			if (match && match[1] && match[1].trim().length < 64) {
				results.weak.push(key);
			}
		}
	});

	// Display results
	if (results.valid && results.weak.length === 0) {
		console.log("✅ All secrets are valid and strong!\n");
	} else {
		if (results.missing.length > 0) {
			console.log("❌ Missing secrets:");
			results.missing.forEach((key) => console.log(`  • ${key}`));
			console.log("");
		}

		if (results.weak.length > 0) {
			console.log("⚠️  Weak secrets (less than 64 chars):");
			results.weak.forEach((key) => console.log(`  • ${key}`));
			console.log("");
		}
	}

	return results;
};

/**
 * Generate secrets for specific environment
 * @param {string} env - Environment (development, production, test)
 */
const generateForEnvironment = (env = "development") => {
	console.log(`🌍 Generating secrets for: ${env.toUpperCase()}\n`);

	const envPath = path.join(process.cwd(), `.env.${env}`);
	const content = `# News Aggregator - ${env.toUpperCase()} Environment\n\n`;

	fs.writeFileSync(envPath, content);

	// Generate secrets specific to environment
	const secrets = generateAllSecrets();

	console.log(`\n✅ Secrets generated in .env.${env}`);

	return secrets;
};

/**
 * Backup existing .env file
 */
const backupEnvFile = () => {
	const envPath = path.join(process.cwd(), ".env");

	if (!fs.existsSync(envPath)) {
		console.log("ℹ️  No .env file to backup");
		return null;
	}

	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	const backupPath = path.join(process.cwd(), `.env.backup.${timestamp}`);

	fs.copyFileSync(envPath, backupPath);
	console.log(`📦 Backup created: ${backupPath}\n`);

	return backupPath;
};

// ============================================
// CLI Commands
// ============================================

/**
 * Main function - handles CLI arguments
 */
const main = () => {
	const args = process.argv.slice(2);
	const command = args[0];

	switch (command) {
		case "generate":
		case "gen":
			generateAllSecrets(false);
			break;

		case "force":
		case "regenerate":
			console.log(
				"⚠️  Regenerating ALL secrets (this will replace existing ones)\n"
			);
			backupEnvFile();
			generateAllSecrets(true);
			break;

		case "validate":
		case "check":
			validateSecrets();
			break;

		case "backup":
			backupEnvFile();
			break;

		case "env":
			const env = args[1] || "development";
			generateForEnvironment(env);
			break;

		case "help":
		case "--help":
		case "-h":
			console.log(`
📚 News Aggregator Secrets Generator

Usage:
  node src/utils/secrets.utils.js [command]

Commands:
  generate, gen         Generate missing secrets (safe, keeps existing)
  force, regenerate     Regenerate ALL secrets (creates backup first)
  validate, check       Check if all required secrets exist
  backup               Create backup of current .env file
  env [environment]    Generate secrets for specific environment
  help                 Show this help message

Examples:
  node src/utils/secrets.utils.js generate
  node src/utils/secrets.utils.js validate
  node src/utils/secrets.utils.js env production

💡 Tip: Run 'generate' first time, then 'validate' to check secrets
			`);
			break;

		default:
			console.log('Run "node src/utils/secrets.utils.js help" for usage\n');
			generateAllSecrets(false);
	}
};

// Run if called directly
if (require.main === module) {
	main();
}

// Export functions for use in other modules
module.exports = {
	generateSecret,
	generateBase64Secret,
	generateAllSecrets,
	validateSecrets,
	backupEnvFile,
	generateForEnvironment,
};
