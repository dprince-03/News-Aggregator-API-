# Passport.js Authentication - Complete Explanation

## What is Passport.js?

**Passport.js** is an authentication middleware for Node.js. It's like a security guard that checks if users are who they claim to be.

Think of it as a **universal authentication system** that supports:
- Username/password login
- JWT tokens for APIs
- Social logins (Google, Facebook, Twitter)

---

## Why Do We Need Multiple Strategies?

We use different **strategies** because users can log in different ways:

```
┌─────────────────────────────────────────────┐
│         Your News Aggregator API            │
├─────────────────────────────────────────────┤
│                                             │
│  Strategy 1: Local (Email/Password)         │
│  Strategy 2: JWT (API Token)                │
│  Strategy 3: Google OAuth                   │
│  Strategy 4: Facebook OAuth                 │
│  Strategy 5: Twitter OAuth                  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Strategy 1: JWT Strategy (For API Authentication)

### Purpose:
Authenticate users who send a JWT token in their request headers.

### How it Works:

```javascript
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: authConfig.jwt.secret,
};
```

**Step-by-step flow:**

```
1. User logs in → Gets JWT token
2. User makes API request with token in header:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
3. Passport extracts the token from header
4. Verifies token using secret key
5. Decodes token to get user ID
6. Fetches user from database
7. Attaches user to req.user
```

**Code Breakdown:**

```javascript
passport.use(
  "jwt",  // Strategy name
  new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      // jwtPayload contains: { id, email, name }
      const user = await User.findByPk(jwtPayload.id);

      if (!user) {
        return done(null, false);  // No user found
      }

      return done(null, user);  // Success! User found
    } catch (error) {
      return done(error, false);  // Database error
    }
  })
);
```

**Token Payload Example:**
```json
{
  "id": 5,
  "email": "john@example.com",
  "name": "John Doe",
  "iat": 1704067200,  // Issued at
  "exp": 1704672000   // Expires at
}
```

---

## Strategy 2: Local Strategy (Email/Password)

### Purpose:
Authenticate users with email and password.

### How it Works:

```
1. User submits: { email: "john@example.com", password: "password123" }
2. Passport finds user by email
3. Compares password with hashed password in database
4. If match → Success! Returns user
5. If no match → Returns error
```

**Code Breakdown:**

```javascript
passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email",      // Use 'email' instead of 'username'
      passwordField: "password",   // Field name for password
    },
    async (email, password, done) => {
      try {
        // Step 1: Find user by email
        const user = await User.findByEmailWithPassword(email);

        if (!user) {
          // User doesn't exist
          return done(null, false, { 
            message: "Invalid email or password" 
          });
        }

        // Step 2: Compare passwords
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
          // Password is wrong
          return done(null, false, { 
            message: "Invalid email or password" 
          });
        }

        // Step 3: Success!
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);
```

**Usage in Controller:**

```javascript
passport.authenticate("local", { session: false }, (err, user, info) => {
  if (!user) {
    throw new Error(info.message);  // "Invalid email or password"
  }
  
  // Generate JWT token
  const token = generateToken(user);
  res.json({ token, user });
});
```

---

## Strategy 3: Google OAuth Strategy

### Purpose:
Allow users to sign in with their Google account.

### The OAuth Flow:

```
┌─────────┐       ┌──────────────┐       ┌────────┐       ┌──────────┐
│ User    │       │ Your API     │       │ Google │       │ Database │
└────┬────┘       └──────┬───────┘       └───┬────┘       └────┬─────┘
     │                   │                   │                  │
     │ 1. Click "Login   │                   │                  │
     │    with Google"   │                   │                  │
     ├──────────────────>│                   │                  │
     │                   │                   │                  │
     │                   │ 2. Redirect to    │                  │
     │                   │    Google login   │                  │
     │                   ├──────────────────>│                  │
     │                   │                   │                  │
     │ 3. User logs in   │                   │                  │
     │    on Google      │                   │                  │
     ├───────────────────────────────────────>│                  │
     │                   │                   │                  │
     │ 4. Google sends   │                   │                  │
     │    user data back │                   │                  │
     │<──────────────────┴───────────────────┤                  │
     │                   │                   │                  │
     │                   │ 5. Save/find user │                  │
     │                   │    in database    │                  │
     │                   ├───────────────────────────────────────>│
     │                   │                   │                  │
     │                   │ 6. Return user    │                  │
     │                   │<───────────────────────────────────────┤
     │                   │                   │                  │
     │ 7. Generate JWT   │                   │                  │
     │    and redirect   │                   │                  │
     │<──────────────────┤                   │                  │
```

**Code Breakdown:**

```javascript
passport.use(
  new GoogleStrategy(
    {
      clientID: "your-google-client-id.apps.googleusercontent.com",
      clientSecret: "your-secret",
      callbackURL: "http://localhost:3000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      // profile contains Google user data:
      // {
      //   id: "1234567890",
      //   displayName: "John Doe",
      //   emails: [{ value: "john@gmail.com" }],
      //   photos: [{ value: "https://..." }]
      // }

      try {
        // Check if user already exists
        let user = await User.findOne({
          where: { email: profile.emails[0].value },
        });

        if (!user) {
          // Create new user
          user = await User.create({
            email: profile.emails[0].value,
            name: profile.displayName,
            password: Math.random().toString(36).slice(-8), // Random
            google_id: profile.id,
            profile_picture: profile.photos[0]?.value,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);
```

**What happens:**
1. User clicks "Login with Google"
2. Redirects to Google login page
3. User logs in on Google
4. Google sends user profile to your callback
5. You check if user exists in your database
6. If not, create new user
7. Return user to your app with JWT token

---

## Strategy 4: Facebook OAuth

### Purpose:
Allow users to sign in with Facebook.

**Similar to Google, but Facebook-specific:**

```javascript
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "http://localhost:3000/api/auth/facebook/callback",
      profileFields: ["id", "emails", "name", "displayName", "photos"],
    },
    async (accessToken, refreshToken, profile, done) => {
      // Facebook profile data
      // {
      //   id: "facebook-user-id",
      //   displayName: "John Doe",
      //   emails: [{ value: "john@example.com" }]
      // }

      // Same logic as Google: find or create user
      let user = await User.findOne({
        where: { email: profile.emails[0].value },
      });

      if (!user) {
        user = await User.create({
          email: profile.emails[0].value,
          name: profile.displayName,
          facebook_id: profile.id,
          // ... other fields
        });
      }

      return done(null, user);
    }
  )
);
```

---

## Strategy 5: Twitter OAuth

### Purpose:
Allow users to sign in with Twitter/X.

**Important Note:** Twitter doesn't always provide email!

```javascript
passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: "http://localhost:3000/api/auth/twitter/callback",
      includeEmail: true,  // Request email (user must approve)
    },
    async (token, tokenSecret, profile, done) => {
      // Twitter might not give email
      const email = profile.emails?.[0]?.value || 
                    `${profile.username}@twitter.placeholder`;

      // Find or create user
      let user = await User.findOne({ where: { email } });

      if (!user) {
        user = await User.create({
          email,
          name: profile.displayName,
          twitter_id: profile.id,
        });
      }

      return done(null, user);
    }
  )
);
```

---

## Serialize & Deserialize (For Sessions)

### What is this?

When using OAuth, we need **sessions** to remember users between redirects.

```javascript
// Serialize: Save user ID to session
passport.serializeUser((user, done) => {
  done(null, user.id);  // Store only ID in session
});

// Deserialize: Get full user from database using ID
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);  // Attach full user to req.user
  } catch (error) {
    done(error, null);
  }
});
```

**Why?**
- Sessions store minimal data (just user ID)
- When needed, fetch full user from database
- Keeps session storage small

---

## How to Use in Routes

### 1. Protect Route with JWT:

```javascript
router.get("/protected", 
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    // req.user is available here
    res.json({ user: req.user });
  }
);
```

### 2. Login with Local Strategy:

```javascript
router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user) => {
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const token = generateToken(user);
    res.json({ token, user });
  })(req, res, next);
});
```

### 3. OAuth Login:

```javascript
// Step 1: Redirect to Google
router.get("/google",
  passport.authenticate("google", { 
    scope: ["profile", "email"],
    session: false 
  })
);

// Step 2: Handle callback
router.get("/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // req.user contains the user
    const token = generateToken(req.user);
    res.redirect(`http://frontend.com/auth?token=${token}`);
  }
);
```

---

## Complete Request Flow Example

### Example 1: API Request with JWT

```
1. User has token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

2. Makes request:
   GET /api/articles
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

3. Passport extracts token from header
4. Verifies token with secret key
5. Decodes: { id: 5, email: "john@example.com" }
6. Finds user with id=5 in database
7. Attaches user to req.user
8. Your controller accesses req.user
```

### Example 2: Google Login

```
1. User clicks "Login with Google" button
2. Frontend redirects to: GET /api/auth/google
3. Backend redirects to Google login page
4. User logs in on Google
5. Google redirects back with code
6. Passport exchanges code for user profile
7. Backend finds/creates user in database
8. Generates JWT token
9. Redirects to frontend with token
10. Frontend stores token and uses for API requests
```

---

## Common Issues & Solutions

### Issue 1: "Strategy not found"
**Solution:** Make sure you imported and initialized passport:
```javascript
const passport = require("./config/passport.config");
app.use(passport.initialize());
```

### Issue 2: OAuth not working
**Solution:** Check:
- Callback URLs match in OAuth provider settings
- Client ID and Secret are correct in .env
- Session middleware is initialized

### Issue 3: JWT not working
**Solution:** Check:
- Token is sent in Authorization header
- Token format: "Bearer YOUR_TOKEN"
- Secret key matches between token generation and verification

---

## Summary

| Strategy | When to Use | Returns |
|----------|-------------|---------|
| **JWT** | API requests with token | User from database |
| **Local** | Email/password login | User if credentials valid |
| **Google** | Google social login | User from Google profile |
| **Facebook** | Facebook social login | User from Facebook profile |
| **Twitter** | Twitter social login | User from Twitter profile |

**Key Concepts:**
- **Strategy** = Way to authenticate (password, token, OAuth)
- **done(null, user)** = Success, return user
- **done(null, false)** = Fail, no user found
- **done(error)** = Error occurred
- **req.user** = Currently authenticated user