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
const { getGoogleAuthUrl, getGoogleTokens } = require('./googleAuth');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================
// MIDDLEWARE SETUP
// ========================
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
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
            googleAuthUrl: 'GET /api/auth/google/url',
            googleCallback: 'GET /api/auth/google/callback',
            profile: 'GET /api/profile',
            health: 'GET /api/health',
            test: 'GET /api/auth/test'
        }
    });
});

// ========================
// GOOGLE AUTH ROUTES
// ========================

// Test Google OAuth configuration
app.get('/api/auth/test', (req, res) => {
    const isConfigured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
    
    res.json({
        success: isConfigured,
        message: isConfigured ? 'Google OAuth is configured' : 'Google OAuth not configured',
        configured: isConfigured,
        clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback',
        instructions: isConfigured ? 'Ready to use' : 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file'
    });
});

// Get Google OAuth URL
app.get('/api/auth/google/url', (req, res) => {
    try {
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            return res.status(500).json({
                success: false,
                message: 'Google OAuth not configured',
                instructions: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file'
            });
        }

        const authUrl = getGoogleAuthUrl();
        res.json({
            success: true,
            url: authUrl
        });
    } catch (error) {
        console.error('❌ Google auth URL error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate Google auth URL',
            error: error.message
        });
    }
});

// Google OAuth callback
app.get('/api/auth/google/callback', async (req, res) => {
    console.log('🔵 Google OAuth callback received');
    console.log('Query parameters:', req.query);
    
    try {
        const { code, error, state } = req.query;
        
        if (error) {
            console.error('❌ Google returned error:', error);
            return res.send(`
                <html>
                <head>
                    <title>Authentication Failed</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                            padding: 50px;
                            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
                            color: white;
                        }
                        .container {
                            background: white;
                            color: #333;
                            padding: 40px;
                            border-radius: 10px;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                            max-width: 500px;
                            margin: 0 auto;
                        }
                        h1 { color: #ff4444; }
                        button {
                            background: #ff4444;
                            color: white;
                            border: none;
                            padding: 12px 30px;
                            border-radius: 5px;
                            font-size: 16px;
                            cursor: pointer;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>❌ Authentication Failed</h1>
                        <p><strong>Error:</strong> ${error}</p>
                        <p>Please try again or contact support.</p>
                        <button onclick="window.close()">Close Window</button>
                    </div>
                </body>
                </html>
            `);
        }
        
        if (!code) {
            console.error('❌ No authorization code received');
            return res.send(`
                <html>
                <body>
                    <h1>Authentication Failed</h1>
                    <p>No authorization code received from Google</p>
                    <button onclick="window.close()">Close Window</button>
                </body>
                </html>
            `);
        }

        console.log('🔄 Exchanging authorization code for tokens...');
        
        // Exchange code for tokens and get user info
        const googleData = await getGoogleTokens(code);
        
        if (!googleData) {
            throw new Error('Failed to exchange authorization code');
        }

        const { userInfo } = googleData;
        console.log('✅ User authenticated:', userInfo.email);
        
        // Find or create user in our database
        const user = findOrCreateGoogleUser(
            userInfo.sub,
            userInfo.email,
            userInfo.name || userInfo.email.split('@')[0]
        );

        // Generate JWT token for our app
        const token = generateToken(user);

        console.log(`✅ Google auth successful for: ${user.email}`);
        console.log('Generated JWT token');

        // Send HTML response that communicates with opener window
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Authentication Successful</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    }
                    .success-container {
                        background: white;
                        border-radius: 15px;
                        padding: 40px;
                        text-align: center;
                        box-shadow: 0 15px 35px rgba(0,0,0,0.2);
                        max-width: 450px;
                        width: 90%;
                    }
                    .success-icon {
                        font-size: 60px;
                        color: #4CAF50;
                        margin-bottom: 20px;
                    }
                    h1 {
                        color: #333;
                        margin-bottom: 10px;
                    }
                    p {
                        color: #666;
                        line-height: 1.6;
                        margin-bottom: 25px;
                    }
                    .user-info {
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: 8px;
                        margin: 20px 0;
                        text-align: left;
                    }
                    .user-info p {
                        margin: 5px 0;
                        color: #555;
                    }
                    button {
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 14px 35px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        width: 100%;
                    }
                    button:hover {
                        background: #45a049;
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    }
                    .auto-close {
                        font-size: 14px;
                        color: #888;
                        margin-top: 15px;
                    }
                </style>
                <script>
                    // Send success message to the opener window (the main login page)
                    try {
                        const message = {
                            type: 'google-auth-success',
                            token: '${token}',
                            user: ${JSON.stringify({
                                id: user.id,
                                email: user.email,
                                displayName: user.displayName,
                                photoURL: userInfo.picture || null
                            })}
                        };
                        
                        console.log('Sending message to opener:', message);
                        
                        // Send to parent window
                        if (window.opener && !window.opener.closed) {
                            window.opener.postMessage(message, '*');
                        }
                        
                        // Also try to send to the specific origin
                        window.opener?.postMessage(message, window.location.origin);
                        
                        // Auto-close after 2 seconds
                        setTimeout(() => {
                            console.log('Auto-closing window...');
                            window.close();
                        }, 2000);
                        
                    } catch (error) {
                        console.error('Error sending message:', error);
                    }
                    
                    // Manual close function
                    function closeWindow() {
                        window.close();
                    }
                </script>
            </head>
            <body>
                <div class="success-container">
                    <div class="success-icon">✅</div>
                    <h1>Welcome, ${user.displayName}!</h1>
                    <p>You have successfully authenticated with Google.</p>
                    
                    <div class="user-info">
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Name:</strong> ${user.displayName}</p>
                    </div>
                    
                    <p>This window will close automatically in a few seconds...</p>
                    
                    <button onclick="closeWindow()">Close Window Now</button>
                    
                    <p class="auto-close">If the window doesn't close automatically, click the button above.</p>
                </div>
            </body>
            </html>
        `;

        res.send(html);

    } catch (error) {
        console.error('❌ Google callback error:', error);
        console.error('Error details:', error.message);
        
        const html = `
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 40px;
                        text-align: center;
                        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
                        color: white;
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                    }
                    .error-container {
                        background: white;
                        color: #333;
                        padding: 40px;
                        border-radius: 10px;
                        max-width: 500px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    }
                    h1 { color: #ff4444; }
                    .error-details {
                        background: #ffebee;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 20px 0;
                        text-align: left;
                        font-family: monospace;
                        font-size: 14px;
                    }
                    button {
                        background: #ff4444;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h1>❌ Authentication Error</h1>
                    <p>Something went wrong during authentication.</p>
                    
                    <div class="error-details">
                        <strong>Error:</strong> ${error.message}
                    </div>
                    
                    <p>Please try again or contact support if the problem persists.</p>
                    
                    <button onclick="window.close()">Close Window</button>
                </div>
            </body>
            </html>
        `;
        
        res.send(html);
    }
});

// Alternative Google authentication endpoint (for access token)
app.post('/api/auth/google', async (req, res) => {
    console.log('🔵 Google token auth request');
    
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({
                success: false,
                message: 'Access token is required'
            });
        }

        // In a real implementation, you would verify the access token
        // For now, we'll use a simplified approach
        
        // Get user info using the access token
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!userInfoResponse.ok) {
            throw new Error('Invalid access token');
        }
        
        const userInfo = await userInfoResponse.json();
        
        // Find or create user
        const user = findOrCreateGoogleUser(
            userInfo.sub,
            userInfo.email,
            userInfo.name || userInfo.email.split('@')[0]
        );

        // Generate JWT token
        const token = generateToken(user);

        console.log(`✅ Google token auth successful: ${userInfo.email}`);

        res.json({
            success: true,
            message: 'Google authentication successful!',
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                photoURL: userInfo.picture || null
            },
            token: token
        });

    } catch (error) {
        console.error('❌ Google token auth error:', error);
        res.status(401).json({
            success: false,
            message: 'Google authentication failed',
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
        res.status(201).json({
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
        res.status(500).json({
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
        res.json({
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
        res.status(500).json({
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
        users: users.map(u => ({
            id: u.id,
            email: u.email,
            displayName: u.displayName,
            createdAt: u.createdAt
        })),
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

// Serve any other static files
app.get('/:filename', (req, res) => {
    const filename = req.params.filename;
    const allowedFiles = ['cloud_icon.png', 'google_btn.png', 'cloud_graphic.png'];
    
    if (allowedFiles.includes(filename)) {
        res.sendFile(path.join(__dirname, filename));
    } else {
        res.status(404).send('File not found');
    }
});

// ========================
// 🚀 START SERVER
// ========================
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 CLOUD NATIVE AUTHENTICATION SERVER');
    console.log('='.repeat(50));
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
    console.log('📝 Available Endpoints:');
    console.log(`   🔓 GET  /                          - Frontend login page`);
    console.log(`   🩺 GET  /api/health               - Health check`);
    console.log(`   🟢 POST /api/signup               - User registration`);
    console.log(`   🔵 POST /api/login                - User login`);
    console.log(`   🔵 GET  /api/auth/google/url      - Google OAuth URL`);
    console.log(`   🔵 GET  /api/auth/google/callback - Google OAuth callback`);
    console.log(`   🟡 POST /api/auth/google          - Google token auth`);
    console.log(`   🔒 GET  /api/profile              - User profile (protected)`);
    console.log(`   🔐 GET  /api/users                - All users (protected)`);
    console.log(`   🆘 POST /api/forgot-password      - Password reset`);
    console.log(`   🔧 GET  /api/auth/test           - Test Google OAuth config`);
    console.log('='.repeat(50));
    
    // Check Google OAuth configuration
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.log('⚠️  Google OAuth NOT CONFIGURED');
        console.log('   To enable Google Sign-In:');
        console.log('   1. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file');
        console.log('   2. Get credentials from: https://console.cloud.google.com/apis/credentials');
    } else {
        console.log('✅ Google OAuth is configured');
    }
    
    console.log('='.repeat(50));
    console.log('💡 Open http://localhost:3000 in your browser to test');
    console.log('='.repeat(50));
});

// Handle server errors
app.on('error', (error) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try:`);
        console.error(`   PORT=3001 npm start`);
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Server shutting down...');
    process.exit(0);
});