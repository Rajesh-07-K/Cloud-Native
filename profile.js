// profile.js - Profile Page Functionality

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const userDisplayName = document.getElementById('userDisplayName');
    const userEmail = document.getElementById('userEmail');
    const userAvatar = document.getElementById('userAvatar');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const memberSince = document.getElementById('memberSince');
    const logoutBtn = document.getElementById('logoutBtn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('overlay');
    const currentDate = document.getElementById('currentDate');
    const currentTime = document.getElementById('currentTime');
    const avatarUpload = document.getElementById('avatarUpload');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const profileForm = document.getElementById('profileForm');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const manageDevicesBtn = document.getElementById('manageDevicesBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');

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

    // Load user details from database
    async function loadUserDetails() {
        try {
            // In a real app, you would fetch from your API
            // For now, we'll use localStorage or default data
            const savedProfile = localStorage.getItem('user_profile');
            if (savedProfile) {
                return JSON.parse(savedProfile);
            }
            
            // Default profile data
            return {
                firstName: 'John',
                lastName: 'Doe',
                displayName: 'John Doe',
                email: 'john.doe@example.com',
                phone: '+1 (555) 123-4567',
                dob: '1990-01-01',
                address: '123 Main Street',
                city: 'New York',
                country: 'US',
                postalCode: '10001',
                bio: 'Software engineer passionate about cloud technologies.',
                memberSince: 'Jan 2024'
            };
        } catch (error) {
            console.error('Error loading user details:', error);
            return null;
        }
    }

    // Update UI with user data
    async function updateUserUI() {
        const user = await loadUserProfile();
        const userDetails = await loadUserDetails();
        
        if (user) {
            // Update user info
            userDisplayName.textContent = user.displayName || user.email.split('@')[0];
            userEmail.textContent = user.email;
            
            // Update profile info
            const avatarName = encodeURIComponent(user.displayName || user.email);
            const avatarUrl = `https://ui-avatars.com/api/?name=${avatarName}&background=4b0082&color=fff&size=150`;
            
            userAvatar.src = avatarUrl;
            profileAvatar.src = avatarUrl;
            
            if (userDetails) {
                profileName.textContent = userDetails.displayName;
                profileEmail.textContent = userDetails.email;
                memberSince.textContent = userDetails.memberSince;
                
                // Fill form fields
                document.getElementById('firstName').value = userDetails.firstName || '';
                document.getElementById('lastName').value = userDetails.lastName || '';
                document.getElementById('displayName').value = userDetails.displayName || '';
                document.getElementById('email').value = userDetails.email || '';
                document.getElementById('phone').value = userDetails.phone || '';
                document.getElementById('dob').value = userDetails.dob || '';
                document.getElementById('address').value = userDetails.address || '';
                document.getElementById('city').value = userDetails.city || '';
                document.getElementById('country').value = userDetails.country || '';
                document.getElementById('postalCode').value = userDetails.postalCode || '';
                document.getElementById('bio').value = userDetails.bio || '';
            }
        } else {
            clearToken();
            window.location.href = '/';
        }
    }

    // Save profile changes
    async function saveProfile() {
        const formData = new FormData(profileForm);
        const profileData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            displayName: formData.get('displayName'),
            phone: formData.get('phone'),
            dob: formData.get('dob'),
            address: formData.get('address'),
            city: formData.get('city'),
            country: formData.get('country'),
            postalCode: formData.get('postalCode'),
            bio: formData.get('bio'),
            updatedAt: new Date().toISOString()
        };

        try {
            // In a real app, you would send this to your API
            localStorage.setItem('user_profile', JSON.stringify(profileData));
            
            // Update UI
            profileName.textContent = profileData.displayName;
            userDisplayName.textContent = profileData.displayName;
            
            // Update avatar
            const avatarName = encodeURIComponent(profileData.displayName);
            const avatarUrl = `https://ui-avatars.com/api/?name=${avatarName}&background=4b0082&color=fff&size=150`;
            profileAvatar.src = avatarUrl;
            userAvatar.src = avatarUrl;
            
            showNotification('Profile updated successfully', 'success');
            
            // Show success animation
            saveProfileBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
            setTimeout(() => {
                saveProfileBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            }, 2000);
            
        } catch (error) {
            console.error('Error saving profile:', error);
            showNotification('Error saving profile', 'error');
        }
    }

    // Change password
    function changePassword() {
        const currentPassword = prompt('Enter current password:');
        if (!currentPassword) return;
        
        const newPassword = prompt('Enter new password (min 8 characters):');
        if (!newPassword || newPassword.length < 8) {
            showNotification('Password must be at least 8 characters', 'error');
            return;
        }
        
        const confirmPassword = prompt('Confirm new password:');
        if (newPassword !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        
        // In a real app, you would send this to your API
        showNotification('Password changed successfully', 'success');
        console.log('Password change requested');
    }

    // Manage connected devices
    function manageDevices() {
        showNotification('Device management feature coming soon', 'info');
    }

    // Export user data
    function exportUserData() {
        const userData = {
            profile: JSON.parse(localStorage.getItem('user_profile') || '{}'),
            timestamp: new Date().toISOString(),
            format: 'JSON'
        };
        
        const dataStr = JSON.stringify(userData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `user-data-${new Date().getTime()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification('Data exported successfully', 'success');
    }

    // Delete account (with confirmation)
    function deleteAccount() {
        const confirmDelete = confirm('WARNING: This will permanently delete your account and all associated data. This action cannot be undone.\n\nType DELETE to confirm:');
        
        if (!confirmDelete) return;
        
        const userInput = prompt('Type DELETE to confirm account deletion:');
        if (userInput === 'DELETE') {
            // In a real app, you would send this to your API
            clearToken();
            localStorage.removeItem('user_profile');
            
            showNotification('Account deleted successfully', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            showNotification('Account deletion cancelled', 'info');
        }
    }

    // Upload avatar
    function uploadAvatar() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showNotification('Image size must be less than 5MB', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                // In a real app, you would upload to server
                // For now, we'll use a mock URL
                profileAvatar.src = e.target.result;
                userAvatar.src = e.target.result;
                
                showNotification('Avatar updated successfully', 'success');
            };
            reader.readAsDataURL(file);
        };
        
        input.click();
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

    saveProfileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (profileForm.checkValidity()) {
            saveProfile();
        } else {
            profileForm.reportValidity();
        }
    });

    avatarUpload.addEventListener('click', uploadAvatar);
    changePasswordBtn.addEventListener('click', changePassword);
    manageDevicesBtn.addEventListener('click', manageDevices);
    exportDataBtn.addEventListener('click', exportUserData);
    deleteAccountBtn.addEventListener('click', deleteAccount);

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
        
        showNotification('Profile loaded successfully', 'success');
    }

    initialize();
});