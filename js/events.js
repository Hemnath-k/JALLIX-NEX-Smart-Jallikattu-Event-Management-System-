// Events Management for JALLIX-NEX
// Handles event creation, listing, and booking

class EventsManager {
    constructor() {
        this.events = [];
        this.currentUser = null;
        this.token = localStorage.getItem('jallixnex_token') || sessionStorage.getItem('jallixnex_token');
        this.apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:5000/api'
            : 'https://jallix-nex-smart-jallikattu-event.onrender.com/api';
        
        this.initializeEvents();
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

    async initializeEvents() {
        try {
            // Check if user is logged in
            const userStr = localStorage.getItem('jallixnex_user');
            if (userStr) {
                this.currentUser = JSON.parse(userStr);
            }

            // Load events
            await this.loadEvents();

            // Set up event listeners
            this.setupEventListeners();

            // Show/hide forms based on user role
            this.updateFormVisibility();
        } catch (error) {
            console.error('Events initialization error:', error);
        }
    }

    async loadEvents() {
        try {
            const response = await this.apiRequest('/events');
            this.events = response.data || response;
            
            if (Array.isArray(this.events)) {
                this.displayEvents();
            }
        } catch (error) {
            console.error('Error loading events:', error);
            this.showMessage('Error loading events: ' + error.message, 'error');
        }
    }

    displayEvents() {
        const container = document.getElementById('eventsContainer');
        if (!container) return;

        if (this.events.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No events found</p>';
            return;
        }

        container.innerHTML = this.events.map(event => `
            <div class="event-card">
                <div class="event-header">
                    <h3>${event.name || event.event_name}</h3>
                    <span class="event-type badge badge-${event.type || 'info'}">${event.type || 'Unknown'}</span>
                </div>
                <div class="event-details">
                    <p><i class="fas fa-calendar"></i> ${event.date || event.event_date}</p>
                    <p><i class="fas fa-map-marker"></i> ${event.location || event.venue}</p>
                    <p><i class="fas fa-clock"></i> ${event.start_time} - ${event.end_time}</p>
                </div>
                <div class="event-info">
                    <p>Max Bulls: <strong>${event.max_bulls}</strong></p>
                    <p>Entry Fee: <strong>₹${event.entry_fee || 0}</strong></p>
                </div>
                <div class="event-actions">
                    <button class="btn btn-sm btn-primary" onclick="eventsManager.viewEvent('${event.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-sm btn-success" onclick="eventsManager.bookEvent('${event.id}')">
                        <i class="fas fa-check"></i> Register
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Event creation form
        const eventForm = document.getElementById('eventForm');
        if (eventForm) {
            eventForm.addEventListener('submit', (e) => this.handleEventSubmit(e));
        }

        // Event creation button
        const createEventBtn = document.getElementById('createEventBtn');
        if (createEventBtn) {
            createEventBtn.addEventListener('click', () => this.toggleEventForm());
        }

        // Cancel button
        const cancelEventBtn = document.getElementById('cancelEventBtn');
        if (cancelEventBtn) {
            cancelEventBtn.addEventListener('click', () => this.toggleEventForm());
        }
    }

    toggleEventForm() {
        const formContainer = document.getElementById('eventCreationForm');
        if (formContainer) {
            formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
        }
    }

    async handleEventSubmit(e) {
        e.preventDefault();

        // Validate user is logged in
        if (!this.token) {
            this.showMessage('Please login to create an event', 'error');
            window.location.href = 'login.html';
            return;
        }

        try {
            // Collect form data
            const eventData = {
                name: document.getElementById('eventName')?.value,
                type: document.getElementById('eventType')?.value,
                description: document.getElementById('eventDescription')?.value,
                date: document.getElementById('eventDate')?.value,
                start_time: document.getElementById('eventStartTime')?.value,
                end_time: document.getElementById('eventEndTime')?.value,
                registration_deadline: document.getElementById('registrationDeadline')?.value,
                location: document.getElementById('eventLocation')?.value,
                address: document.getElementById('eventAddress')?.value,
                district: document.getElementById('district')?.value,
                state: document.getElementById('state')?.value || 'Tamil Nadu',
                max_bulls: parseInt(document.getElementById('maxBulls')?.value),
                max_tamers: parseInt(document.getElementById('maxTamers')?.value) || 0,
                entry_fee: parseFloat(document.getElementById('entryFee')?.value) || 0,
                min_bull_age: parseInt(document.getElementById('minBullAge')?.value) || 3,
                require_certification: document.getElementById('requireCertification')?.checked || false,
                require_medical: document.getElementById('requireMedical')?.checked || false,
                require_owner_id: document.getElementById('requireOwnerID')?.checked || false,
                is_active: document.getElementById('isActive')?.checked || true,
                rules: document.getElementById('eventRules')?.value || ''
            };

            // Validate required fields
            if (!eventData.name || !eventData.type || !eventData.date || !eventData.start_time || 
                !eventData.end_time || !eventData.location || !eventData.max_bulls) {
                this.showMessage('Please fill in all required fields', 'error');
                return;
            }

            // Create event via API
            const response = await this.apiRequest('/events', {
                method: 'POST',
                body: JSON.stringify(eventData)
            });

            this.showMessage('Event created successfully!', 'success');
            
            // Reset form
            document.getElementById('eventForm').reset();
            this.toggleEventForm();

            // Reload events
            await this.loadEvents();

        } catch (error) {
            console.error('Error creating event:', error);
            this.showMessage('Error creating event: ' + error.message, 'error');
        }
    }

    async viewEvent(eventId) {
        try {
            const event = this.events.find(e => e.id === eventId);
            if (event) {
                console.log('Event details:', event);
                // Could open a modal or detailed view
                alert(`Event: ${event.name || event.event_name}\nDate: ${event.date}\nLocation: ${event.location}`);
            }
        } catch (error) {
            this.showMessage('Error viewing event: ' + error.message, 'error');
        }
    }

    async bookEvent(eventId) {
        if (!this.token) {
            this.showMessage('Please login to register for an event', 'error');
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await this.apiRequest(`/events/${eventId}/book`, {
                method: 'POST',
                body: JSON.stringify({})
            });

            this.showMessage('Event registration successful!', 'success');
            await this.loadEvents();
        } catch (error) {
            this.showMessage('Error registering for event: ' + error.message, 'error');
        }
    }

    updateFormVisibility() {
        const eventCreationForm = document.getElementById('eventCreationForm');
        if (eventCreationForm && this.currentUser) {
            // Show form only for admin/owner
            if (this.currentUser.role === 'admin' || this.currentUser.role === 'owner') {
                eventCreationForm.style.display = 'none'; // Hidden by default, show via button
            } else {
                eventCreationForm.style.display = 'none';
            }
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
    window.eventsManager = new EventsManager();
});
