// userDetails.js - Store additional user details
let userDetails = [];

// Load from localStorage if available
if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('cloud_native_user_details');
    if (stored) {
        userDetails = JSON.parse(stored);
    }
}

function saveUserDetails(userId, details) {
    const existingIndex = userDetails.findIndex(detail => detail.userId === userId);
    
    if (existingIndex >= 0) {
        userDetails[existingIndex] = { userId, ...details };
    } else {
        userDetails.push({ userId, ...details });
    }
    
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('cloud_native_user_details', JSON.stringify(userDetails));
    }
}

function getUserDetails(userId) {
    return userDetails.find(detail => detail.userId === userId) || null;
}

module.exports = {
    saveUserDetails,
    getUserDetails
};