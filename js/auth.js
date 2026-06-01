// Authentication Handler for JALLIX-NEX
// Handles login and registration forms

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // ========== LOGIN FORM HANDLER ==========
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            // Validation
            if (!email || !password) {
                showMessage('Please fill in all fields', 'error');
                return;
            }
            
            try {
                // Get API URL
                const apiUrl = window.location.hostname === 'localhost' 
                    ? 'http://localhost:5000/api/auth/login'
                    : 'https://jallix-nex-smart-jallikattu-event.onrender.com/api/auth/login';
                
                // Send login request
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok && data.token) {
                    // Store token
                    if (rememberMe) {
                        localStorage.setItem('jallixnex_token', data.token);
                    } else {
                        sessionStorage.setItem('jallixnex_token', data.token);
                    }
                    
                    // Store user info
                    if (data.user) {
                        localStorage.setItem('jallixnex_user', JSON.stringify(data.user));
                        localStorage.setItem('jallixnex_role', data.user.role);
                    }
                    
                    showMessage('Login successful! Redirecting...', 'success');
                    
                    // Redirect after short delay
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                    
                } else {
                    showMessage(data.message || 'Login failed. Please check your credentials.', 'error');
                }
                
            } catch (error) {
                console.error('Login error:', error);
                showMessage('Error: ' + error.message, 'error');
            }
        });
    }
    
    // ========== REGISTRATION FORM HANDLER ==========
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const firstName = document.getElementById('regFirstName').value.trim();
            const lastName = document.getElementById('regLastName').value.trim();
            const name = `${firstName} ${lastName}`.trim();
            const email = document.getElementById('regEmail').value.trim();
            const phone = document.getElementById('regPhone').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            const role = localStorage.getItem('selectedRole') || 'public';
            
            // Validation
            if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
                showMessage('Please fill in all fields', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showMessage('Passwords do not match', 'error');
                return;
            }
            
            if (password.length < 6) {
                showMessage('Password must be at least 6 characters', 'error');
                return;
            }
            
            try {
                // Get API URL
                const apiUrl = window.location.hostname === 'localhost' 
                    ? 'http://localhost:5000/api/auth/register'
                    : 'https://jallix-nex-smart-jallikattu-event.onrender.com/api/auth/register';
                
                // Send registration request
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ name, email, phone, password, role })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showMessage('Registration successful! Please login.', 'success');
                    
                    // Clear form
                    registerForm.reset();
                    
                    // Switch to login tab
                    setTimeout(() => {
                        document.querySelector('[data-tab="login"]').click();
                    }, 1500);
                    
                } else {
                    showMessage(data.message || 'Registration failed. Please try again.', 'error');
                }
                
            } catch (error) {
                console.error('Registration error:', error);
                showMessage('Error: ' + error.message, 'error');
            }
        });
    }
    
    // ========== FORM SWITCHING ==========
    const switchToRegister = document.querySelectorAll('.switch-to-register');
    const switchToLogin = document.querySelectorAll('.switch-to-login');
    
    switchToRegister.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('[data-tab="register"]').click();
        });
    });
    
    switchToLogin.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('[data-tab="login"]').click();
        });
    });
    
    // ========== ROLE SELECTION ==========
    const roleButtons = document.querySelectorAll('.role-btn');
    roleButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            roleButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const role = this.dataset.role;
            localStorage.setItem('selectedRole', role);
        });
    });
    
    // ========== PASSWORD TOGGLE ==========
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input[type="password"], input[type="text"]');
            if (input.type === 'password') {
                input.type = 'text';
                this.querySelector('i').classList.remove('fa-eye');
                this.querySelector('i').classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                this.querySelector('i').classList.remove('fa-eye-slash');
                this.querySelector('i').classList.add('fa-eye');
            }
        });
    });
    
});

// Show message function
function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.auth-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message auth-message-${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styling
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        padding: 15px 25px;
        border-radius: 8px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        animation: slideDown 0.3s ease-out;
    `;
    
    document.body.appendChild(messageDiv);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => messageDiv.remove(), 300);
    }, 4000);
}

// Add animation styles
const style = document.createElement('style');
style.innerHTML = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);
