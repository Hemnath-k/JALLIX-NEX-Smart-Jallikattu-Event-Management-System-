// Main JavaScript for JALLIX-NEX

document.addEventListener('DOMContentLoaded', function() {
    // Authentication System
    initializeAuth();
    
    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const nav = document.querySelector('.nav');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', function() {
            nav.classList.toggle('active');
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });
        
        // Close mobile menu when clicking on a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                if (mobileMenuBtn) {
                    const icon = mobileMenuBtn.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }
    
    // Set active nav link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage || 
            (currentPage === '' && linkHref === 'index.html') ||
            (currentPage === 'index.html' && linkHref === '')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Sidebar Toggle for Dashboard
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Role Selection in Login/Register - handled by auth.js
    // Don't redirect here - let users fill in the registration form
    
    // File Upload Preview
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            const fileName = this.files[0] ? this.files[0].name : 'No file chosen';
            const uploadArea = this.closest('.file-upload');
            
            if (uploadArea) {
                const icon = uploadArea.querySelector('i');
                const text = uploadArea.querySelector('p');
                
                if (this.files[0]) {
                    icon.className = 'fas fa-file-check';
                    icon.style.color = 'var(--success)';
                    text.textContent = fileName;
                    uploadArea.style.borderColor = 'var(--success)';
                }
            }
        });
    });
    
    // Password Toggle
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Tab Switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');
    
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.dataset.tab;
                
                // Update active tab button
                tabBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Show corresponding form
                authForms.forEach(form => {
                    form.classList.remove('active');
                    if (form.id === `${tabId}Form`) {
                        form.classList.add('active');
                    }
                });
            });
        });
    }
    
    // Form Validation - Skip login and register forms (handled by auth.js)
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        // Skip login and register forms - they're handled by auth.js
        if (form.id === 'loginForm' || form.id === 'registerForm') {
            return;
        }
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic validation
            const inputs = this.querySelectorAll('input[required], select[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    input.style.borderColor = 'var(--danger)';
                    isValid = false;
                } else {
                    input.style.borderColor = '#ddd';
                }
            });
            
            if (isValid) {
                // Show success message
                alert('Form submitted successfully!');
                this.reset();
            } else {
                alert('Please fill in all required fields.');
            }
        });
    });
    
    // Check for role parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    if (roleParam) {
        localStorage.setItem('selectedRole', roleParam);
    }
    
    // Apply role-based styling
    applyRoleStyling();
});

// Role-based access control
function applyRoleStyling() {
    const role = localStorage.getItem('selectedRole') || 'public';
    const body = document.body;
    
    // Remove existing role classes
    body.classList.remove('role-public', 'role-owner', 'role-tamer', 'role-admin');
    
    // Add current role class
    body.classList.add(`role-${role}`);
    
    // Update UI based on role
    updateUIForRole(role);
}

function updateUIForRole(role) {
    // Example: Show/hide elements based on role
    const adminElements = document.querySelectorAll('.admin-only');
    const ownerElements = document.querySelectorAll('.owner-only');
    const tamerElements = document.querySelectorAll('.tamer-only');
    
    switch(role) {
        case 'admin':
            adminElements.forEach(el => el.style.display = 'block');
            ownerElements.forEach(el => el.style.display = 'none');
            tamerElements.forEach(el => el.style.display = 'none');
            break;
        case 'owner':
            adminElements.forEach(el => el.style.display = 'none');
            ownerElements.forEach(el => el.style.display = 'block');
            tamerElements.forEach(el => el.style.display = 'none');
            break;
        case 'tamer':
            adminElements.forEach(el => el.style.display = 'none');
            ownerElements.forEach(el => el.style.display = 'none');
            tamerElements.forEach(el => el.style.display = 'block');
            break;
        default:
            adminElements.forEach(el => el.style.display = 'none');
            ownerElements.forEach(el => el.style.display = 'none');
            tamerElements.forEach(el => el.style.display = 'none');
    }
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Generate random ID
function generateId(prefix = '') {
    return prefix + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Authentication System
async function initializeAuth() {
    const token = localStorage.getItem('jallixnex_token') || sessionStorage.getItem('jallixnex_token');
    const userData = localStorage.getItem('jallixnex_user') || sessionStorage.getItem('jallixnex_user');
    
    if (token && userData) {
        try {
            // Verify token with backend
            const response = await fetch('http://localhost:5000/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                updateUIForLoggedInUser(data.user);
            } else {
                // Token invalid, clear storage
                clearAuthData();
            }
        } catch (error) {
            console.error('Auth verification failed:', error);
            clearAuthData();
        }
    } else {
        updateUIForLoggedOutUser();
    }
    
    // Setup logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                const token = localStorage.getItem('jallixnex_token') || sessionStorage.getItem('jallixnex_token');
                if (token) {
                    await fetch('http://localhost:5000/api/auth/logout', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                }
            } catch (error) {
                console.error('Logout API call failed:', error);
            }
            
            clearAuthData();
            updateUIForLoggedOutUser();
            window.location.href = 'login.html';
        });
    }
}

function updateUIForLoggedInUser(user) {
    const navLogin = document.getElementById('navLogin');
    const navUserProfile = document.getElementById('navUserProfile');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (navLogin) navLogin.style.display = 'none';
    if (navUserProfile) navUserProfile.style.display = 'flex';
    
    if (userName && user) {
        userName.textContent = user.name || 'User';
    }
    
    if (userAvatar && user) {
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=d35400&color=fff&size=32`;
        userAvatar.src = avatarUrl;
    }
    
    // Update dashboard sidebar if it exists
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserRole = document.getElementById('sidebarUserRole');
    const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
    
    if (sidebarUserName && user) {
        sidebarUserName.textContent = user.name || 'User';
    }
    
    if (sidebarUserRole && user) {
        sidebarUserRole.textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User';
    }
    
    if (sidebarUserAvatar && user) {
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=d35400&color=fff&size=128`;
        sidebarUserAvatar.src = avatarUrl;
    }
}

function updateUIForLoggedOutUser() {
    const navLogin = document.getElementById('navLogin');
    const navUserProfile = document.getElementById('navUserProfile');
    
    if (navLogin) navLogin.style.display = 'block';
    if (navUserProfile) navUserProfile.style.display = 'none';
    
    // Reset dashboard sidebar if it exists
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserRole = document.getElementById('sidebarUserRole');
    const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
    
    if (sidebarUserName) {
        sidebarUserName.textContent = 'User';
    }
    
    if (sidebarUserRole) {
        sidebarUserRole.textContent = 'Guest';
    }
    
    if (sidebarUserAvatar) {
        sidebarUserAvatar.src = 'https://ui-avatars.com/api/?name=User&background=d35400&color=fff&size=128';
    }
}

function clearAuthData() {
    localStorage.removeItem('jallixnex_token');
    localStorage.removeItem('jallixnex_user');
    sessionStorage.removeItem('jallixnex_token');
    sessionStorage.removeItem('jallixnex_user');
}