// admin-login.js - Admin Authentication
document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminGoogleBtn = document.getElementById('adminGoogleBtn');
    
    // API Configuration
    const API_BASE = 'http://localhost:3000';
    const API_ENDPOINTS = {
        login: `${API_BASE}/api/login`,
        health: `${API_BASE}/api/health`,
        googleAuthUrl: `${API_BASE}/api/auth/google/url`
    };

    // Store admin credentials (in production, this should be in a database)
    const ADMIN_CREDENTIALS = [
        {
            email: 'admin@cloudnative.com',
            password: 'Admin@123',
            role: 'superadmin'
        },
        {
            email: 'manager@cloudnative.com',
            password: 'Manager@123',
            role: 'manager'
        }
    ];

    // Helper functions
    function showLoading(element) {
        const originalText = element.textContent;
        element.innerHTML = '<span class="spinner"></span> Verifying...';
        element.disabled = true;
        return originalText;
    }

    function hideLoading(element, originalText) {
        element.textContent = originalText;
        element.disabled = false;
    }

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
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
        
        document.querySelectorAll('.login-form input').forEach(input => {
            input.classList.remove('input-error-border');
        });
    }

    // Validate admin credentials
    function validateAdminCredentials(email, password) {
        const admin = ADMIN_CREDENTIALS.find(admin => 
            admin.email === email && admin.password === password
        );
        return admin || null;
    }

    // Handle admin form submission
    adminLoginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearErrors();
        
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value.trim();
        
        if (!email || !password) {
            displayError(document.getElementById('adminEmail-error'), 
                        document.getElementById('adminEmail'), 
                        'Please enter admin credentials.');
            return;
        }
        
        const submitBtn = adminLoginForm.querySelector('button[type="submit"]');
        const originalText = showLoading(submitBtn);
        
        // Simulate API call delay
        setTimeout(() => {
            const admin = validateAdminCredentials(email, password);
            
            if (admin) {
                showSuccess(`Welcome, ${admin.role}! Redirecting to admin dashboard...`);
                
                // Store admin session
                sessionStorage.setItem('admin_auth', JSON.stringify({
                    email: admin.email,
                    role: admin.role,
                    timestamp: new Date().toISOString()
                }));
                
                // Redirect to admin dashboard (you'll need to create this)
                setTimeout(() => {
                    window.location.href = 'admin-dashboard.html';
                }, 1500);
            } else {
                showError('Invalid admin credentials. Please try again.');
                displayError(document.getElementById('adminPassword-error'), 
                            document.getElementById('adminPassword'), 
                            'Invalid email or password.');
            }
            
            hideLoading(submitBtn, originalText);
        }, 1000);
    });

    // Admin Google Sign-In
    adminGoogleBtn.addEventListener('click', async () => {
        // You can use the same Google OAuth flow
        // In production, you would check if the Google email is in your admin list
        
        try {
            const response = await fetch(API_ENDPOINTS.googleAuthUrl);
            const data = await response.json();
            
            if (data.success) {
                // Open Google OAuth in popup
                const width = 600;
                const height = 700;
                const left = (window.screen.width - width) / 2;
                const top = (window.screen.height - height) / 2;
                
                const popup = window.open(
                    data.url,
                    'Google Admin Login',
                    `width=${width},height=${height},top=${top},left=${left}`
                );
                
                if (!popup) {
                    showError('Popup blocked! Please allow popups.');
                    return;
                }
                
                // Listen for Google auth success
                const messageHandler = (event) => {
                    if (event.data && event.data.type === 'google-auth-success') {
                        const { user } = event.data;
                        
                        // Check if user is admin (in production, this would be a server check)
                        // For demo, we'll check against our admin list
                        const isAdmin = ADMIN_CREDENTIALS.some(admin => 
                            admin.email === user.email
                        );
                        
                        if (isAdmin) {
                            showSuccess(`Welcome Admin ${user.displayName}!`);
                            
                            // Store admin session
                            sessionStorage.setItem('admin_auth', JSON.stringify({
                                email: user.email,
                                displayName: user.displayName,
                                role: 'google-admin',
                                timestamp: new Date().toISOString()
                            }));
                            
                            // Redirect to admin dashboard
                            setTimeout(() => {
                                window.location.href = 'admin-dashboard.html';
                            }, 1500);
                        } else {
                            showError('This Google account is not authorized for admin access.');
                        }
                        
                        window.removeEventListener('message', messageHandler);
                    }
                };
                
                window.addEventListener('message', messageHandler);
            }
        } catch (error) {
            console.error('Admin Google auth error:', error);
            showError('Google authentication failed.');
        }
    });

    // Initialize
    async function initialize() {
        console.log('Initializing Admin Login Page...');
        
        try {
            const response = await fetch(API_ENDPOINTS.health);
            if (response.ok) {
                console.log('✅ Backend server is running');
            } else {
                console.warn('⚠️ Backend server may not be running');
            }
        } catch (error) {
            console.error('❌ Cannot connect to backend:', error);
        }
    }

    initialize();
});

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
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
    
    .input-error-border {
        border-color: #ff4444 !important;
    }
`;
document.head.appendChild(style);