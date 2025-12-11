// about.js - About Page Functionality

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const userDisplayName = document.getElementById('userDisplayName');
    const userEmail = document.getElementById('userEmail');
    const userAvatar = document.getElementById('userAvatar');
    const logoutBtn = document.getElementById('logoutBtn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('overlay');
    const currentDate = document.getElementById('currentDate');
    const currentTime = document.getElementById('currentTime');
    const faqQuestions = document.querySelectorAll('.faq-question');
    const contactForm = document.getElementById('contactForm');

    // API Configuration
    const API_BASE = 'http://localhost:3000';
    
    // Auth state management
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
    
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = '/';
        return;
    }

    // Load user profile
    async function loadUserProfile() {
        const token = getToken();
        if (!token) return null;

        try {
            const response = await fetch(`${API_BASE}/api/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.user;
            } else {
                clearToken();
                window.location.href = '/';
                return null;
            }
        } catch (error) {
            console.error('Profile load error:', error);
            return null;
        }
    }

    // Update UI with user data
    async function updateUserUI() {
        const user = await loadUserProfile();
        if (user) {
            // Update user info
            userDisplayName.textContent = user.displayName || user.email.split('@')[0];
            userEmail.textContent = user.email;
            
            // Update avatar
            const avatarName = encodeURIComponent(user.displayName || user.email);
            userAvatar.src = `https://ui-avatars.com/api/?name=${avatarName}&background=4b0082&color=fff&size=100`;
        } else {
            clearToken();
            window.location.href = '/';
        }
    }

    // Update date and time
    function updateDateTime() {
        const now = new Date();
        
        // Format date
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDate.textContent = now.toLocaleDateString('en-US', options);
        
        // Format time
        currentTime.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    // FAQ functionality
    function initializeFAQ() {
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const item = question.parentElement;
                item.classList.toggle('active');
                
                // Close other FAQ items
                faqQuestions.forEach(otherQuestion => {
                    if (otherQuestion !== question) {
                        otherQuestion.parentElement.classList.remove('active');
                    }
                });
            });
        });
    }

    // Contact form submission
    function initializeContactForm() {
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Get form data
                const formData = new FormData(contactForm);
                const data = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    subject: formData.get('subject'),
                    message: formData.get('message'),
                    timestamp: new Date().toISOString()
                };
                
                // In a real app, you would send this to your API
                console.log('Contact form submitted:', data);
                
                // Show success message
                showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
                
                // Reset form
                contactForm.reset();
            });
        }
    }

    // Show notification toast
    function showNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
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

    // Event Listeners
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        clearToken();
        showNotification('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    });

    // Initialize
    async function initialize() {
        updateDateTime();
        setInterval(updateDateTime, 60000);
        
        await updateUserUI();
        initializeFAQ();
        initializeContactForm();
        
        showNotification('About page loaded', 'success');
    }

    initialize();
});