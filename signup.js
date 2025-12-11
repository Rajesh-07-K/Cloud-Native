// signup.js - Complete Signup Functionality
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    
    // API Configuration
    const API_BASE = 'http://localhost:3000';
    const API_ENDPOINTS = {
        signup: `${API_BASE}/api/signup`,
        login: `${API_BASE}/api/login`,
        health: `${API_BASE}/api/health`
    };

    // Show/Hide Loading Functions
    function showLoading(element) {
        const originalText = element.textContent;
        element.innerHTML = '<span class="spinner"></span> Processing...';
        element.disabled = true;
        return originalText;
    }

    function hideLoading(element, originalText) {
        element.textContent = originalText;
        element.disabled = false;
    }

    // Toast Notification Functions
    function showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `
            <span>✅</span>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `
            <span>❌</span>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Display error for specific field
    function displayError(element, inputElement, message) {
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
        if (inputElement) {
            inputElement.classList.add('input-error-border');
        }
    }

    // Clear all errors
    function clearErrors() {
        // Clear error messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        
        // Remove error borders
        document.querySelectorAll('.form-group input').forEach(input => {
            input.classList.remove('input-error-border');
        });
        const termsCheckbox = document.getElementById('terms');
        if (termsCheckbox && termsCheckbox.parentElement) {
            termsCheckbox.parentElement.style.borderColor = '';
            termsCheckbox.parentElement.style.boxShadow = '';
        }
    }

    // Validation functions
    function isValidName(name) {
        return /^[A-Za-z\s]{2,50}$/.test(name.trim());
    }

    function isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email.trim());
    }

    function isValidPassword(password) {
        // At least 8 characters, one uppercase, one lowercase, one number
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return passwordPattern.test(password);
    }

    function isValidPhone(phone) {
        if (!phone.trim()) return true; // Optional field
        // Basic phone validation - accepts various formats
        const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
        return phonePattern.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    // Validate entire form
    function validateForm() {
        clearErrors();
        
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const terms = document.getElementById('terms').checked;
        
        let isValid = true;

        // First Name validation
        if (!firstName) {
            displayError(document.getElementById('firstName-error'), 
                        document.getElementById('firstName'), 
                        'First name is required.');
            isValid = false;
        } else if (!isValidName(firstName)) {
            displayError(document.getElementById('firstName-error'), 
                        document.getElementById('firstName'), 
                        'Please enter a valid first name (2-50 letters).');
            isValid = false;
        }

        // Last Name validation
        if (!lastName) {
            displayError(document.getElementById('lastName-error'), 
                        document.getElementById('lastName'), 
                        'Last name is required.');
            isValid = false;
        } else if (!isValidName(lastName)) {
            displayError(document.getElementById('lastName-error'), 
                        document.getElementById('lastName'), 
                        'Please enter a valid last name (2-50 letters).');
            isValid = false;
        }

        // Email validation
        if (!email) {
            displayError(document.getElementById('email-error'), 
                        document.getElementById('email'), 
                        'Email address is required.');
            isValid = false;
        } else if (!isValidEmail(email)) {
            displayError(document.getElementById('email-error'), 
                        document.getElementById('email'), 
                        'Please enter a valid email address.');
            isValid = false;
        }

        // Password validation
        if (!password) {
            displayError(document.getElementById('password-error'), 
                        document.getElementById('password'), 
                        'Password is required.');
            isValid = false;
        } else if (!isValidPassword(password)) {
            displayError(document.getElementById('password-error'), 
                        document.getElementById('password'), 
                        'Password must be at least 8 characters with uppercase, lowercase, and number.');
            isValid = false;
        }

        // Confirm Password validation
        if (!confirmPassword) {
            displayError(document.getElementById('confirmPassword-error'), 
                        document.getElementById('confirmPassword'), 
                        'Please confirm your password.');
            isValid = false;
        } else if (password !== confirmPassword) {
            displayError(document.getElementById('confirmPassword-error'), 
                        document.getElementById('confirmPassword'), 
                        'Passwords do not match.');
            isValid = false;
        }

        // Phone validation
        if (phone && !isValidPhone(phone)) {
            displayError(document.getElementById('phone-error'), 
                        document.getElementById('phone'), 
                        'Please enter a valid phone number.');
            isValid = false;
        }

                // Terms validation
        if (!terms) {
            const termsError = document.getElementById('terms-error');
            if (termsError) {
                termsError.textContent = 'You must agree to the terms and conditions.';
                termsError.style.display = 'block';
            }
            // Also highlight the checkbox
            const termsCheckbox = document.getElementById('terms');
            if (termsCheckbox) {
                termsCheckbox.parentElement.style.borderColor = '#ff4444';
                termsCheckbox.parentElement.style.boxShadow = '0 0 0 2px rgba(255, 68, 68, 0.1)';
            }
            isValid = false;
        } else {
            const termsError = document.getElementById('terms-error');
            if (termsError) {
                termsError.textContent = '';
                termsError.style.display = 'none';
            }
        }

    // Handle form submission
    signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        if (!validateForm()) return;
        
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const phone = document.getElementById('phone').value.trim();
        
        // Create display name from first and last name
        const displayName = `${firstName} ${lastName}`;
        
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        const originalText = showLoading(submitBtn);
        
        try {
            const response = await fetch(API_ENDPOINTS.signup, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    email, 
                    password,
                    displayName,
                    phone,
                    firstName,
                    lastName
                })
            });

            const data = await response.json();

            if (data.success) {
                showSuccess('Account created successfully! Redirecting to login...');
                
                // Store user data temporarily (optional)
                localStorage.setItem('new_user_email', email);
                
                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                showError(data.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            showError('Cannot connect to the server. Make sure backend is running on port 3000.');
        } finally {
            hideLoading(submitBtn, originalText);
        }
    });

    // Admin login button handler
    adminLoginBtn.addEventListener('click', () => {
        window.location.href = 'admin-login.html';
    });

    // Initialize the page
    async function initialize() {
        console.log('Initializing Signup Page...');
        
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
    }

    // Start initialization
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
`;
document.head.appendChild(style);