// knowledge-map.js - Knowledge Map Functionality

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
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const resetViewBtn = document.getElementById('resetViewBtn');
    const closeDetails = document.getElementById('closeDetails');
    const knowledgeDetails = document.getElementById('knowledgeDetails');
    const mapCanvas = document.getElementById('mapCanvas');
    const knowledgeLevel = document.getElementById('knowledgeLevel');
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox input');
    const filterRadios = document.querySelectorAll('.filter-radio input');
    const nodes = document.querySelectorAll('.node');

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

    // Knowledge data
    const knowledgeData = {
        'containers': {
            title: 'Containers',
            description: 'Containers are lightweight, standalone, executable packages that include everything needed to run a piece of software. Docker is the most popular container platform, providing tools for building, shipping, and running containers. Containerization enables consistency across environments and efficient resource utilization.',
            category: 'cloud',
            level: 'intermediate',
            progress: 85,
            resources: [
                {
                    type: 'documentation',
                    title: 'Docker Documentation',
                    description: 'Official Docker documentation and guides',
                    link: 'https://docs.docker.com'
                },
                {
                    type: 'course',
                    title: 'Container Basics Course',
                    description: 'Beginner course on container fundamentals',
                    link: '#'
                },
                {
                    type: 'labs',
                    title: 'Hands-on Labs',
                    description: 'Practical exercises with Docker',
                    link: '#'
                }
            ]
        },
        'orchestration': {
            title: 'Orchestration',
            description: 'Container orchestration automates deployment, management, scaling, and networking of containers. Kubernetes is the leading orchestration platform that helps manage containerized applications across multiple hosts.',
            category: 'devops',
            level: 'intermediate',
            progress: 70,
            resources: [
                {
                    type: 'documentation',
                    title: 'Kubernetes Docs',
                    description: 'Official Kubernetes documentation',
                    link: 'https://kubernetes.io/docs'
                }
            ]
        },
        'security': {
            title: 'Security',
            description: 'Cloud security involves protecting cloud-based systems, data, and infrastructure. It includes identity management, data protection, network security, and compliance with regulations.',
            category: 'security',
            level: 'intermediate',
            progress: 60,
            resources: [
                {
                    type: 'course',
                    title: 'Cloud Security Fundamentals',
                    description: 'Learn cloud security best practices',
                    link: '#'
                }
            ]
        },
        'data-services': {
            title: 'Data Services',
            description: 'Cloud data services provide scalable storage, databases, and analytics solutions. This includes managed databases, data lakes, data warehouses, and streaming data services.',
            category: 'data',
            level: 'beginner',
            progress: 45,
            resources: [
                {
                    type: 'documentation',
                    title: 'AWS Data Services',
                    description: 'Amazon Web Services data solutions',
                    link: 'https://aws.amazon.com/products/databases'
                }
            ]
        },
        'ai-ml': {
            title: 'AI/ML',
            description: 'Artificial Intelligence and Machine Learning services in the cloud provide tools for building, training, and deploying ML models without managing infrastructure.',
            category: 'ai',
            level: 'beginner',
            progress: 30,
            resources: [
                {
                    type: 'course',
                    title: 'ML on Cloud Platforms',
                    description: 'Machine learning on AWS, Azure, GCP',
                    link: '#'
                }
            ]
        }
    };

    // Map zoom state
    let zoomLevel = 1;
    const minZoom = 0.5;
    const maxZoom = 3;
    const zoomStep = 0.2;

    // Initialize map
    function initializeMap() {
        // Position nodes randomly (for demo)
        nodes.forEach(node => {
            if (!node.classList.contains('central')) {
                const randomX = 20 + Math.random() * 60;
                const randomY = 20 + Math.random() * 60;
                node.style.left = `${randomX}%`;
                node.style.top = `${randomY}%`;
            }
        });
        
        // Add click handlers to nodes
        nodes.forEach(node => {
            node.addEventListener('click', () => {
                const nodeId = node.dataset.id;
                if (nodeId && knowledgeData[nodeId]) {
                    showNodeDetails(nodeId);
                }
            });
        });
    }

    // Show node details
    function showNodeDetails(nodeId) {
        const data = knowledgeData[nodeId];
        if (!data) return;
        
        // Update details panel
        document.getElementById('topicTitle').textContent = data.title;
        document.getElementById('topicDescription').textContent = data.description;
        
        // Update progress
        const progressBar = document.querySelector('.details-content .progress-bar');
        progressBar.style.width = `${data.progress}%`;
        progressBar.nextElementSibling.textContent = `${data.progress}% Complete`;
        
        // Update category
        const categorySpan = document.querySelector('.topic-category');
        categorySpan.className = 'topic-category ' + data.category;
        categorySpan.textContent = getCategoryName(data.category);
        
        // Update level
        const levelSpan = document.querySelector('.topic-level');
        levelSpan.className = 'topic-level ' + data.level;
        levelSpan.textContent = data.level.charAt(0).toUpperCase() + data.level.slice(1);
        
        // Update resources
        const resourcesList = document.querySelector('.resources-list');
        resourcesList.innerHTML = '';
        
        data.resources.forEach(resource => {
            const resourceItem = document.createElement('div');
            resourceItem.className = 'resource-item';
            resourceItem.innerHTML = `
                <i class="fas ${getResourceIcon(resource.type)}"></i>
                <div>
                    <h6>${resource.title}</h6>
                    <p>${resource.description}</p>
                </div>
                <a href="${resource.link}" class="resource-link" target="_blank">${resource.type === 'course' ? 'Start' : resource.type === 'labs' ? 'Try' : 'View'}</a>
            `;
            resourcesList.appendChild(resourceItem);
        });
        
        // Show details panel
        knowledgeDetails.classList.add('active');
        overlay.classList.add('active');
    }

    // Get category name
    function getCategoryName(category) {
        const categories = {
            'cloud': 'Cloud Computing',
            'security': 'Security',
            'devops': 'DevOps',
            'data': 'Data & Analytics',
            'ai': 'AI & Machine Learning'
        };
        return categories[category] || category;
    }

    // Get resource icon
    function getResourceIcon(type) {
        const icons = {
            'documentation': 'fa-book',
            'course': 'fa-video',
            'labs': 'fa-code',
            'article': 'fa-newspaper',
            'video': 'fa-play-circle'
        };
        return icons[type] || 'fa-link';
    }

    // Zoom functions
    function zoomIn() {
        if (zoomLevel < maxZoom) {
            zoomLevel += zoomStep;
            updateZoom();
        }
    }

    function zoomOut() {
        if (zoomLevel > minZoom) {
            zoomLevel -= zoomStep;
            updateZoom();
        }
    }

    function resetView() {
        zoomLevel = 1;
        updateZoom();
        showNotification('View reset', 'info');
    }

    function updateZoom() {
        const knowledgeMap = document.querySelector('.knowledge-map');
        knowledgeMap.style.transform = `scale(${zoomLevel})`;
        
        // Update button states
        zoomInBtn.disabled = zoomLevel >= maxZoom;
        zoomOutBtn.disabled = zoomLevel <= minZoom;
    }

    // Filter functions
    function applyFilters() {
        const selectedCategories = Array.from(filterCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.id.replace('filter-', ''));
        
        const knowledgeValue = knowledgeLevel.value;
        
        nodes.forEach(node => {
            if (node.classList.contains('central')) return;
            
            const nodeCategory = node.classList.contains('cloud') ? 'cloud' :
                                node.classList.contains('security') ? 'security' :
                                node.classList.contains('devops') ? 'devops' :
                                node.classList.contains('data') ? 'data' : 'ai';
            
            const shouldShow = selectedCategories.includes(nodeCategory);
            
            node.style.display = shouldShow ? 'flex' : 'none';
            node.style.opacity = shouldShow ? '1' : '0.3';
        });
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
        knowledgeDetails.classList.remove('active');
    });

    zoomInBtn.addEventListener('click', zoomIn);
    zoomOutBtn.addEventListener('click', zoomOut);
    resetViewBtn.addEventListener('click', resetView);
    closeDetails.addEventListener('click', () => {
        knowledgeDetails.classList.remove('active');
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

    // Filter event listeners
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });

    knowledgeLevel.addEventListener('input', applyFilters);
    filterRadios.forEach(radio => {
        radio.addEventListener('change', applyFilters);
    });

    // Initialize
    async function initialize() {
        updateDateTime();
        setInterval(updateDateTime, 60000);
        
        await updateUserUI();
        initializeMap();
        
        showNotification('Knowledge Map loaded', 'success');
    }

    initialize();
});