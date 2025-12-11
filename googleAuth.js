// googleAuth.js - Google OAuth integration

const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// Validate Google OAuth credentials
if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn('⚠️  Google OAuth credentials not configured');
    console.warn('   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file');
    console.warn('   Get credentials from: https://console.cloud.google.com/apis/credentials');
}

const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Generate Google OAuth URL
function getGoogleAuthUrl() {
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ];
    
    return client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        include_granted_scopes: true
    });
}

// Verify Google ID token
async function verifyGoogleToken(idToken) {
    try {
        if (!CLIENT_ID) {
            throw new Error('Google OAuth not configured');
        }

        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        return {
            googleId: payload.sub,
            email: payload.email,
            emailVerified: payload.email_verified,
            displayName: payload.name,
            picture: payload.picture
        };
    } catch (error) {
        console.error('Google token verification error:', error);
        return null;
    }
}

// Exchange code for tokens
async function getGoogleTokens(code) {
    try {
        if (!CLIENT_ID || !CLIENT_SECRET) {
            throw new Error('Google OAuth credentials not configured');
        }

        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);
        
        // Get user info
        const userInfoResponse = await client.request({
            url: 'https://www.googleapis.com/oauth2/v3/userinfo'
        });
        
        return {
            tokens,
            userInfo: userInfoResponse.data
        };
    } catch (error) {
        console.error('Error getting Google tokens:', error);
        return null;
    }
}

module.exports = {
    getGoogleAuthUrl,
    verifyGoogleToken,
    getGoogleTokens
};