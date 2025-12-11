// ============================================
// CLOUD NATIVE AUTHENTICATION SERVER
// Complete Backend with Login, Signup & Google Auth
// ============================================

require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

// Import database and authentication modules
const { findUserByEmail, saveNewUser, findOrCreateGoogleUser } = require('./database');
const { generateToken, authenticateToken } = require('./auth');
const { getGoogleAuthUrl, verifyGoogleToken, getGoogleTokens } = require('./googleAuth');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================
// MIDDLEWARE SETUP
// ========================
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from current directory
app.use(express.static(__dirname));

// ========================
// API HEALTH CHECK
// ========================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Cloud Native Authentication API',
        version: '1.0.0',
        endpoints: {
            signup: 'POST /api/signup',
            login: 'POST /api/login',
            googleAuth: 'POST /api/auth/google',
            googleAuthUrl: 'GET /api/auth/google/url',
            googleCallback: 'GET /api/auth/google/callback',
            profile: 'GET /api/profile (protected)',
            health: 'GET /api/health'
        }
    });
});

// ========================
// GOOGLE AUTH ROUTES
// ========================

// Get Google OAuth URL
app.get('/api/auth/google/url', (req, res) => {
    try {
        const authUrl = getGoogleAuthUrl();
        res.json({
            success: true,
            url: authUrl
        });
    } catch (error) {
        console.error('❌ Google auth URL error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate Google auth URL'
        });
    }
});

// Google OAuth callback
app.get('/api/auth/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Authorization code is required'
            });
        }

        // Exchange code for tokens and user info
        const googleData = await getGoogleTokens(code);
        
        if (!googleData) {
            return res.status(401).json({
                success: false,
                message: 'Failed to authenticate with Google'
            });
        }

        const { userInfo } = googleData;
        
        // Find or create user
        const user = findOrCreateGoogleUser(
            userInfo.sub,
            userInfo.email,
            userInfo.name
        );

        // Generate JWT token
        const token = generateToken(user);

        console.log(`✅ Google auth successful: ${userInfo.email}`);

        // For frontend - redirect with token
        const frontendUrl = `http://localhost:${PORT}`;
        const redirectHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Google Auth Success</title>
                <script>
                    window.opener.postMessage({
                        type: 'google-auth-success',
                        token: '${token}',
                        user: ${JSON.stringify({
                            id: user.id,
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: userInfo.picture || null
                        })}
                    }, '${frontendUrl}');
                    window.close();
                </script>
            </head>
            <body>
                <p>Authentication successful! You can close this window.</p>
            </body>
            </html>
        `;

        res.send(redirectHtml);

    } catch (error) {
        console.error('❌ Google callback error:', error);
        res.status(500).send(`
            <html>
            <body>
                <h1>Authentication Failed</h1>
                <p>${error.message}</p>
                <button onclick="window.close()">Close</button>
            </body>
            </html>
        `);
    }
});

// Alternative: Verify Google ID token directly
app.post('/api/auth/google', async (req, res) => {
    console.log('🔵 Google auth request received');
    
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: 'Google ID token is required'
            });
        }

        // Verify Google token
        const googleUser = await verifyGoogleToken(idToken);
        
        if (!googleUser) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Google token'
            });
        }

        // Find or create user
        const user = findOrCreateGoogleUser(
            googleUser.googleId,
            googleUser.email,
            googleUser.displayName
        );

        // Generate JWT token
        const token = generateToken(user);

        console.log(`✅ Google auth successful: ${googleUser.email}`);

        // Return success response
        return res.json({
            success: true,
            message: 'Google authentication successful!',
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                photoURL: googleUser.picture || null
            },
            token: token
        });

    } catch (error) {
        console.error('❌ Google auth error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to authenticate with Google',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ========================
// 🟢 SIGNUP ENDPOINT
// ========================
app.post('/api/signup', async (req, res) => {
    console.log('📝 Signup request received:', req.body.email);
    
    try {
        const { email, password, displayName } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Password strength validation
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            });
        }

        // Check if user already exists
        const existingUser = findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = saveNewUser(email, passwordHash, null, displayName);

        // Generate JWT token
        const token = generateToken(newUser);

        console.log(`✅ User registered: ${email}`);

        // Return success response
        return res.status(201).json({
            success: true,
            message: 'Registration successful! You can now sign in.',
            user: {
                id: newUser.id,
                email: newUser.email,
                displayName: newUser.displayName,
                createdAt: newUser.createdAt
            },
            token: token
        });

    } catch (error) {
        console.error('❌ Signup error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ========================
// 🔵 LOGIN ENDPOINT
// ========================
app.post('/api/login', async (req, res) => {
    console.log('🔐 Login attempt for:', req.body.email);
    
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const user = findUserByEmail(email);
        if (!user) {
            console.log(`❌ Login failed: User not found - ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user has password (not Google-only user)
        if (!user.passwordHash) {
            return res.status(401).json({
                success: false,
                message: 'Please sign in with Google or reset your password'
            });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            console.log(`❌ Login failed: Invalid password for - ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(user);

        console.log(`✅ Login successful: ${email}`);

        // Return success response
        return res.json({
            success: true,
            message: 'Login successful!',
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName
            },
            token: token
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ========================
// 🔒 PROTECTED ROUTES
// ========================

// Get user profile (protected)
app.get('/api/profile', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Profile retrieved successfully',
        user: req.user,
        timestamp: new Date().toISOString()
    });
});

// Get all users (admin only - for demo)
app.get('/api/users', authenticateToken, (req, res) => {
    const { getAllUsers } = require('./database');
    const users = getAllUsers();
    
    res.json({
        success: true,
        message: 'Users retrieved successfully',
        users: users,
        count: users.length,
        timestamp: new Date().toISOString()
    });
});

// ========================
// 🆘 PASSWORD RESET (DEMO)
// ========================
app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required'
        });
    }

    const user = findUserByEmail(email);
    if (!user) {
        // Don't reveal if user exists (security)
        return res.json({
            success: true,
            message: 'If an account exists with this email, a reset link has been sent'
        });
    }

    // In a real app, send email with reset token
    console.log(`📧 Password reset requested for: ${email}`);
    
    res.json({
        success: true,
        message: 'Password reset instructions have been sent to your email (demo)'
    });
});

// ========================
// 📄 SERVE FRONTEND
// ========================

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve CSS file
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'style.css'));
});

// Serve JavaScript file
app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'script.js'));
});

// ========================
// 🚀 START SERVER
// ========================
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 CLOUD NATIVE AUTHENTICATION SERVER');
    console.log('='.repeat(50));
    console.log(`📡 Server URL: http://localhost:${PORT}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
    console.log('📝 Available Endpoints:');
    console.log(`   🔓 GET  /                          - Serve frontend`);
    console.log(`   🩺 GET  /api/health               - Health check`);
    console.log(`   🟢 POST /api/signup               - User registration`);
    console.log(`   🔵 POST /api/login                - User login`);
    console.log(`   🔵 GET  /api/auth/google/url      - Google auth URL`);
    console.log(`   🔵 GET  /api/auth/google/callback - Google callback`);
    console.log(`   🟡 POST /api/auth/google          - Google auth (ID token)`);
    console.log(`   🔒 GET  /api/profile              - Protected user profile`);
    console.log(`   🔐 GET  /api/users                - Protected users list`);
    console.log(`   🆘 POST /api/forgot-password      - Password reset`);
    console.log('='.repeat(50));
    console.log('💡 Frontend: Open http://localhost:3000 in your browser');
    console.log('💾 Database: Using in-memory storage (persists via localStorage)');
    console.log('='.repeat(50));
});

// Handle server errors
app.on('error', (error) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try a different port:`);
        console.error(`1. Change PORT in .env file`);
        console.error(`2. Or run: PORT=3001 npm start`);
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Server shutting down...');
    process.exit(0);
});