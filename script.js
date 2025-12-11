// script.js - Complete frontend authentication

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const loginForm = document.querySelector('.login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const signUpLink = document.querySelector('.signup-link a');
    const googleBtn = document.querySelector('.google-btn');
    const rememberCheckbox = document.getElementById('remember-me-check');

    // API URLs
    const API_BASE = 'http://localhost:3000';
    const LOGIN_API_URL = `${API_BASE}/api/login`;
    const SIGNUP_API_URL = `${API_BASE}/api/signup`;
    const GOOGLE_AUTH_URL = `${API_BASE}/api/auth/google/url`;
    const GOOGLE_VERIFY_URL = `${API_BASE}/api/auth/google`;
    const PROFILE_API_URL = `${API_BASE}/api/profile`;

    // Token storage
    function storeToken(token) {
        if (rememberCheckbox.checked) {
            localStorage.setItem('auth_token', token);
        } else {
            sessionStorage.setItem('auth_token', token);
        }
    }

    function getToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }

    function clearToken() {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
    }

    // Error handling
    function displayError(element, inputElement, message) {
        element.textContent = message;
        inputElement.classList.add('input-error-border');
    }

    function clearErrors() {
        emailError.textContent = '';
        passwordError.textContent = '';
        emailInput.classList.remove('input-error-border');
        passwordInput.classList.remove('input-error-border');
    }

    function isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    // Show success message
    function showSuccess(message) {
        alert(`✅ ${message}`);
    }

    // Show error message
    function showError(message) {
        alert(`❌ ${message}`);
    }

    // Load user profile
    async function loadUserProfile() {
        const token = getToken();
        if (!token) return null;

        try {
            const response = await fetch(PROFILE_API_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.user;
            }
        } catch (error) {
            console.error('Profile load error:', error);
        }
        return null;
    }

    // Update UI for logged in user
    async function updateUIForLoggedInUser() {
        const user = await loadUserProfile();
        if (user) {
            document.querySelector('.welcome-section h2').textContent = `Welcome back, ${user.displayName || user.email.split('@')[0]}!`;
            document.querySelector('.welcome-section p').textContent = 'You are already logged in.';
            
            emailInput.disabled = true;
            passwordInput.disabled = true;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Signed In';
            submitBtn.disabled = true;
            googleBtn.disabled = true;
            
            // Add logout button
            const logoutBtn = document.createElement('button');
            logoutBtn.textContent = 'Logout';
            logoutBtn.className = 'btn primary-btn';
            logoutBtn.style.marginTop = '10px';
            logoutBtn.onclick = () => {
                clearToken();
                location.reload();
            };
            
            loginForm.appendChild(logoutBtn);
        }
    }

    // ========================
    // 🔑 SIGN IN HANDLER
    // ========================
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        clearErrors();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        let isValid = true;
        
        if (email === "") {
            displayError(emailError, emailInput, 'Email address is required.');
            isValid = false;
        } else if (!isValidEmail(email)) {
            displayError(emailError, emailInput, 'Please enter a valid email address.');
            isValid = false;
        }
        
        if (password === "") {
            displayError(passwordError, passwordInput, 'Password is required.');
            isValid = false;
        } else if (password.length < 8) {
            displayError(passwordError, passwordInput, 'Password must be at least 8 characters.');
            isValid = false;
        }
        
        if (!isValid) return;

        try {
            const response = await fetch(LOGIN_API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                storeToken(data.token);
                showSuccess(`Welcome, ${data.user.displayName || data.user.email}!`);
                await updateUIForLoggedInUser();
            } else {
                displayError(passwordError, passwordInput, data.message || 'Invalid credentials.');
                showError(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Network error:', error);
            showError('Cannot connect to the server. Make sure backend is running.');
        }
    });

    // ========================
    // 📝 SIGN UP HANDLER
    // ========================
    signUpLink.addEventListener('click', async (event) => {
        event.preventDefault();
        
        const email = prompt("Enter your email address:");
        if (!email || !isValidEmail(email)) {
            showError('Please enter a valid email address.');
            return;
        }

        const password = prompt("Enter a password (minimum 8 characters):");
        if (!password || password.length < 8) {
            showError('Password must be at least 8 characters long.');
            return;
        }

        const displayName = prompt("Enter your display name (optional):");
        
        try {
            const response = await fetch(SIGNUP_API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    email, 
                    password,
                    displayName: displayName || null
                }),
            });
            
            const data = await response.json();

            if (data.success) {
                showSuccess(data.message);
                // Auto-fill the login form
                emailInput.value = email;
                passwordInput.focus();
                passwordInput.value = '';
            } else {
                showError(data.message);
            }
        } catch (error) {
            console.error('Signup error:', error);
            showError('Registration failed. Please try again.');
        }
    });

    // ========================
    // 🔵 GOOGLE LOGIN HANDLER
    // ========================
    googleBtn.addEventListener('click', async () => {
        try {
            // Get Google OAuth URL from backend
            const response = await fetch(GOOGLE_AUTH_URL);
            const data = await response.json();
            
            if (data.success && data.url) {
                // Open Google OAuth in a popup window
                const width = 500;
                const height = 600;
                const left = (window.screen.width - width) / 2;
                const top = (window.screen.height - height) / 2;
                
                const popup = window.open(
                    data.url,
                    'Google Login',
                    `width=${width},height=${height},top=${top},left=${left}`
                );
                
                // Listen for messages from popup
                window.addEventListener('message', async (event) => {
                    if (event.origin !== window.location.origin) return;
                    
                    if (event.data.type === 'google-auth-success') {
                        const { token, user } = event.data;
                        storeToken(token);
                        showSuccess(`Welcome, ${user.displayName || user.email}!`);
                        await updateUIForLoggedInUser();
                        if (popup) popup.close();
                    }
                });
                
                // Check popup for closure
                const checkPopup = setInterval(() => {
                    if (popup && popup.closed) {
                        clearInterval(checkPopup);
                    }
                }, 500);
                
            } else {
                showError('Google authentication is not configured. Please use email/password login.');
            }
        } catch (error) {
            console.error('Google login error:', error);
            showError('Google login is currently unavailable. Please use email/password login.');
        }
    });

    // Forgot password handler
    document.querySelector('.forgot-password').addEventListener('click', (event) => {
        event.preventDefault();
        const email = prompt("Enter your email to reset password:");
        if (email && isValidEmail(email)) {
            showSuccess(`Password reset instructions sent to ${email} (demo)`);
        }
    });

    // Check existing session on page load
    updateUIForLoggedInUser();
});