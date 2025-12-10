
// server.js

const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { findUserByEmail, saveNewUser } = require('./database'); // Import DB functions

const app = express();
const PORT = 3000; 
const SALT_ROUNDS = 10; // Standard security level for bcrypt hashing

// --- Middleware Setup ---
app.use(cors()); 
app.use(express.json()); 

// ------------------------------------------------------------------
// 🔑 SIGN UP (REGISTRATION) ROUTE: POST /api/signup
// ------------------------------------------------------------------
app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body;

    // Basic server-side validation
    if (!email || !password || password.length < 8) {
        return res.status(400).json({ success: false, message: 'Invalid data. Password must be at least 8 characters.' });
    }

    // 1. Check if user already exists
    if (findUserByEmail(email)) {
        return res.status(409).json({ success: false, message: 'User already exists with that email address.' });
    }

    try {
        // 2. Hash the password securely
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // 3. Save the new user to the database
        const newUser = saveNewUser(email, passwordHash);
        
        // SUCCESS: Registration complete
        return res.status(201).json({ 
            success: true, 
            message: 'Registration successful! You can now sign in.', 
            user: { id: newUser.id, email: newUser.email }
        });

    } catch (error) {
        console.error('Error during signup:', error);
        return res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
});

// ------------------------------------------------------------------
// 🔓 SIGN IN (LOGIN) ROUTE: POST /api/login
// ------------------------------------------------------------------
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const user = findUserByEmail(email);

    if (!user) {
        // 401 Unauthorized - Hides whether the email or password was wrong
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    try {
        // 1. Compare the plain password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (isMatch) {
            // SUCCESS: Login is valid (In a real app, generate JWT here)
            return res.status(200).json({ 
                success: true, 
                message: 'Login successful!', 
                user: { id: user.id, email: user.email }
            });
        } else {
            // FAIL: Password mismatch
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ success: false, message: 'Server error during authentication.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`   - Sign Up Endpoint: POST /api/signup`);
    console.log(`   - Sign In Endpoint: POST /api/login`);
});