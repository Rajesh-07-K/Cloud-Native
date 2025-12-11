// googleAuth.js - Fixed Google OAuth integration
const { OAuth2Client } = require('google-auth-library');

// Create OAuth2 client with proper configuration
let client = null;

function initializeGoogleAuth() {
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

    console.log('🔧 Initializing Google OAuth...');
    console.log(`   Client ID: ${CLIENT_ID ? '✓ Set' : '✗ Missing'}`);
    console.log(`   Client Secret: ${CLIENT_SECRET ? '✓ Set' : '✗ Missing'}`);
    console.log(`   Redirect URI: ${REDIRECT_URI || 'Not set'}`);

    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error('❌ Google OAuth credentials missing!');
        console.error('   Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file');
        console.error('   Get credentials from: https://console.cloud.google.com/apis/credentials');
        return null;
    }

    try {
        client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
        console.log('✅ Google OAuth initialized successfully');
        return client;
    } catch (error) {
        console.error('❌ Failed to initialize Google OAuth:', error.message);
        return null;
    }
}

// Generate Google OAuth URL
function getGoogleAuthUrl() {
    if (!client) {
        if (!initializeGoogleAuth()) {
            throw new Error('Google OAuth not configured');
        }
    }

    const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid'
    ];
    
    return client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        include_granted_scopes: true
    });
}

// Exchange code for tokens
async function getGoogleTokens(code) {
    try {
        if (!client) {
            if (!initializeGoogleAuth()) {
                throw new Error('Google OAuth not configured');
            }
        }

        console.log('🔄 Exchanging authorization code for tokens...');
        const { tokens } = await client.getToken(code);
        
        client.setCredentials(tokens);
        console.log('✅ Tokens obtained successfully');

        // Get user info
        console.log('🔄 Fetching user info from Google...');
        const userInfoResponse = await client.request({
            url: 'https://www.googleapis.com/oauth2/v3/userinfo'
        });
        
        console.log('✅ User info obtained:', userInfoResponse.data.email);
        return {
            tokens,
            userInfo: userInfoResponse.data
        };
    } catch (error) {
        console.error('❌ Error getting Google tokens:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
}

// Verify Google ID token
async function verifyGoogleToken(idToken) {
    try {
        if (!client) {
            if (!initializeGoogleAuth()) {
                throw new Error('Google OAuth not configured');
            }
        }

        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        console.log('✅ Google token verified for:', payload.email);
        
        return {
            googleId: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified,
            displayName: payload.name || payload.email.split('@')[0],
            picture: payload.picture,
            locale: payload.locale
        };
    } catch (error) {
        console.error('❌ Google token verification error:', error.message);
        throw error;
    }
}

// Initialize on module load
initializeGoogleAuth();

module.exports = {
    getGoogleAuthUrl,
    verifyGoogleToken,
    getGoogleTokens,
    initializeGoogleAuth
};