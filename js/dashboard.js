// Dashboard Management for JALLIX-NEX
// Handles dashboard statistics, user profile, and recent activities

class DashboardManager {
    constructor() {
        this.user = null;
        this.stats = {};
        this.token = localStorage.getItem('jallixnex_token') || sessionStorage.getItem('jallixnex_token');
        this.apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:5000/api'
            : 'https://jallix-nex-smart-jallikattu-event.onrender.com/api';
        
        this.initializeDashboard();
    }

    // API Helper Method
    async apiRequest(endpoint, options = {}) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    async initializeDashboard() {
        try {
            // Check if user is logged in
            const userStr = localStorage.getItem('jallixnex_user');
            if (!userStr) {
                // Redirect to login if not authenticated
                window.location.href = 'login.html';
                return;
            }

            this.user = JSON.parse(userStr);

            // Load dashboard data
            await Promise.all([
                this.loadUserProfile(),
                this.loadDashboardStats(),
                this.loadMyBookings()
            ]);

            // Display data
            this.displayUserProfile();
            this.displayDashboardStats();

            // Set up event listeners
            this.setupEventListeners();

        } catch (error) {
            console.error('Dashboard initialization error:', error);
            this.showMessage('Error loading dashboard: ' + error.message, 'error');
        }
    }

    async loadUserProfile() {
        try {
            const response = await this.apiRequest('/auth/me');
            this.user = response.user || response;
            
            // Update localStorage with fresh data
            localStorage.setItem('jallixnex_user', JSON.stringify(this.user));
        } catch (error) {
            console.error('Error loading user profile:', error);
            // Use cached user data
        }
    }

    async loadDashboardStats() {
        try {
            const response = await this.apiRequest('/dashboard/stats');
            this.stats = response.data || response;
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            this.showMessage('Error loading statistics: ' + error.message, 'error');
        }
    }

    async loadMyBookings() {
        try {
            const response = await this.apiRequest('/bookings/my');
            const bookings = response.data || response;
            this.displayMyBookings(bookings);
        } catch (error) {
            console.error('Error loading bookings:', error);
        }
    }

    displayUserProfile() {
        // Update user name
        const userNameEl = document.querySelector('.user-name, .profile-name');
        if (userNameEl) {
            userNameEl.textContent = this.user.name || 'User';
        }

        // Update user role badge
        const roleEl = document.querySelector('.user-role, .profile-role');
        if (roleEl) {
            const roleColors = {
                'admin': 'danger',
                'owner': 'warning',
                'tamer': 'info',
                'public': 'secondary'
            };
            roleEl.textContent = this.user.role?.toUpperCase() || 'PUBLIC';
            roleEl.className = `badge badge-${roleColors[this.user.role] || 'secondary'}`;
        }

        // Update user email
        const emailEl = document.querySelector('.user-email, .profile-email');
        if (emailEl) {
            emailEl.textContent = this.user.email || 'N/A';
        }

        // Update user phone
        const phoneEl = document.querySelector('.user-phone, .profile-phone');
        if (phoneEl) {
            phoneEl.textContent = this.user.phone || 'N/A';
        }

        // Update registration date
        const regDateEl = document.querySelector('.registration-date');
        if (regDateEl && this.user.registration_date) {
            const date = new Date(this.user.registration_date);
            regDateEl.textContent = date.toLocaleDateString();
        }

        // Update last login
        const lastLoginEl = document.querySelector('.last-login');
        if (lastLoginEl && this.user.last_login) {
            const date = new Date(this.user.last_login);
            lastLoginEl.textContent = date.toLocaleString();
        }
    }

    displayDashboardStats() {
        // Total events
        const totalEventsEl = document.querySelector('[data-stat="total-events"]');
        if (totalEventsEl) {
            totalEventsEl.textContent = this.stats.total_events || 0;
        }

        // Total bulls
        const totalBullsEl = document.querySelector('[data-stat="total-bulls"]');
        if (totalBullsEl) {
            totalBullsEl.textContent = this.stats.total_bulls || 0;
        }

        // Total tamers
        const totalTamersEl = document.querySelector('[data-stat="total-tamers"]');
        if (totalTamersEl) {
            totalTamersEl.textContent = this.stats.total_tamers || 0;
        }

        // Total bookings
        const totalBookingsEl = document.querySelector('[data-stat="total-bookings"]');
        if (totalBookingsEl) {
            totalBookingsEl.textContent = this.stats.total_bookings || 0;
        }

        // Active events
        const activeEventsEl = document.querySelector('[data-stat="active-events"]');
        if (activeEventsEl) {
            activeEventsEl.textContent = this.stats.active_events || 0;
        }

        // Pending applications
        const pendingEl = document.querySelector('[data-stat="pending-applications"]');
        if (pendingEl) {
            pendingEl.textContent = this.stats.pending_applications || 0;
        }

        // Total participants
        const participantsEl = document.querySelector('[data-stat="total-participants"]');
        if (participantsEl) {
            participantsEl.textContent = this.stats.total_participants || 0;
        }

        // Revenue
        const revenueEl = document.querySelector('[data-stat="total-revenue"]');
        if (revenueEl) {
            revenueEl.textContent = `₹${this.stats.total_revenue || 0}`;
        }
    }

    displayMyBookings(bookings) {
        const container = document.getElementById('myBookingsContainer');
        if (!container) return;

        if (!bookings || bookings.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No bookings yet</p>';
            return;
        }

        container.innerHTML = bookings.map(booking => `
            <div class="booking-card">
                <div class="booking-header">
                    <h4>${booking.event?.name || 'Event'}</h4>
                    <span class="badge badge-${booking.status === 'confirmed' ? 'success' : 'warning'}">${booking.status}</span>
                </div>
                <div class="booking-details">
                    <p><i class="fas fa-calendar"></i> ${booking.event?.date || 'N/A'}</p>
                    <p><i class="fas fa-map-marker"></i> ${booking.event?.location || 'N/A'}</p>
                    <p><i class="fas fa-info-circle"></i> Booking Date: ${new Date(booking.booking_date).toLocaleDateString()}</p>
                </div>
                <div class="booking-actions">
                    <button class="btn btn-sm btn-danger" onclick="dashboardManager.cancelBooking('${booking.id}')">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        `).join('');
    }

    async cancelBooking(bookingId) {
        if (!confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        try {
            // API endpoint for canceling booking (may need to be implemented in backend)
            const response = await this.apiRequest(`/bookings/${bookingId}`, {
                method: 'DELETE'
            });

            this.showMessage('Booking cancelled successfully', 'success');
            await this.loadMyBookings();
        } catch (error) {
            this.showMessage('Error cancelling booking: ' + error.message, 'error');
        }
    }

    setupEventListeners() {
        // Logout button
        const logoutBtn = document.querySelector('.logout-btn, [data-action="logout"]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }

        // Edit profile button
        const editProfileBtn = document.querySelector('[data-action="edit-profile"]');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => this.toggleEditProfile());
        }

        // Profile form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }
    }

    async handleLogout(e) {
        e.preventDefault();
        
        try {
            // Call logout endpoint
            await this.apiRequest('/auth/logout', {
                method: 'POST'
            });

            // Clear local storage
            localStorage.removeItem('jallixnex_token');
            localStorage.removeItem('jallixnex_user');
            sessionStorage.removeItem('jallixnex_token');

            // Redirect to login
            this.showMessage('Logout successful', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        } catch (error) {
            console.error('Logout error:', error);
            // Clear anyway
            localStorage.removeItem('jallixnex_token');
            localStorage.removeItem('jallixnex_user');
            window.location.href = 'login.html';
        }
    }

    toggleEditProfile() {
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.style.display = profileForm.style.display === 'none' ? 'block' : 'none';
        }
    }

    async handleProfileUpdate(e) {
        e.preventDefault();

        try {
            const updatedData = {
                name: document.getElementById('profileName')?.value,
                phone: document.getElementById('profilePhone')?.value,
                // Add other updatable fields as needed
            };

            const response = await this.apiRequest(`/users/${this.user.id}`, {
                method: 'PUT',
                body: JSON.stringify(updatedData)
            });

            this.user = response.user || response;
            localStorage.setItem('jallixnex_user', JSON.stringify(this.user));
            this.displayUserProfile();

            this.showMessage('Profile updated successfully', 'success');
            this.toggleEditProfile();
        } catch (error) {
            this.showMessage('Error updating profile: ' + error.message, 'error');
        }
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existing = document.querySelectorAll('.message-alert');
        existing.forEach(el => el.remove());

        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message-alert alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            min-width: 300px;
            padding: 15px;
            border-radius: 8px;
        `;

        document.body.appendChild(messageEl);

        // Auto remove after 4 seconds
        setTimeout(() => messageEl.remove(), 4000);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    window.dashboardManager = new DashboardManager();
});
