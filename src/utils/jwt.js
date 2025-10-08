const crypto = require("crypto");
const fs = require("fs");

// Read existing .env file
let envContent = "";
if (fs.existsSync(".env")) {
	envContent = fs.readFileSync(".env", "utf8");
}

// Remove existing secrets
envContent = envContent.replace(/JWT_SECRET=.*\n/g, "");
envContent = envContent.replace(/INITIAL_SETUP_KEY=.*\n/g, "");

// Generate new secrets
const secrets = {
	JWT_SECRET: crypto.randomBytes(64).toString("hex"),
	INITIAL_SETUP_KEY: crypto.randomBytes(32).toString("hex"),
};

// Add new secrets
envContent += `\n# Auto-generated secrets\n`;
envContent += `JWT_SECRET=${secrets.JWT_SECRET}\n`;
envContent += `INITIAL_SETUP_KEY=${secrets.INITIAL_SETUP_KEY}\n`;

// Write back to .env
fs.writeFileSync(".env", envContent);

console.log("✅ Secrets generated and added to .env file:");
console.log(`🔐 JWT_SECRET: ${secrets.JWT_SECRET.substring(0, 20)}...`);
console.log(`🔑 SETUP_KEY: ${secrets.INITIAL_SETUP_KEY.substring(0, 20)}...`);
