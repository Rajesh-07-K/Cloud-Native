// dashboard.js - Dashboard Functionality

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const userDisplayName = document.getElementById('userDisplayName');
    const userEmail = document.getElementById('userEmail');
    const userAvatar = document.getElementById('userAvatar');
    const welcomeName = document.getElementById('welcomeName');
    const logoutBtn = document.getElementById('logoutBtn');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('overlay');
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationsPanel = document.getElementById('notificationsPanel');
    const closeNotifications = document.getElementById('closeNotifications');
    const currentDate = document.getElementById('currentDate');
    const currentTime = document.getElementById('currentTime');
    const refreshUpdates = document.getElementById('refreshUpdates');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const emailList = document.getElementById('emailList');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const unreadEmails = document.getElementById('unreadEmails');
    const pendingTasks = document.getElementById('pendingTasks');
    const upcomingEvents = document.getElementById('upcomingEvents');

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
            welcomeName.textContent = user.displayName || user.email.split('@')[0];
            
            // Update avatar
            const avatarName = encodeURIComponent(user.displayName || user.email);
            userAvatar.src = `https://ui-avatars.com/api/?name=${avatarName}&background=4b0082&color=fff&size=100`;
        } else {
            clearToken();
            window.location.href = '/';
        }
    }

    // Load dashboard data
    async function loadDashboardData() {
        const token = getToken();
        if (!token) return;

        try {
            // In a real app, you would fetch this from your API
            // For now, we'll simulate data
            const dashboardData = {
                unreadEmails: Math.floor(Math.random() * 20) + 5,
                pendingTasks: Math.floor(Math.random() * 10) + 1,
                upcomingEvents: Math.floor(Math.random() * 5) + 1,
                emails: [
                    {
                        id: 1,
                        sender: 'John Doe',
                        subject: 'Meeting Agenda',
                        preview: 'Please review the agenda for tomorrow\'s meeting...',
                        time: '10:15 AM',
                        priority: 'important',
                        starred: true
                    },
                    {
                        id: 2,
                        sender: 'Team Cloud',
                        subject: 'Weekly Newsletter',
                        preview: 'This week\'s updates and new features...',
                        time: 'Yesterday',
                        priority: 'normal',
                        starred: false
                    },
                    {
                        id: 3,
                        sender: 'Security Team',
                        subject: 'Security Alert',
                        preview: 'Unusual login detected from new location...',
                        time: '2 hours ago',
                        priority: 'important',
                        starred: true
                    },
                    {
                        id: 4,
                        sender: 'Promotion',
                        subject: 'Limited Time Deal!',
                        preview: 'Exclusive offer just for you...',
                        time: '2 days ago',
                        priority: 'spam',
                        starred: false
                    }
                ],
                tasks: [
                    {
                        id: 1,
                        title: 'Complete security verification',
                        description: 'Required for account access',
                        priority: 'high',
                        deadline: 'Today',
                        completed: false
                    },
                    {
                        id: 2,
                        title: 'Review quarterly report',
                        description: 'Finance department',
                        priority: 'medium',
                        deadline: 'Tomorrow',
                        completed: false
                    },
                    {
                        id: 3,
                        title: 'Update profile information',
                        description: 'Keep your details current',
                        priority: 'low',
                        deadline: 'This week',
                        completed: false
                    }
                ],
                updates: [
                    {
                        id: 1,
                        title: 'Security Update Required',
                        message: 'Please update your password for enhanced security.',
                        type: 'important',
                        time: 'Today, 10:30 AM'
                    },
                    {
                        id: 2,
                        title: 'System Maintenance',
                        message: 'Scheduled maintenance on Sunday, 2:00 AM - 4:00 AM.',
                        type: 'warning',
                        time: 'Tomorrow'
                    },
                    {
                        id: 3,
                        title: 'New Feature Released',
                        message: 'Knowledge Map feature is now available. Check it out!',
                        type: 'info',
                        time: '2 days ago'
                    }
                ]
            };

            // Update stats
            unreadEmails.textContent = dashboardData.unreadEmails;
            pendingTasks.textContent = dashboardData.pendingTasks;
            upcomingEvents.textContent = dashboardData.upcomingEvents;

            // Render emails
            renderEmails(dashboardData.emails);
            
            // Render tasks
            renderTasks(dashboardData.tasks);
            
            // Render updates
            renderUpdates(dashboardData.updates);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showNotification('Error loading dashboard data', 'error');
        }
    }

    // Render emails
    function renderEmails(emails) {
        emailList.innerHTML = '';
        
        emails.forEach(email => {
            const emailItem = document.createElement('div');
            emailItem.className = `email-item ${email.priority}`;
            emailItem.innerHTML = `
                <div class="email-sender">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(email.sender)}&background=${email.priority === 'important' ? 'f44336' : email.priority === 'spam' ? 'ff9800' : '667eea'}&color=fff" 
                         alt="${email.sender}" class="sender-avatar">
                    <div>
                        <h4>${email.sender}</h4>
                        <p>${email.subject}</p>
                    </div>
                </div>
                <div class="email-preview">
                    <p>${email.preview}</p>
                    <span class="email-time">${email.time}</span>
                </div>
                <div class="email-actions">
                    <button class="email-action-btn star ${email.starred ? 'active' : ''}" data-id="${email.id}">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="email-action-btn archive" data-id="${email.id}">
                        <i class="fas fa-archive"></i>
                    </button>
                </div>
            `;
            emailList.appendChild(emailItem);
        });
        
        // Add event listeners to email actions
        document.querySelectorAll('.star').forEach(btn => {
            btn.addEventListener('click', toggleStar);
        });
        
        document.querySelectorAll('.archive').forEach(btn => {
            btn.addEventListener('click', archiveEmail);
        });
    }

    // Render tasks
    function renderTasks(tasks) {
        taskList.innerHTML = '';
        
        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = `task-item ${task.priority}`;
            taskItem.innerHTML = `
                <div class="task-checkbox">
                    <input type="checkbox" id="task-${task.id}" ${task.completed ? 'checked' : ''}>
                    <label for="task-${task.id}"></label>
                </div>
                <div class="task-content">
                    <h4>${task.title}</h4>
                    <p>${task.description}</p>
                    <div class="task-meta">
                        <span class="task-priority ${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                        <span class="task-deadline">${task.deadline}</span>
                    </div>
                </div>
            `;
            taskList.appendChild(taskItem);
        });
        
        // Add event listeners to checkboxes
        document.querySelectorAll('.task-checkbox input').forEach(checkbox => {
            checkbox.addEventListener('change', updateTaskStatus);
        });
    }

    // Render updates
    function renderUpdates(updates) {
        const updatesList = document.getElementById('importantUpdates');
        updatesList.innerHTML = '';
        
        updates.forEach(update => {
            const updateItem = document.createElement('div');
            updateItem.className = `update-item ${update.type}`;
            updateItem.innerHTML = `
                <div class="update-icon">
                    <i class="fas ${getUpdateIcon(update.type)}"></i>
                </div>
                <div class="update-content">
                    <h4>${update.title}</h4>
                    <p>${update.message}</p>
                    <span class="update-time">${update.time}</span>
                </div>
            `;
            updatesList.appendChild(updateItem);
        });
    }

    // Get icon based on update type
    function getUpdateIcon(type) {
        switch(type) {
            case 'important': return 'fa-shield-alt';
            case 'warning': return 'fa-server';
            case 'info': return 'fa-bullhorn';
            default: return 'fa-info-circle';
        }
    }

    // Toggle star on email
    function toggleStar(event) {
        const btn = event.currentTarget;
        btn.classList.toggle('active');
        const emailId = btn.dataset.id;
        
        // In a real app, you would update this on the server
        console.log(`Toggled star for email ${emailId}`);
    }

    // Archive email
    function archiveEmail(event) {
        const btn = event.currentTarget;
        const emailId = btn.dataset.id;
        const emailItem = btn.closest('.email-item');
        
        emailItem.style.opacity = '0.5';
        setTimeout(() => {
            emailItem.remove();
            showNotification('Email archived', 'success');
        }, 300);
        
        console.log(`Archived email ${emailId}`);
    }

    // Update task status
    function updateTaskStatus(event) {
        const checkbox = event.target;
        const taskId = checkbox.id.replace('task-', '');
        const isCompleted = checkbox.checked;
        
        // Update task count
        if (isCompleted) {
            const current = parseInt(pendingTasks.textContent);
            if (current > 0) {
                pendingTasks.textContent = current - 1;
            }
        } else {
            const current = parseInt(pendingTasks.textContent);
            pendingTasks.textContent = current + 1;
        }
        
        console.log(`Task ${taskId} ${isCompleted ? 'completed' : 'unchecked'}`);
    }

    // Filter emails
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Filter emails
            const filter = btn.dataset.filter;
            const emails = emailList.querySelectorAll('.email-item');
            
            emails.forEach(email => {
                if (filter === 'all' || email.classList.contains(filter)) {
                    email.style.display = 'flex';
                } else {
                    email.style.display = 'none';
                }
            });
        });
    });

    // Add new task
    addTaskBtn.addEventListener('click', () => {
        const taskTitle = prompt('Enter task title:');
        if (!taskTitle) return;
        
        const newTask = {
            id: Date.now(),
            title: taskTitle,
            description: 'New task',
            priority: 'medium',
            deadline: 'Today',
            completed: false
        };
        
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item medium';
        taskItem.innerHTML = `
            <div class="task-checkbox">
                <input type="checkbox" id="task-${newTask.id}">
                <label for="task-${newTask.id}"></label>
            </div>
            <div class="task-content">
                <h4>${newTask.title}</h4>
                <p>${newTask.description}</p>
                <div class="task-meta">
                    <span class="task-priority medium">Medium</span>
                    <span class="task-deadline">${newTask.deadline}</span>
                </div>
            </div>
        `;
        
        taskList.prepend(taskItem);
        
        // Add event listener to new checkbox
        const checkbox = taskItem.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', updateTaskStatus);
        
        // Update task count
        const current = parseInt(pendingTasks.textContent);
        pendingTasks.textContent = current + 1;
        
        showNotification('Task added successfully', 'success');
    });

    // Refresh updates
    refreshUpdates.addEventListener('click', () => {
        showNotification('Refreshing updates...', 'info');
        setTimeout(() => {
            loadDashboardData();
            showNotification('Updates refreshed', 'success');
        }, 1000);
    });

    // Toggle sidebar on mobile
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    // Close sidebar when clicking overlay
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        notificationsPanel.classList.remove('active');
    });

    // Toggle notifications panel
    notificationBtn.addEventListener('click', () => {
        notificationsPanel.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    // Close notifications panel
    closeNotifications.addEventListener('click', () => {
        notificationsPanel.classList.remove('active');
        overlay.classList.remove('active');
    });

    // Logout
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        clearToken();
        showNotification('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    });

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

    // Add toast styles if not already present
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
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
                z-index: 1200;
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
            
            .toast.info {
                background: #2196F3;
                border-left: 4px solid #0d47a1;
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize
    async function initialize() {
        updateDateTime();
        setInterval(updateDateTime, 60000); // Update every minute
        
        await updateUserUI();
        await loadDashboardData();
        
        showNotification('Dashboard loaded successfully', 'success');
    }

    initialize();
});