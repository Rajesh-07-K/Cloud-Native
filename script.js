// script.js - Complete Frontend Authentication
// Cloud Native Authentication System

document.addEventListener('DOMContentLoaded', () => {
    // ========================
    // DOM ELEMENTS
    // ========================
    const loginForm = document.querySelector('.login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const signUpLink = document.querySelector('.signup-link a');
    const googleBtn = document.querySelector('.google-btn');
    const rememberCheckbox = document.getElementById('remember-me-check');
    const forgotPasswordLink = document.querySelector('.forgot-password');

    // ========================
    // API CONFIGURATION
    // ========================
    const API_BASE = 'http://localhost:3000';
    const API_ENDPOINTS = {
        health: `${API_BASE}/api/health`,
        login: `${API_BASE}/api/login`,
        signup: `${API_BASE}/api/signup`,
        googleAuthUrl: `${API_BASE}/api/auth/google/url`,
        googleCallback: `${API_BASE}/api/auth/google/callback`,
        googleTokenAuth: `${API_BASE}/api/auth/google`,
        profile: `${API_BASE}/api/profile`,
        forgotPassword: `${API_BASE}/api/forgot-password`,
        authTest: `${API_BASE}/api/auth/test`
    };

    // ========================
    // AUTH STATE MANAGEMENT
    // ========================
    function storeToken(token) {
        if (rememberCheckbox.checked) {
            localStorage.setItem('auth_token', token);
            localStorage.setItem('remember_me', 'true');
        } else {
            sessionStorage.setItem('auth_token', token);
            localStorage.removeItem('remember_me');
        }
    }

    function getToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }

    function clearToken() {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('remember_me');
    }

    function isLoggedIn() {
        return !!getToken();
    }

    // ========================
    // UI HELPER FUNCTIONS
    // ========================
    function showLoading(element) {
        const originalText = element.textContent;
        element.innerHTML = '<span class="spinner"></span> Loading...';
        element.disabled = true;
        return originalText;
    }

    function hideLoading(element, originalText) {
        element.textContent = originalText;
        element.disabled = false;
    }

    function showSuccess(message) {
        // Create success toast
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `
            <span>✅</span>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function showError(message) {
        // Create error toast
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `
            <span>❌</span>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    function displayError(element, inputElement, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
        if (inputElement) {
            inputElement.classList.add('input-error-border');
        }
    }

    function clearErrors() {
        // Clear all error messages
        [emailError, passwordError].forEach(el => {
            if (el) {
                el.textContent = '';
                el.style.display = 'none';
            }
        });
        
        // Remove error borders
        [emailInput, passwordInput].forEach(input => {
            if (input) {
                input.classList.remove('input-error-border');
            }
        });
    }

    function isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    // ========================
    // USER PROFILE MANAGEMENT
    // ========================
    async function loadUserProfile() {
        const token = getToken();
        if (!token) return null;

        try {
            const response = await fetch(API_ENDPOINTS.profile, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.user;
            } else {
                // Token might be expired
                clearToken();
                return null;
            }
        } catch (error) {
            console.error('Profile load error:', error);
            return null;
        }
    }

    async function updateUIForLoggedInUser() {
        const user = await loadUserProfile();
        if (user) {
            // Update welcome message
            const welcomeTitle = document.querySelector('.welcome-section h2');
            const welcomeSubtitle = document.querySelector('.welcome-section p');
            
            if (welcomeTitle) {
                welcomeTitle.textContent = `Welcome back, ${user.displayName || user.email.split('@')[0]}!`;
            }
            
            if (welcomeSubtitle) {
                welcomeSubtitle.textContent = 'You are already logged in.';
            }
            
            // Disable form inputs
            emailInput.disabled = true;
            passwordInput.disabled = true;
            
            // Update login button
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.textContent = '✓ Signed In';
            submitBtn.disabled = true;
            
            // Disable Google button
            googleBtn.disabled = true;
            googleBtn.textContent = 'Already Signed In';
            
            // Add logout button if not already present
            if (!document.getElementById('logout-btn')) {
                const logoutBtn = document.createElement('button');
                logoutBtn.id = 'logout-btn';
                logoutBtn.textContent = 'Logout';
                logoutBtn.className = 'btn logout-btn';
                logoutBtn.style.cssText = `
                    background: #ff4444;
                    color: white;
                    margin-top: 15px;
                    border: none;
                    padding: 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                    width: 100%;
                    transition: background-color 0.3s;
                `;
                
                logoutBtn.onclick = async () => {
                    clearToken();
                    showSuccess('Logged out successfully');
                    setTimeout(() => location.reload(), 1000);
                };
                
                loginForm.appendChild(logoutBtn);
            }
            
            return true;
        }
        return false;
    }

    // ========================
    // FORM VALIDATION
    // ========================
    function validateLoginForm() {
        clearErrors();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        let isValid = true;
        
        // Email validation
        if (!email) {
            displayError(emailError, emailInput, 'Email address is required.');
            isValid = false;
        } else if (!isValidEmail(email)) {
            displayError(emailError, emailInput, 'Please enter a valid email address.');
            isValid = false;
        }
        
        // Password validation
        if (!password) {
            displayError(passwordError, passwordInput, 'Password is required.');
            isValid = false;
        } else if (password.length < 8) {
            displayError(passwordError, passwordInput, 'Password must be at least 8 characters.');
            isValid = false;
        }
        
        return isValid;
    }

    // ========================
    // LOGIN FORM HANDLER
    // ========================
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        if (!validateLoginForm()) return;
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = showLoading(submitBtn);
        
        try {
            const response = await fetch(API_ENDPOINTS.login, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                storeToken(data.token);
                showSuccess(`Welcome, ${data.user.displayName || data.user.email}!`);
                
                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);
            } else {
                displayError(passwordError, passwordInput, data.message || 'Invalid credentials.');
                showError(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Cannot connect to the server. Make sure backend is running on port 3000.');
        } finally {
            hideLoading(submitBtn, originalText);
        }
    });

    // ========================
    // SIGN UP HANDLER (REDIRECT TO SIGNUP PAGE)
    // ========================
    signUpLink.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = 'signup.html';
    });

    // ========================
    // GOOGLE AUTHENTICATION - FIXED
    // ========================
    googleBtn.addEventListener('click', async () => {
        console.log('Google Sign-In clicked');
        
        // First, check if Google OAuth is configured
        try {
            const testResponse = await fetch(API_ENDPOINTS.authTest);
            const testData = await testResponse.json();
            
            if (!testData.configured) {
                showError('Google Sign-In is not configured on the server.');
                console.log('Google OAuth status:', testData);
                return;
            }
            
            console.log('Google OAuth is configured:', testData);
        } catch (error) {
            showError('Cannot check server configuration. Make sure backend is running.');
            return;
        }
        
        // Get Google OAuth URL
        try {
            const response = await fetch(API_ENDPOINTS.googleAuthUrl);
            const data = await response.json();
            
            if (!data.success) {
                showError(data.message || 'Failed to get Google authentication URL.');
                return;
            }
            
            console.log('Opening Google OAuth URL:', data.url);
            
            // Open Google OAuth in a popup window
            const width = 600;
            const height = 700;
            const left = (window.screen.width - width) / 2;
            const top = (window.screen.height - height) / 2;
            
            const popup = window.open(
                data.url,
                'Google Login',
                `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes,status=yes`
            );
            
            if (!popup) {
                showError('Popup blocked! Please allow popups for this site and try again.');
                return;
            }
            
            // Show loading state on button
            const originalText = googleBtn.textContent;
            googleBtn.innerHTML = '<span class="spinner"></span> Waiting for Google...';
            googleBtn.disabled = true;
            
            // Listen for messages from the popup
            const messageHandler = async (event) => {
                console.log('Received message from popup:', event.data);
                
                // Accept messages from any origin for now (can be restricted later)
                if (event.data && event.data.type === 'google-auth-success') {
                    console.log('Google auth success received:', event.data);
                    
                    const { token, user } = event.data;
                    
                    // Store the token
                    storeToken(token);
                    
                    // Restore button
                    googleBtn.textContent = originalText;
                    googleBtn.disabled = false;
                    
                    // Show success message
                    showSuccess(`Welcome, ${user.displayName || user.email}!`);
                    
                    // Redirect to dashboard after 2 seconds
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 2000);
                    
                    // Close the popup
                    if (popup && !popup.closed) {
                        popup.close();
                    }
                    
                    // Remove event listener
                    window.removeEventListener('message', messageHandler);
                    clearInterval(popupCheckInterval);
                }
            };
            
            window.addEventListener('message', messageHandler);
            
            // Check if popup is closed
            const popupCheckInterval = setInterval(() => {
                if (popup.closed) {
                    console.log('Popup closed by user');
                    
                    // Restore button
                    googleBtn.textContent = originalText;
                    googleBtn.disabled = false;
                    
                    // Remove event listener
                    window.removeEventListener('message', messageHandler);
                    clearInterval(popupCheckInterval);
                    
                    // Check if user logged in during popup
                    if (isLoggedIn()) {
                        // Redirect to dashboard if logged in
                        setTimeout(() => {
                            window.location.href = '/dashboard';
                        }, 500);
                    }
                }
            }, 500);
            
            // Auto-restore button after 30 seconds
            setTimeout(() => {
                if (googleBtn.disabled) {
                    googleBtn.textContent = originalText;
                    googleBtn.disabled = false;
                }
            }, 30000);
            
        } catch (error) {
            console.error('Google auth error:', error);
            showError('Failed to start Google authentication. Please try again.');
            googleBtn.textContent = 'Sign in with Google';
            googleBtn.disabled = false;
        }
    });

    // ========================
    // FORGOT PASSWORD HANDLER
    // ========================
    forgotPasswordLink.addEventListener('click', async (event) => {
        event.preventDefault();
        
        const email = prompt("Enter your email address to reset password:");
        if (!email || !isValidEmail(email)) {
            showError('Please enter a valid email address.');
            return;
        }
        
        try {
            const response = await fetch(API_ENDPOINTS.forgotPassword, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showSuccess(data.message);
            } else {
                showError(data.message || 'Failed to send reset instructions.');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            showError('Network error. Please try again.');
        }
    });

    // ========================
    // LISTEN FOR GOOGLE AUTH MESSAGES
    // ========================
    // This handles messages from the Google OAuth callback page
    window.addEventListener('message', (event) => {
        // Accept messages from any origin (for development)
        if (event.data && event.data.type === 'google-auth-success') {
            console.log('Received Google auth success from message event:', event.data);
            
            const { token, user } = event.data;
            
            // Store the token
            storeToken(token);
            
            // Show success message
            showSuccess(`Welcome, ${user.displayName || user.email}!`);
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        }
    });

    // ========================
    // INITIALIZATION
    // ========================
    async function initialize() {
        console.log('Initializing Cloud Native Authentication...');
        
        // Check server health
        try {
            const response = await fetch(API_ENDPOINTS.health);
            if (response.ok) {
                console.log('✅ Backend server is running');
            } else {
                console.warn('⚠️ Backend server may not be running');
                showError('Backend server is not responding. Make sure server.js is running on port 3000.');
            }
        } catch (error) {
            console.error('❌ Cannot connect to backend:', error);
            showError('Cannot connect to authentication server. Run: npm run dev');
        }
        
        // Check if user is already logged in
        const isRemembered = localStorage.getItem('remember_me') === 'true';
        if (isRemembered && isLoggedIn()) {
            // Redirect directly to dashboard if already logged in
            window.location.href = '/dashboard';
        }
        
        // Set up remember me checkbox
        if (rememberCheckbox) {
            rememberCheckbox.checked = isRemembered;
        }
    }

    // Start the application
    initialize();
});

// Add CSS for toasts and spinners
const style = document.createElement('style');
style.textContent = `
    /* Toast notifications */
    .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1000;
        transform: translateX(100%);
        opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        max-width: 350px;
    }
    
    .toast.show {
        transform: translateX(0);
        opacity: 1;
    }
    
    .toast.success {
        background: #4CAF50;
        border-left: 4px solid #2E7D32;
    }
    
    .toast.error {
        background: #f44336;
        border-left: 4px solid #c62828;
    }
    
    /* Loading spinner */
    .spinner {
        display: inline-block;
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s linear infinite;
        vertical-align: middle;
        margin-right: 8px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    /* Error states */
    .input-error-border {
        border-color: #ff4444 !important;
        box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.1) !important;
    }
    
    /* Disabled state */
    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);