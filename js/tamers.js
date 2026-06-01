// Tamer Registration and Management for JALLIX-NEX
// Handles tamer registration, profile management, and file uploads

class TamersManager {
    constructor() {
        this.tamers = [];
        this.currentUser = null;
        this.token = localStorage.getItem('jallixnex_token') || sessionStorage.getItem('jallixnex_token');
        this.apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:5000/api'
            : 'https://jallix-nex-smart-jallikattu-event.onrender.com/api';
        
        this.initializeTamers();
    }

    // API Helper Method
    async apiRequest(endpoint, options = {}) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        const config = {
            headers: {
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Only add Content-Type if not FormData (for file uploads)
        if (!(options.body instanceof FormData)) {
            config.headers['Content-Type'] = 'application/json';
        }

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

    async initializeTamers() {
        try {
            // Check if user is logged in
            const userStr = localStorage.getItem('jallixnex_user');
            if (userStr) {
                this.currentUser = JSON.parse(userStr);
            }

            // Load tamers
            await this.loadTamers();

            // Set up event listeners
            this.setupEventListeners();

            // Update form visibility based on user role
            this.updateFormVisibility();
        } catch (error) {
            console.error('Tamers initialization error:', error);
        }
    }

    async loadTamers() {
        try {
            const response = await this.apiRequest('/tamers');
            this.tamers = response.data || response;
            
            if (Array.isArray(this.tamers)) {
                this.displayTamers();
            }
        } catch (error) {
            console.error('Error loading tamers:', error);
            this.showMessage('Error loading tamers: ' + error.message, 'error');
        }
    }

    displayTamers() {
        const container = document.getElementById('tamersContainer');
        if (!container) return;

        if (this.tamers.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No tamers registered yet</p>';
            return;
        }

        container.innerHTML = this.tamers.map(tamer => `
            <div class="tamer-card">
                <div class="tamer-header">
                    <h3>${tamer.name || tamer.user?.name || 'N/A'}</h3>
                    <span class="badge badge-${tamer.status === 'active' ? 'success' : 'warning'}">${tamer.status || 'pending'}</span>
                </div>
                <div class="tamer-details">
                    <p><i class="fas fa-envelope"></i> ${tamer.user?.email || 'N/A'}</p>
                    <p><i class="fas fa-phone"></i> ${tamer.user?.phone || 'N/A'}</p>
                    <p><i class="fas fa-map-marker"></i> ${tamer.city || 'N/A'}, ${tamer.state || 'TN'}</p>
                </div>
                <div class="tamer-info">
                    <p>Experience: <strong>${tamer.experience || 'N/A'}</strong></p>
                    <p>Specialization: <strong>${tamer.specialization || 'N/A'}</strong></p>
                </div>
                <div class="tamer-actions">
                    <button class="btn btn-sm btn-primary" onclick="tamersManager.viewTamer('${tamer.id}')">
                        <i class="fas fa-eye"></i> View Profile
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Tamer registration form
        const tamerForm = document.getElementById('tamerForm');
        if (tamerForm) {
            tamerForm.addEventListener('submit', (e) => this.handleTamerSubmit(e));
        }

        // Register tamer button
        const registerTamerBtn = document.getElementById('registerTamerBtn');
        if (registerTamerBtn) {
            registerTamerBtn.addEventListener('click', () => this.toggleTamerForm());
        }

        // Cancel button
        const cancelTamerBtn = document.getElementById('cancelTamerBtn');
        if (cancelTamerBtn) {
            cancelTamerBtn.addEventListener('click', () => this.toggleTamerForm());
        }

        // File upload preview
        const idProof = document.getElementById('idProof');
        const medicalCert = document.getElementById('medicalCertificate');
        
        if (idProof) {
            idProof.addEventListener('change', (e) => this.handleFileSelect(e, 'idProof'));
        }
        if (medicalCert) {
            medicalCert.addEventListener('change', (e) => this.handleFileSelect(e, 'medicalCertificate'));
        }
    }

    toggleTamerForm() {
        const formContainer = document.getElementById('tamerRegistrationForm');
        if (formContainer) {
            formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
        }
    }

    handleFileSelect(e, fieldName) {
        const file = e.target.files[0];
        if (file) {
            const fileName = file.name;
            const fileSize = (file.size / 1024).toFixed(2);
            console.log(`${fieldName}: ${fileName} (${fileSize}KB)`);
            
            // Show file name to user
            const label = e.target.previousElementSibling;
            if (label) {
                label.innerHTML = `<i class="fas fa-check"></i> ${fileName} selected (${fileSize}KB)`;
            }
        }
    }

    async handleTamerSubmit(e) {
        e.preventDefault();

        // Validate user is logged in
        if (!this.token) {
            this.showMessage('Please login to register as a tamer', 'error');
            window.location.href = 'login.html';
            return;
        }

        try {
            // Collect form data
            const formData = new FormData();
            
            const firstName = document.getElementById('tamerFirstName')?.value;
            const lastName = document.getElementById('tamerLastName')?.value;
            const name = `${firstName} ${lastName}`.trim();

            formData.append('name', name);
            formData.append('email', document.getElementById('tamerEmail')?.value);
            formData.append('phone', document.getElementById('tamerPhone')?.value);
            formData.append('age', parseInt(document.getElementById('tamerAge')?.value));
            formData.append('gender', document.getElementById('tamerGender')?.value);
            formData.append('height', parseInt(document.getElementById('tamerHeight')?.value) || 0);
            formData.append('weight', parseInt(document.getElementById('tamerWeight')?.value) || 0);
            formData.append('address', document.getElementById('tamerAddress')?.value);
            formData.append('city', document.getElementById('tamerCity')?.value);
            formData.append('state', document.getElementById('tamerState')?.value || 'Tamil Nadu');
            formData.append('experience', document.getElementById('tamerExperience')?.value);
            formData.append('specialization', document.getElementById('tamerSpecialization')?.value || '');
            formData.append('previous_events', document.getElementById('tamerEvents')?.value || '');
            formData.append('achievements', document.getElementById('tamerAchievements')?.value || '');
            formData.append('training_certs', document.getElementById('tamerTraining')?.value || '');
            formData.append('blood_group', document.getElementById('tamerBloodGroup')?.value || '');
            formData.append('medical_conditions', document.getElementById('tamerMedicalConditions')?.value || '');
            formData.append('emergency_contact_name', document.getElementById('emergencyName')?.value);
            formData.append('emergency_contact_phone', document.getElementById('emergencyPhone')?.value);

            // Add file uploads
            const idProofFile = document.getElementById('idProof')?.files[0];
            const medicalCertFile = document.getElementById('medicalCertificate')?.files[0];

            if (!idProofFile || !medicalCertFile) {
                this.showMessage('Please upload both ID proof and medical certificate', 'error');
                return;
            }

            formData.append('id_proof', idProofFile);
            formData.append('medical_certificate', medicalCertFile);

            // Validate required fields
            const requiredFields = {
                firstName, lastName, email: document.getElementById('tamerEmail')?.value,
                phone: document.getElementById('tamerPhone')?.value,
                age: document.getElementById('tamerAge')?.value,
                gender: document.getElementById('tamerGender')?.value,
                address: document.getElementById('tamerAddress')?.value,
                city: document.getElementById('tamerCity')?.value,
                experience: document.getElementById('tamerExperience')?.value,
                emergency_name: document.getElementById('emergencyName')?.value,
                emergency_phone: document.getElementById('emergencyPhone')?.value
            };

            for (let [key, value] of Object.entries(requiredFields)) {
                if (!value) {
                    this.showMessage(`Please fill in all required fields (${key})`, 'error');
                    return;
                }
            }

            // Register tamer via API
            const response = await this.apiRequest('/tamers', {
                method: 'POST',
                body: formData
            });

            this.showMessage('Tamer registered successfully! Please wait for admin verification.', 'success');
            
            // Reset form
            document.getElementById('tamerForm').reset();
            this.toggleTamerForm();

            // Reload tamers
            await this.loadTamers();

        } catch (error) {
            console.error('Error registering tamer:', error);
            this.showMessage('Error registering tamer: ' + error.message, 'error');
        }
    }

    async viewTamer(tamerId) {
        try {
            const tamer = this.tamers.find(t => t.id === tamerId);
            if (tamer) {
                console.log('Tamer details:', tamer);
                // Could open a modal or detailed profile view
                const name = tamer.name || tamer.user?.name || 'N/A';
                alert(`Tamer: ${name}\nExperience: ${tamer.experience}\nStatus: ${tamer.status}`);
            }
        } catch (error) {
            this.showMessage('Error viewing tamer: ' + error.message, 'error');
        }
    }

    updateFormVisibility() {
        const tamerRegistrationForm = document.getElementById('tamerRegistrationForm');
        if (tamerRegistrationForm) {
            // Show form for everyone (but backend will validate)
            tamerRegistrationForm.style.display = 'none'; // Hidden by default, show via button
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

        // Auto remove after 5 seconds
        setTimeout(() => messageEl.remove(), 5000);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    window.tamersManager = new TamersManager();
});
