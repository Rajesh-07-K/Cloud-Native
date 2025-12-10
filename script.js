const SUPABASE_URL = 'https://qfjolbexieldopamrbci.supabase.co'; // Get from Supabase Settings → API
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmam9sYmV4aWVsZG9wYW1yYmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzQ2MDYsImV4cCI6MjA4MDk1MDYwNn0.oV2-2wUHR-L4LEgSO3v5PvKoVMuyz45Sq1GQnKT0r8Y'; // Get from same location
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
document.addEventListener('DOMContentLoaded', () => {
    // 1. Get the form and input elements
    const loginForm = document.querySelector('.login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');

    // Helper to display error message and border
    function displayError(element, inputElement, message) {
        element.textContent = message;
        inputElement.classList.add('input-error-border'); 
    }

    // Helper to clear error messages and borders
    function clearErrors() {
        emailError.textContent = '';
        passwordError.textContent = '';
        emailInput.classList.remove('input-error-border');
        passwordInput.classList.remove('input-error-border');
    }

    // Helper function for a basic email format check
    function isValidEmail(email) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(email);
    }

    // 2. Add an event listener to the form for submission
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault(); 
        clearErrors(); 

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        let isValid = true;

        // Validation Check 1: Email Required & Format
        if (email === "") {
            displayError(emailError, emailInput, 'Email address is required.');
            emailInput.focus();
            isValid = false;
        } else if (!isValidEmail(email)) {
             displayError(emailError, emailInput, 'Please enter a valid email format.');
             emailInput.focus();
             isValid = false;
        } 
        
        // Validation Check 2: Password Required
        if (password === "") {
            displayError(passwordError, passwordInput, 'Password is required.');
            passwordInput.focus();
            isValid = false; 
        }

        // 3. Handle successful client-side validation
        if (isValid) {
            console.log('Client-side validation passed. Ready to send data to backend.');
            alert('Client-side validation passed! Next step is server authentication.');
        } else {
            console.log('Login validation failed.');
        }
    });

    // Add click handler for the Google button 
    const googleButton = document.querySelector('.google-btn');
    googleButton.addEventListener('click', () => {
        console.log('Google Sign-in clicked.');
        alert('Initiating secure Google Sign-in flow...');
    });
    
    // Add click handler for the Sign Up link (Placeholder)
    const signUpLink = document.querySelector('.signup-link a');
    signUpLink.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Sign Up link clicked.');
        alert('Redirecting to Sign Up page...');
    });
});