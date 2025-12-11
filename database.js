// database.js
let users = [];
let nextId = 1;

// Load from localStorage if in browser environment
if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('cloud_native_users');
    if (stored) {
        users = JSON.parse(stored);
        nextId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    }
}

function saveToStorage() {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('cloud_native_users', JSON.stringify(users));
    }
}

function findUserByEmail(email) {
    return users.find(user => user.email === email);
}

function saveNewUser(email, passwordHash, googleId = null, displayName = null) {
    const newUser = {
        id: nextId++,
        email,
        passwordHash,
        googleId,
        displayName: displayName || email.split('@')[0],
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveToStorage();
    return newUser;
}

function findOrCreateGoogleUser(googleId, email, displayName) {
    // Check if exists with Google ID
    let user = users.find(u => u.googleId === googleId);
    if (user) return user;
    
    // Check if exists with email
    user = users.find(u => u.email === email);
    if (user) {
        user.googleId = googleId;
        user.displayName = displayName || user.displayName;
        saveToStorage();
        return user;
    }
    
    // Create new user
    return saveNewUser(email, null, googleId, displayName);
}

function getAllUsers() {
    return users.map(user => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt
    }));
}

module.exports = {
    findUserByEmail,
    saveNewUser,
    findOrCreateGoogleUser,
    getAllUsers
};