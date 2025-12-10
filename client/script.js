// script.js (FINAL VERSION for Login and Mock Sign Up)

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get elements
    const loginForm = document.querySelector('.login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    const signUpLink = document.querySelector('.signup-link a');

    const LOGIN_API_URL = 'http://localhost:3000/api/login'; 
    const SIGNUP_API_URL = 'http://localhost:3000/api/signup';

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

    // --- 1. Sign In Handler (Already detailed) ---
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault(); 
        clearErrors(); 

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        let isValid = true;
        // ... (Front-end Validation here) ...
        if (email === "") {
            displayError(emailError, emailInput, 'Email address is required.'); isValid = false;
        } else if (!isValidEmail(email)) {
             displayError(emailError, emailInput, 'Please enter a valid email format.'); isValid = false;
        } 
        if (password === "") {
            displayError(passwordError, passwordInput, 'Password is required.'); isValid = false; 
        }
        if (!isValid) return; 

        // Send login request
        try {
            const response = await fetch(LOGIN_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                alert(`SUCCESS! Welcome back, ${data.user.email}!`);
            } else {
                alert(`Login Failed: ${data.message}`);
                // Use the password error field for generic credential failure
                displayError(passwordError, passwordInput, 'Email or password incorrect.');
            }
        } catch (error) {
            console.error('Network or Server Error:', error);
            alert('A network error occurred. Check if the backend server is running.');
        }
    });
    
    // --- 2. Mock Sign Up Handler ---
    signUpLink.addEventListener('click', async (event) => {
        event.preventDefault();
        
        // **MOCK REGISTRATION:** Prompt user for credentials
        const email = prompt("Enter email for new user:");
        const password = prompt("Enter password (8+ chars) for new user:");
        
        if (!email || !password) {
            alert("Registration cancelled.");
            return;
        }

        try {
            const response = await fetch(SIGNUP_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            
            const data = await response.json();

            if (data.success) {
                alert(`Registration SUCCESS! User ${data.user.email} created. You can now log in.`);
                emailInput.value = email;
                passwordInput.focus();
            } else {
                alert(`Registration FAILED: ${data.message}`);
            }
        } catch (error) {
            console.error('Network or Server Error:', error);
            alert('A network error occurred during registration.');
        }
    });

    // ... (Google button handler remains the same) ...
    document.querySelector('.google-btn').addEventListener('click', () => {
        alert('Initiating secure Google Sign-in flow...');
    });
});