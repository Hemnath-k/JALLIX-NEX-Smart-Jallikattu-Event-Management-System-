// Sponsors Management for JALLIX-NEX
// Handles sponsor creation, listing, and management

class SponsorsManager {
    constructor() {
        this.sponsors = [];
        this.currentUser = null;
        this.token = localStorage.getItem('jallixnex_token') || sessionStorage.getItem('jallixnex_token');
        this.apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:5000/api'
            : 'https://jallix-nex-smart-jallikattu-event.onrender.com/api';
        
        this.initializeSponsors();
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

    async initializeSponsors() {
        try {
            // Check if user is logged in
            const userStr = localStorage.getItem('jallixnex_user');
            if (userStr) {
                this.currentUser = JSON.parse(userStr);
            }

            // Load sponsors
            await this.loadSponsors();

            // Set up event listeners
            this.setupEventListeners();

            // Update form visibility
            this.updateFormVisibility();
        } catch (error) {
            console.error('Sponsors initialization error:', error);
        }
    }

    async loadSponsors() {
        try {
            const response = await this.apiRequest('/sponsors');
            this.sponsors = response.data || response;
            
            if (Array.isArray(this.sponsors)) {
                this.displaySponsors();
            }
        } catch (error) {
            console.error('Error loading sponsors:', error);
            this.showMessage('Error loading sponsors: ' + error.message, 'error');
        }
    }

    displaySponsors() {
        const container = document.getElementById('sponsorsContainer');
        if (!container) return;

        if (this.sponsors.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No sponsors registered yet</p>';
            return;
        }

        container.innerHTML = this.sponsors.map(sponsor => `
            <div class="sponsor-card">
                <div class="sponsor-header">
                    <h3>${sponsor.company_name || sponsor.name || 'N/A'}</h3>
                    <span class="badge badge-${sponsor.status === 'active' ? 'success' : 'warning'}">${sponsor.status || 'pending'}</span>
                </div>
                <div class="sponsor-details">
                    <p><i class="fas fa-envelope"></i> ${sponsor.contact_email || 'N/A'}</p>
                    <p><i class="fas fa-phone"></i> ${sponsor.contact_phone || 'N/A'}</p>
                    <p><i class="fas fa-map-marker"></i> ${sponsor.location || 'N/A'}</p>
                </div>
                <div class="sponsor-info">
                    <p>Sponsorship: <strong>${sponsor.sponsorship_type || 'N/A'}</strong></p>
                    <p>Amount: <strong>₹${sponsor.sponsorship_amount || 0}</strong></p>
                </div>
                <div class="sponsor-actions">
                    <button class="btn btn-sm btn-primary" onclick="sponsorsManager.viewSponsor('${sponsor.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    ${this.currentUser?.role === 'admin' ? `
                        <button class="btn btn-sm btn-danger" onclick="sponsorsManager.deleteSponsor('${sponsor.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Sponsor form
        const sponsorForm = document.getElementById('sponsorForm');
        if (sponsorForm) {
            sponsorForm.addEventListener('submit', (e) => this.handleSponsorSubmit(e));
        }

        // Add sponsor button
        const addSponsorBtn = document.getElementById('addSponsorBtn');
        if (addSponsorBtn) {
            addSponsorBtn.addEventListener('click', () => this.toggleSponsorForm());
        }

        // Cancel button
        const cancelSponsorBtn = document.getElementById('cancelSponsorBtn');
        if (cancelSponsorBtn) {
            cancelSponsorBtn.addEventListener('click', () => this.toggleSponsorForm());
        }
    }

    toggleSponsorForm() {
        const formContainer = document.getElementById('sponsorFormContainer');
        if (formContainer) {
            formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
        }
    }

    async handleSponsorSubmit(e) {
        e.preventDefault();

        if (!this.token) {
            this.showMessage('Please login to add a sponsor', 'error');
            window.location.href = 'login.html';
            return;
        }

        try {
            const sponsorData = {
                company_name: document.getElementById('sponsorName')?.value,
                sponsorship_type: document.getElementById('sponsorshipType')?.value,
                sponsorship_amount: parseFloat(document.getElementById('sponsorshipAmount')?.value),
                contact_name: document.getElementById('sponsorContactName')?.value,
                contact_email: document.getElementById('sponsorContactEmail')?.value,
                contact_phone: document.getElementById('sponsorContactPhone')?.value,
                location: document.getElementById('sponsorLocation')?.value,
                description: document.getElementById('sponsorDescription')?.value || ''
            };

            // Validate required fields
            if (!sponsorData.company_name || !sponsorData.sponsorship_type || !sponsorData.sponsorship_amount) {
                this.showMessage('Please fill in all required fields', 'error');
                return;
            }

            const response = await this.apiRequest('/sponsors', {
                method: 'POST',
                body: JSON.stringify(sponsorData)
            });

            this.showMessage('Sponsor added successfully!', 'success');
            document.getElementById('sponsorForm').reset();
            this.toggleSponsorForm();
            await this.loadSponsors();

        } catch (error) {
            console.error('Error adding sponsor:', error);
            this.showMessage('Error adding sponsor: ' + error.message, 'error');
        }
    }

    async viewSponsor(sponsorId) {
        try {
            const sponsor = this.sponsors.find(s => s.id === sponsorId);
            if (sponsor) {
                console.log('Sponsor details:', sponsor);
                alert(`Sponsor: ${sponsor.company_name}\nType: ${sponsor.sponsorship_type}\nAmount: ₹${sponsor.sponsorship_amount}`);
            }
        } catch (error) {
            this.showMessage('Error viewing sponsor: ' + error.message, 'error');
        }
    }

    async deleteSponsor(sponsorId) {
        if (!confirm('Are you sure you want to delete this sponsor?')) {
            return;
        }

        try {
            await this.apiRequest(`/sponsors/${sponsorId}`, {
                method: 'DELETE'
            });

            this.showMessage('Sponsor deleted successfully', 'success');
            await this.loadSponsors();
        } catch (error) {
            this.showMessage('Error deleting sponsor: ' + error.message, 'error');
        }
    }

    updateFormVisibility() {
        const formContainer = document.getElementById('sponsorFormContainer');
        if (formContainer) {
            formContainer.style.display = 'none';
        }
    }

    showMessage(message, type = 'info') {
        const existing = document.querySelectorAll('.message-alert');
        existing.forEach(el => el.remove());

        const messageEl = document.createElement('div');
        messageEl.className = `message-alert alert alert-${type === 'success' ? 'success' : 'error' ? 'danger' : 'info'}`;
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
        setTimeout(() => messageEl.remove(), 4000);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    window.sponsorsManager = new SponsorsManager();
});
