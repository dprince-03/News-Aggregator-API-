# 1. GOOGLE OAUTH:

- Go to: https://console.cloud.google.com/
- Create a new project or select existing
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth client ID"
- Choose "Web application"
- Add authorized redirect URI: http://localhost:3000/api/auth/google/callback
- Copy Client ID and Client Secret to .env

# 2. FACEBOOK OAUTH:

- Go to: https://developers.facebook.com/
- Create a new app or select existing
- Go to "Settings" > "Basic"
- Copy App ID and App Secret to .env
- Add OAuth Redirect URI in Facebook Login settings

# 3. TWITTER OAUTH:

- Go to: https://developer.twitter.com/
- Create a new app in the Developer Portal
- Go to "Keys and tokens"
- Generate API Key and API Secret Key
- Enable 3-legged OAuth in app settings
- Add callback URL: http://localhost:3000/api/auth/twitter/callback

# **- Copy keys to .env**

1. Generate secrets (first time setup):

   node src/utils/secrets.utils.js generate



2. Validate existing secrets:

   node src/utils/secrets.utils.js validate



3. Regenerate all secrets (with backup):

   node src/utils/secrets.utils.js force



4. Generate for production:

   node src/utils/secrets.utils.js env production



5. Create backup:

   node src/utils/secrets.utils.js backup



6. Use in code:

   const { generateSecret } = require('./utils/secrets.utils');

   const mySecret = generateSecret(32);
