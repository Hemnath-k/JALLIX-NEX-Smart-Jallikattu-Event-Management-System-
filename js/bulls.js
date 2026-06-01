// Bull Registration and Management for JALLIX-NEX
// API Integration with Flask Backend

// Dynamic API URL - use production backend in deployment
var API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api'
  : 'https://jallix-nex-smart-jallikattu-event.onrender.com/api';

class BullsManager {
    constructor() {
        this.bulls = [];
        this.currentUser = null;
        this.token = localStorage.getItem('jallixnex_token') || sessionStorage.getItem('jallixnex_token');
        this.initializeBulls();
    }

    // API Helper Method
    async apiRequest(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
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


    async initializeBulls() {
        // Get current user from storage
        const userData = localStorage.getItem('jallixnex_user') || sessionStorage.getItem('jallixnex_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
        
        await this.loadBulls();
        this.setupEventListeners();
        this.setupSearchFilter();
    }

    async loadBulls() {
        const tableBody = document.getElementById('bullsTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';

        try {
            const data = await this.apiRequest('/bulls');
            this.bulls = data.bulls || [];
            
            tableBody.innerHTML = '';

            if (this.bulls.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No bulls found</td></tr>';
                return;
            }

            this.bulls.forEach((bull, index) => {
                const row = this.createBullRow(bull);
                tableBody.appendChild(row);
                
                // Add animation delay
                row.style.animationDelay = `${index * 0.1}s`;
            });
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error loading bulls: ${error.message}</td></tr>`;
            console.error('Failed to load bulls:', error);
        }
    }


    createBullRow(bull) {
        const row = document.createElement('tr');
        
        // Determine status badge
        let certStatus = '';
        let certClass = '';
        let regStatus = '';
        let regClass = '';
        
        switch(bull.certificateStatus) {
            case 'verified':
                certStatus = 'Verified';
                certClass = 'status-approved';
                break;
            case 'pending':
                certStatus = 'Pending';
                certClass = 'status-pending';
                break;
            case 'expired':
                certStatus = 'Expired';
                certClass = 'status-rejected';
                break;
            default:
                certStatus = 'Not Submitted';
                certClass = 'status-pending';
        }
        
        switch(bull.registrationStatus) {
            case 'active':
                regStatus = 'Active';
                regClass = 'status-approved';
                break;
            case 'pending':
                regStatus = 'Pending';
                regClass = 'status-pending';
                break;
            case 'rejected':
                regStatus = 'Rejected';
                regClass = 'status-rejected';
                break;
            case 'suspended':
                regStatus = 'Suspended';
                regClass = 'status-rejected';
                break;
        }

        row.innerHTML = `
            <td>
                <div class="bull-name">
                    <strong>${bull.name}</strong>
                    <small>ID: ${bull.id}</small>
                </div>
            </td>
            <td>${bull.breed}</td>
            <td>
                <div class="owner-info">
                    <strong>${bull.ownerName}</strong>
                    <small>${bull.ownerPhone}</small>
                </div>
            </td>
            <td>${bull.age} years</td>
            <td><span class="status-badge ${certClass}">${certStatus}</span></td>
            <td><span class="status-badge ${regClass}">${regStatus}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action view" data-id="${bull.id}" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action edit" data-id="${bull.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${this.currentUser && this.currentUser.role === 'admin' ? 
                        `<button class="btn-action verify" data-id="${bull.id}" title="Verify">
                            <i class="fas fa-check"></i>
                        </button>` : 
                        `<button class="btn-action book" data-id="${bull.id}" title="Book Event">
                            <i class="fas fa-calendar-plus"></i>
                        </button>`
                    }
                </div>
            </td>
        `;

        return row;
    }

    setupEventListeners() {
        // Register bull button
        const registerBtn = document.getElementById('registerBullBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                this.showBullForm();
            });
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancelBullForm');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideBullForm();
            });
        }

        // Bull form submission
        const bullForm = document.getElementById('bullForm');
        if (bullForm) {
            bullForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBullSubmission();
            });
        }

        // Bulk upload button
        const bulkBtn = document.getElementById('bulkUploadBtn');
        if (bulkBtn) {
            bulkBtn.addEventListener('click', () => {
                this.showBulkUpload();
            });
        }

        // Handle dynamic actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.view')) {
                const bullId = e.target.closest('.view').dataset.id;
                this.viewBullDetails(bullId);
            } else if (e.target.closest('.edit')) {
                const bullId = e.target.closest('.edit').dataset.id;
                this.editBull(bullId);
            } else if (e.target.closest('.verify')) {
                const bullId = e.target.closest('.verify').dataset.id;
                this.verifyBull(bullId);
            } else if (e.target.closest('.book')) {
                const bullId = e.target.closest('.book').dataset.id;
                this.bookEventForBull(bullId);
            }
        });
    }

    setupSearchFilter() {
        const searchInput = document.getElementById('searchBulls');
        const statusFilter = document.getElementById('filterStatus');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterBulls(e.target.value, statusFilter ? statusFilter.value : '');
            });
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterBulls(searchInput ? searchInput.value : '', e.target.value);
            });
        }
    }

    filterBulls(searchTerm = '', status = '') {
        const tableBody = document.getElementById('bullsTableBody');
        if (!tableBody) return;

        const filteredBulls = this.bulls.filter(bull => {
            const matchesSearch = !searchTerm || 
                bull.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bull.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bull.breed.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = !status || 
                bull.registrationStatus === status ||
                bull.certificateStatus === status;
            
            return matchesSearch && matchesStatus;
        });

        tableBody.innerHTML = '';
        filteredBulls.forEach((bull, index) => {
            const row = this.createBullRow(bull);
            tableBody.appendChild(row);
            row.style.animationDelay = `${index * 0.1}s`;
        });
    }

    showBullForm(bull = null) {
        const formContainer = document.getElementById('bullRegistrationForm');
        const form = document.getElementById('bullForm');
        const title = formContainer.querySelector('.form-title');
        
        if (bull) {
            // Edit mode
            title.textContent = 'Edit Bull Information';
            this.populateBullForm(bull);
        } else {
            // Create mode
            title.textContent = 'Register New Bull';
            form.reset();
            
            // Set current user as owner if logged in
            if (this.currentUser && this.currentUser.role === 'owner') {
                document.getElementById('ownerName').value = this.currentUser.name;
                document.getElementById('ownerEmail').value = this.currentUser.email;
                document.getElementById('ownerPhone').value = this.currentUser.phone || '';
            }
        }
        
        formContainer.style.display = 'block';
        setTimeout(() => {
            formContainer.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    hideBullForm() {
        const formContainer = document.getElementById('bullRegistrationForm');
        formContainer.style.display = 'none';
        document.getElementById('bullForm').reset();
    }

    populateBullForm(bull) {
        document.getElementById('ownerName').value = bull.ownerName;
        document.getElementById('ownerAadhaar').value = bull.ownerAadhaar || '';
        document.getElementById('ownerPhone').value = bull.ownerPhone;
        document.getElementById('ownerEmail').value = bull.ownerEmail || '';
        document.getElementById('ownerAddress').value = bull.ownerAddress || '';
        document.getElementById('bullName').value = bull.name;
        document.getElementById('bullBreed').value = bull.breed;
        document.getElementById('bullAge').value = bull.age;
        document.getElementById('bullColor').value = bull.color || '';
        document.getElementById('bullWeight').value = bull.weight || '';
        document.getElementById('bullHeight').value = bull.height || '';
        document.getElementById('bullHistory').value = bull.history || '';
        document.getElementById('bullSpecialFeatures').value = bull.specialFeatures || '';
        document.getElementById('paymentMethod').value = bull.paymentMethod || '';
    }

    async handleBullSubmission() {
        const getVal = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : null; };
        
        // Validate required fields
        const requiredFields = [
            'ownerName', 'ownerAadhaar', 'ownerPhone', 'ownerEmail', 'ownerAddress',
            'bullName', 'bullBreed', 'bullAge'
        ];
        
        for (const field of requiredFields) {
            if (!getVal(field)) {
                this.showMessage(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
                return;
            }
        }

        const bullId = getVal('bullId');
        const bullData = {
            name: getVal('bullName'),
            breed: getVal('bullBreed'),
            age: parseInt(getVal('bullAge')),
            color: getVal('bullColor'),
            weight: getVal('bullWeight') ? parseInt(getVal('bullWeight')) : null,
            height: getVal('bullHeight') ? parseInt(getVal('bullHeight')) : null,
            history: getVal('bullHistory'),
            special_features: getVal('bullSpecialFeatures'),
            owner_name: getVal('ownerName'),
            owner_aadhaar: getVal('ownerAadhaar'),
            owner_phone: getVal('ownerPhone'),
            owner_email: getVal('ownerEmail'),
            owner_address: getVal('ownerAddress')
        };

        try {
            let result;
            
            if (bullId) {
                // Update existing bull
                result = await this.apiRequest(`/bulls/${bullId}`, {
                    method: 'PUT',
                    body: JSON.stringify(bullData)
                });
                this.showMessage('Bull information updated successfully!', 'success');
            } else {
                // Create new bull
                result = await this.apiRequest('/bulls', {
                    method: 'POST',
                    body: JSON.stringify(bullData)
                });
                this.showMessage('Bull registration submitted successfully! Registration fee: ₹3,000', 'success');
                
                // Show payment confirmation
                setTimeout(() => {
                    this.showPaymentConfirmation(result.bull);
                }, 1000);
            }

            // Reload bulls
            await this.loadBulls();
            
            // Hide form
            this.hideBullForm();

        } catch (error) {
            this.showMessage(error.message || 'Failed to save bull. Please try again.', 'error');
        }
    }


    showPaymentConfirmation(bull) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Payment Confirmation</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="payment-confirmation">
                        <div class="confirmation-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <h4>Registration Successful!</h4>
                        <p>Bull <strong>"${bull.name}"</strong> has been registered successfully.</p>
                        
                        <div class="payment-details">
                            <div class="detail-item">
                                <span>Bull ID:</span>
                                <strong>${bull.id}</strong>
                            </div>
                            <div class="detail-item">
                                <span>Owner:</span>
                                <strong>${bull.ownerName}</strong>
                            </div>
                            <div class="detail-item">
                                <span>Amount Paid:</span>
                                <strong>₹3,000</strong>
                            </div>
                            <div class="detail-item">
                                <span>Payment Method:</span>
                                <strong>${bull.paymentMethod}</strong>
                            </div>
                            <div class="detail-item">
                                <span>Transaction ID:</span>
                                <strong>${this.generateId('TXN')}</strong>
                            </div>
                        </div>
                        
                        <div class="next-steps">
                            <h5>Next Steps:</h5>
                            <ol>
                                <li>Your registration is now pending verification</li>
                                <li>You will receive an email once verified (24-48 hours)</li>
                                <li>After verification, you can book event slots</li>
                                <li>Keep your veterinary certificate updated</li>
                            </ol>
                        </div>
                        
                        <div class="actions">
                            <button class="btn btn-primary" id="downloadReceipt">Download Receipt</button>
                            <button class="btn btn-outline" id="bookEventNow">Book Event Now</button>
                            <button class="btn btn-secondary" id="closePayment">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // Close modal
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.querySelector('#closePayment').addEventListener('click', closeModal);
        
        // Action buttons
        modal.querySelector('#downloadReceipt').addEventListener('click', () => {
            this.downloadReceipt(bull);
        });
        
        modal.querySelector('#bookEventNow').addEventListener('click', () => {
            closeModal();
            window.location.href = 'events.html';
        });
    }

    viewBullDetails(bullId) {
        const bull = this.bulls.find(b => b.id === bullId);
        if (!bull) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Bull Details - ${bull.name}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="bull-details">
                        <div class="detail-section">
                            <h4>Basic Information</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <strong>Bull ID:</strong>
                                    <span>${bull.id}</span>
                                </div>
                                <div class="detail-item">
                                    <strong>Name:</strong>
                                    <span>${bull.name}</span>
                                </div>
                                <div class="detail-item">
                                    <strong>Breed:</strong>
                                    <span>${bull.breed}</span>
                                </div>
                                <div class="detail-item">
                                    <strong>Age:</strong>
                                    <span>${bull.age} years</span>
                                </div>
                                <div class="detail-item">
                                    <strong>Color:</strong>
                                    <span>${bull.color || 'Not specified'}</span>
                                </div>
                                <div class="detail-item">
                                    <strong>Weight:</strong>
                                    <span>${bull.weight ? bull.weight + ' kg' : 'Not specified'}</span>
                                </div>
                                <div class="detail-item">
                                    <strong>Height:</strong>
                                    <span>${bull.height ? bull.height + ' cm' : 'Not specified'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Owner Information</h4>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <strong>Owner Name:</strong>
                                    <span>${bull.ownerName}</span>
                                </div>
                                <div class="detail-item">
                                    <strong>Aadhaar:</strong>
                                    <span>${bull.ownerAadhaar}</span>
                                </div>
                                <div class="detail-item">
                                    <strong>Phone:</strong>
                                    <span>${bull.ownerPhone}</span>
                                </div>
                                <div class="detail-item">
                                    <strong>Email:</strong>
                                    <span>${bull.ownerEmail}</span>
                                </div>
                                <div class="detail-item">
                                    <strong>Address:</strong>
                                    <span>${bull.ownerAddress}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Registration Status</h4>
                            <div class="status-grid">
                                <div class="status-item">
                                    <strong>Certificate Status:</strong>
                                    <span class="status-badge ${bull.certificateStatus === 'verified' ? 'status-approved' : bull.certificateStatus === 'pending' ? 'status-pending' : 'status-rejected'}">
                                        ${bull.certificateStatus.charAt(0).toUpperCase() + bull.certificateStatus.slice(1)}
                                    </span>
                                </div>
                                <div class="status-item">
                                    <strong>Registration Status:</strong>
                                    <span class="status-badge ${bull.registrationStatus === 'active' ? 'status-approved' : bull.registrationStatus === 'pending' ? 'status-pending' : 'status-rejected'}">
                                        ${bull.registrationStatus.charAt(0).toUpperCase() + bull.registrationStatus.slice(1)}
                                    </span>
                                </div>
                                <div class="status-item">
                                    <strong>Registered On:</strong>
                                    <span>${this.formatDate(bull.registrationDate)}</span>
                                </div>
                                <div class="status-item">
                                    <strong>Last Updated:</strong>
                                    <span>${this.formatDate(bull.lastUpdated)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Event History</h4>
                            ${bull.events && bull.events.length > 0 ? 
                                `<div class="events-list">
                                    ${bull.events.map(event => `
                                        <div class="event-item">
                                            <strong>${event.name}</strong>
                                            <span>${this.formatDate(event.date)}</span>
                                            <span class="status-badge ${event.status === 'completed' ? 'status-approved' : 'status-pending'}">
                                                ${event.status}
                                            </span>
                                        </div>
                                    `).join('')}
                                </div>` : 
                                '<p class="text-muted">No event participation yet.</p>'
                            }
                        </div>
                        
                        <div class="detail-section">
                            <h4>Documents & Certificates</h4>
                            <div class="documents-list">
                                ${bull.certificates.map(cert => `
                                    <div class="document-item">
                                        <i class="fas fa-file-${cert.type === 'veterinary' ? 'medical' : 'contract'}"></i>
                                        <div class="document-info">
                                            <strong>${cert.type === 'veterinary' ? 'Veterinary Certificate' : 'Ownership Proof'}</strong>
                                            <small>Uploaded: ${this.formatDate(cert.uploaded)}</small>
                                        </div>
                                        <span class="status-badge ${cert.status === 'verified' ? 'status-approved' : 'status-pending'}">
                                            ${cert.status}
                                        </span>
                                        <button class="btn btn-sm btn-outline">View</button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" id="editBullDetails">Edit Details</button>
                    <button class="btn btn-outline" id="uploadMoreDocs">Upload More Documents</button>
                    <button class="btn btn-secondary" id="closeDetails">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // Close modal
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.querySelector('#closeDetails').addEventListener('click', closeModal);
        
        // Action buttons
        modal.querySelector('#editBullDetails').addEventListener('click', () => {
            closeModal();
            this.editBull(bullId);
        });
        
        modal.querySelector('#uploadMoreDocs').addEventListener('click', () => {
            alert('Document upload interface would open here.');
        });
    }

    editBull(bullId) {
        const bull = this.bulls.find(b => b.id === bullId);
        if (bull) {
            // Add hidden field for bull ID
            const form = document.getElementById('bullForm');
            if (!form.querySelector('#bullId')) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.id = 'bullId';
                input.name = 'bullId';
                form.appendChild(input);
            }
            document.getElementById('bullId').value = bullId;
            
            this.showBullForm(bull);
        }
    }

    async verifyBull(bullId) {
        const bull = this.bulls.find(b => b.id === bullId);
        if (!bull) return;

        const action = confirm(`Verify bull "${bull.name}"?\n\nThis will approve the bull for event participation.`);
        if (action) {
            try {
                await this.apiRequest(`/bulls/${bullId}/verify`, {
                    method: 'POST',
                    body: JSON.stringify({ status: 'active' })
                });
                
                await this.loadBulls();
                this.showMessage(`Bull "${bull.name}" verified successfully!`, 'success');
            } catch (error) {
                this.showMessage(error.message || 'Verification failed. Please try again.', 'error');
            }
        }
    }


    bookEventForBull(bullId) {
        const bull = this.bulls.find(b => b.id === bullId);
        if (!bull) return;

        if (bull.registrationStatus !== 'active') {
            alert('This bull is not approved for event participation yet.');
            return;
        }

        // Show time slot booking modal instead of redirecting
        this.showTimeSlotBooking(bullId);
    }

    showTimeSlotBooking(bullId) {
        const bull = this.bulls.find(b => b.id === bullId);
        if (!bull) return;

        const modal = document.getElementById('timeSlotBookingModal');
        const content = document.getElementById('timeSlotBookingContent');

        // Get available events
        const eventsManager = window.eventsManager || { events: [] };
        const availableEvents = eventsManager.events.filter(event =>
            event.status === 'open' && new Date(event.date) > new Date()
        );

        content.innerHTML = `
            <div class="time-slot-booking">
                <button type="button" class="modal-close-btn" id="closeSlotBooking" title="Close">&times;</button>
                <div class="booking-header">
                    <h4>Book Time Slot for ${bull.name}</h4>
                    <p>Select an event and preferred time slot</p>
                </div>

                <div class="booking-form">
                    <div class="form-group">
                        <label for="selectEvent">Select Event *</label>
                        <select id="selectEvent" class="form-control" required>
                            <option value="">Choose an event</option>
                            ${availableEvents.map(event => `
                                <option value="${event.id}">${event.name} - ${this.formatDate(event.date)}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="selectDate">Select Date *</label>
                        <input type="date" id="selectDate" class="form-control" required>
                    </div>

                    <div class="time-slots-section" style="display: none;">
                        <h5>Available Time Slots</h5>
                        <div class="time-slots-grid" id="timeSlotsGrid">
                            <!-- Time slots will be loaded here -->
                        </div>
                    </div>
                </div>

                <div class="booking-actions">
                    <button class="btn btn-primary" id="confirmBooking" disabled>Confirm Booking</button>
                    <button class="btn btn-outline" id="cancelSlotBooking">Cancel</button>
                </div>
            </div>
        `;

        // Show modal
        modal.classList.add('show');

        // Event listeners
        const selectEvent = document.getElementById('selectEvent');
        const selectDate = document.getElementById('selectDate');
        const confirmBtn = document.getElementById('confirmBooking');
        const cancelBtn = document.getElementById('cancelSlotBooking');
        const closeBtn = document.getElementById('closeSlotBooking');

        let selectedSlot = null;

        selectEvent.addEventListener('change', (e) => {
            if (e.target.value) {
                selectDate.min = new Date().toISOString().split('T')[0];
                selectDate.focus();
            }
        });

        selectDate.addEventListener('change', (e) => {
            if (e.target.value && selectEvent.value) {
                this.loadTimeSlots(selectEvent.value, e.target.value);
            }
        });

        // Cancel button
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        // Close button (X)
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });

        confirmBtn.addEventListener('click', () => {
            if (selectedSlot) {
                this.confirmTimeSlotBooking(bullId, selectEvent.value, selectDate.value, selectedSlot);
                modal.classList.remove('show');
            }
        });

        // Store bullId for later use
        modal.dataset.bullId = bullId;
    }

    loadTimeSlots(eventId, date) {
        const timeSlotsGrid = document.getElementById('timeSlotsGrid');
        const timeSlotsSection = document.querySelector('.time-slots-section');
        const confirmBtn = document.getElementById('confirmBooking');
        const modal = document.getElementById('timeSlotBookingModal');

        // Generate time slots from 8 AM to 6 PM with 30-minute intervals
        const slots = this.generateTimeSlots(date);

        timeSlotsGrid.innerHTML = slots.map(slot => `
            <div class="time-slot ${slot.available ? 'available' : 'booked'}"
                 data-time="${slot.time}"
                 data-available="${slot.available}">
                <div class="slot-time">${slot.displayTime}</div>
                <div class="slot-status">${slot.available ? 'Available' : 'Booked'}</div>
                ${slot.available ? '<div class="slot-select"><i class="fas fa-check"></i></div>' : ''}
            </div>
        `).join('');

        timeSlotsSection.style.display = 'block';

        // Store selected slot in a way that persists across event handlers
        let selectedTimeSlot = null;

        // Add click handlers for available slots
        timeSlotsGrid.querySelectorAll('.time-slot.available').forEach(slot => {
            slot.addEventListener('click', function() {
                // Remove previous selection
                timeSlotsGrid.querySelectorAll('.time-slot.selected').forEach(s => s.classList.remove('selected'));

                // Select this slot
                this.classList.add('selected');
                selectedTimeSlot = this.dataset.time;

                // Update confirm button
                confirmBtn.disabled = false;
                confirmBtn.textContent = `Book ${this.querySelector('.slot-time').textContent}`;

                // Store selected slot in modal dataset
                modal.dataset.selectedSlot = selectedTimeSlot;
            });
        });

        // Store the reference for confirm button handler
        modal.dataset.bullId = modal.dataset.bullId || '';
        
        // Update confirm button handler to use the selectedTimeSlot
        const oldConfirmHandler = confirmBtn.onclick;
        confirmBtn.onclick = () => {
            if (selectedTimeSlot) {
                const bullId = modal.dataset.bullId;
                this.confirmTimeSlotBooking(bullId, eventId, date, selectedTimeSlot);
                modal.classList.remove('show');
            }
        };
    }

    generateTimeSlots(date) {
        const slots = [];
        const startHour = 8; // 8 AM
        const endHour = 18; // 6 PM
        const interval = 30; // 30 minutes

        // Get existing bookings for this date from all bulls
        const existingBookings = this.getAllBookingsForDate(date);

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += interval) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const displayTime = this.formatTimeDisplay(hour, minute);

                // Check if slot is already booked for this date
                const isBooked = existingBookings.includes(timeString);

                slots.push({
                    time: timeString,
                    displayTime: displayTime,
                    available: !isBooked
                });
            }
        }

        return slots;
    }

    getAllBookingsForDate(date) {
        const bookedTimes = [];
        
        // Check all bulls' bookings for this date
        this.bulls.forEach(bull => {
            if (bull.bookings && Array.isArray(bull.bookings)) {
                bull.bookings.forEach(booking => {
                    if (booking.date === date && booking.status === 'confirmed') {
                        bookedTimes.push(booking.timeSlot);
                    }
                });
            }
        });
        
        return bookedTimes;
    }

    formatTimeDisplay(hour, minute) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    }

    confirmTimeSlotBooking(bullId, eventId, date, timeSlot) {
        const bull = this.bulls.find(b => b.id === bullId);
        if (!bull) return;

        // Create booking record
        const booking = {
            id: this.generateId('BOOKING'),
            bullId: bullId,
            eventId: eventId,
            date: date,
            timeSlot: timeSlot,
            status: 'confirmed',
            bookedAt: new Date().toISOString(),
            bookedBy: this.currentUser ? this.currentUser.id : 'system'
        };

        // Add booking to bull's record
        if (!bull.bookings) bull.bookings = [];
        bull.bookings.push(booking);

        // Save changes
        this.saveBulls();

        // Show confirmation
        this.showBookingConfirmation(bull, booking);

        // Reload bulls list
        this.loadBulls();
    }

    showBookingConfirmation(bull, booking) {
        const modal = document.createElement('div');
        modal.className = 'modal';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Booking Confirmed!</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="booking-confirmation">
                        <div class="confirmation-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <h4>Time Slot Booked Successfully</h4>

                        <div class="booking-details">
                            <div class="detail-item">
                                <span>Bull:</span>
                                <strong>${bull.name}</strong>
                            </div>
                            <div class="detail-item">
                                <span>Date:</span>
                                <strong>${this.formatDate(booking.date)}</strong>
                            </div>
                            <div class="detail-item">
                                <span>Time Slot:</span>
                                <strong>${this.formatTimeDisplay(
                                    parseInt(booking.timeSlot.split(':')[0]),
                                    parseInt(booking.timeSlot.split(':')[1])
                                )}</strong>
                            </div>
                            <div class="detail-item">
                                <span>Booking ID:</span>
                                <strong>${booking.id}</strong>
                            </div>
                        </div>

                        <div class="booking-notes">
                            <h5>Important Notes:</h5>
                            <ul>
                                <li>Please arrive 30 minutes before your scheduled time</li>
                                <li>Bring all required documents and certificates</li>
                                <li>Ensure your bull is properly prepared</li>
                                <li>Contact event organizers if you need to reschedule</li>
                            </ul>
                        </div>

                        <div class="confirmation-actions">
                            <button class="btn btn-primary" id="downloadBookingSlip">Download Booking Slip</button>
                            <button class="btn btn-outline" id="manageBookings">Manage My Bookings</button>
                            <button class="btn btn-secondary" id="closeConfirmation">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Show modal
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // Close modal
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.querySelector('#closeConfirmation').addEventListener('click', closeModal);

        // Action buttons
        modal.querySelector('#downloadBookingSlip').addEventListener('click', () => {
            this.downloadBookingSlip(bull, booking);
        });

        modal.querySelector('#manageBookings').addEventListener('click', () => {
            closeModal();
            this.showTimeSlotManagement(bullId);
        });
    }

    showTimeSlotManagement(bullId) {
        const bull = this.bulls.find(b => b.id === bullId);
        if (!bull) return;

        const modal = document.getElementById('timeSlotManagementModal');
        const content = document.getElementById('timeSlotManagementContent');

        const bookings = bull.bookings || [];

        content.innerHTML = `
            <div class="time-slot-management">
                <div class="management-header">
                    <h4>Manage Bookings for ${bull.name}</h4>
                    <p>View and manage your time slot bookings</p>
                </div>

                <div class="bookings-list">
                    ${bookings.length > 0 ? bookings.map(booking => `
                        <div class="booking-item" data-booking-id="${booking.id}">
                            <div class="booking-info">
                                <div class="booking-date">
                                    <i class="fas fa-calendar"></i>
                                    ${this.formatDate(booking.date)}
                                </div>
                                <div class="booking-time">
                                    <i class="fas fa-clock"></i>
                                    ${this.formatTimeDisplay(
                                        parseInt(booking.timeSlot.split(':')[0]),
                                        parseInt(booking.timeSlot.split(':')[1])
                                    )}
                                </div>
                                <div class="booking-status status-${booking.status}">
                                    ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </div>
                            </div>
                            <div class="booking-actions">
                                ${booking.status === 'confirmed' ? `
                                    <button class="btn btn-sm btn-outline reschedule" data-booking-id="${booking.id}">
                                        <i class="fas fa-edit"></i> Reschedule
                                    </button>
                                    <button class="btn btn-sm btn-danger cancel" data-booking-id="${booking.id}">
                                        <i class="fas fa-times"></i> Cancel
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('') : `
                        <div class="no-bookings">
                            <i class="fas fa-calendar-times"></i>
                            <h5>No bookings found</h5>
                            <p>You haven't booked any time slots yet.</p>
                            <button class="btn btn-primary" id="bookNewSlot">Book New Slot</button>
                        </div>
                    `}
                </div>

                <div class="management-actions">
                    <button class="btn btn-secondary" id="closeManagement">Close</button>
                </div>
            </div>
        `;

        // Show modal
        modal.classList.add('show');

        // Event listeners
        const closeBtn = document.getElementById('closeManagement');
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        // Reschedule buttons
        document.querySelectorAll('.reschedule').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const bookingId = e.target.closest('.reschedule').dataset.bookingId;
                modal.classList.remove('show');
                this.rescheduleBooking(bullId, bookingId);
            });
        });

        // Cancel buttons
        document.querySelectorAll('.cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const bookingId = e.target.closest('.cancel').dataset.bookingId;
                if (confirm('Are you sure you want to cancel this booking?')) {
                    this.cancelBooking(bullId, bookingId);
                    modal.classList.remove('show');
                    setTimeout(() => this.showTimeSlotManagement(bullId), 100);
                }
            });
        });

        // Book new slot button
        const bookNewBtn = document.getElementById('bookNewSlot');
        if (bookNewBtn) {
            bookNewBtn.addEventListener('click', () => {
                modal.classList.remove('show');
                this.showTimeSlotBooking(bullId);
            });
        }
    }

    rescheduleBooking(bullId, bookingId) {
        const bull = this.bulls.find(b => b.id === bullId);
        if (!bull) return;

        const booking = bull.bookings.find(b => b.id === bookingId);
        if (!booking) return;

        // Show reschedule interface (similar to booking but pre-filled)
        const modal = document.getElementById('timeSlotBookingModal');
        const content = document.getElementById('timeSlotBookingContent');

        content.innerHTML = `
            <div class="time-slot-booking">
                <div class="booking-header">
                    <h4>Reschedule Booking for ${bull.name}</h4>
                    <p>Current booking: ${this.formatDate(booking.date)} at ${this.formatTimeDisplay(
                        parseInt(booking.timeSlot.split(':')[0]),
                        parseInt(booking.timeSlot.split(':')[1])
                    )}</p>
                </div>

                <div class="booking-form">
                    <div class="form-group">
                        <label for="selectDate">Select New Date *</label>
                        <input type="date" id="selectDate" class="form-control" value="${booking.date}" required>
                    </div>

                    <div class="time-slots-section">
                        <h5>Available Time Slots</h5>
                        <div class="time-slots-grid" id="timeSlotsGrid">
                            <!-- Time slots will be loaded here -->
                        </div>
                    </div>
                </div>

                <div class="booking-actions">
                    <button class="btn btn-primary" id="confirmReschedule" disabled>Confirm Reschedule</button>
                    <button class="btn btn-outline" id="cancelReschedule">Cancel</button>
                </div>
            </div>
        `;

        // Show modal
        modal.classList.add('show');

        // Load time slots for current date
        this.loadTimeSlots(booking.eventId, booking.date);

        // Event listeners
        const selectDate = document.getElementById('selectDate');
        const confirmBtn = document.getElementById('confirmReschedule');
        const cancelBtn = document.getElementById('cancelReschedule');

        let selectedSlot = null;

        selectDate.addEventListener('change', (e) => {
            this.loadTimeSlots(booking.eventId, e.target.value);
        });

        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        confirmBtn.addEventListener('click', () => {
            if (selectedSlot) {
                this.confirmReschedule(bullId, bookingId, selectDate.value, selectedSlot);
                modal.classList.remove('show');
            }
        });

        // Store booking info
        modal.dataset.bullId = bullId;
        modal.dataset.bookingId = bookingId;
    }

    confirmReschedule(bullId, bookingId, newDate, newTimeSlot) {
        const bull = this.bulls.find(b => b.id === bullId);
        if (!bull) return;

        const booking = bull.bookings.find(b => b.id === bookingId);
        if (!booking) return;

        // Update booking
        booking.date = newDate;
        booking.timeSlot = newTimeSlot;
        booking.updatedAt = new Date().toISOString();

        // Save changes
        this.saveBulls();

        // Show confirmation
        this.showMessage('Booking rescheduled successfully!', 'success');

        // Reload bulls list
        this.loadBulls();
    }

    cancelBooking(bullId, bookingId) {
        const bull = this.bulls.find(b => b.id === bullId);
        if (!bull) return;

        // Remove booking
        bull.bookings = bull.bookings.filter(b => b.id !== bookingId);

        // Save changes
        this.saveBulls();

        // Show confirmation
        this.showMessage('Booking cancelled successfully!', 'success');

        // Reload bulls list
        this.loadBulls();
    }

    downloadBookingSlip(bull, booking) {
        const slipContent = `
            JALLIX-NEX TIME SLOT BOOKING SLIP
            ==================================

            Booking ID: ${booking.id}
            Date Issued: ${new Date().toLocaleDateString()}

            Bull Information:
            ----------------
            Bull ID: ${bull.id}
            Bull Name: ${bull.name}
            Owner: ${bull.ownerName}

            Booking Details:
            ---------------
            Event Date: ${this.formatDate(booking.date)}
            Time Slot: ${this.formatTimeDisplay(
                parseInt(booking.timeSlot.split(':')[0]),
                parseInt(booking.timeSlot.split(':')[1])
            )}
            Status: ${booking.status.toUpperCase()}

            Important Instructions:
            ----------------------
            1. Arrive at the venue 30 minutes before your slot
            2. Bring this slip and all required documents
            3. Ensure your bull is properly prepared
            4. Follow all safety protocols
            5. Contact organizers for any changes

            Venue: Jallikattu Arena
            Contact: +91 98765 43210

            Thank you for participating in JALLIX-NEX!
        `;

        // Create download
        const blob = new Blob([slipContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `booking_slip_${booking.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showMessage('Booking slip downloaded!', 'success');
    }

    showBulkUpload() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Bulk Bull Registration</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="bulk-upload-instructions">
                        <h4>Instructions:</h4>
                        <ol>
                            <li>Download the template file</li>
                            <li>Fill in bull and owner information</li>
                            <li>Save as CSV file</li>
                            <li>Upload using the form below</li>
                        </ol>
                        
                        <div class="template-download">
                            <a href="#" class="btn btn-outline" id="downloadTemplate">
                                <i class="fas fa-download"></i> Download Template
                            </a>
                        </div>
                        
                        <div class="upload-form">
                            <h5>Upload CSV File</h5>
                            <div class="file-upload">
                                <i class="fas fa-file-csv"></i>
                                <p>Click to upload CSV file</p>
                                <input type="file" id="bulkCsvFile" accept=".csv">
                            </div>
                            <small class="text-muted">Maximum file size: 10MB</small>
                        </div>
                        
                        <div class="progress-container" style="display: none;">
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                            </div>
                            <div class="progress-text">Uploading...</div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" id="processBulkUpload">Process Upload</button>
                    <button class="btn btn-secondary" id="closeBulkUpload">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Show modal
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        // Close modal
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.querySelector('#closeBulkUpload').addEventListener('click', closeModal);
        
        // Download template
        modal.querySelector('#downloadTemplate').addEventListener('click', (e) => {
            e.preventDefault();
            this.downloadTemplate();
        });
        
        // Process upload
        modal.querySelector('#processBulkUpload').addEventListener('click', () => {
            const fileInput = modal.querySelector('#bulkCsvFile');
            if (!fileInput.files.length) {
                alert('Please select a CSV file to upload.');
                return;
            }
            
            this.processBulkUpload(fileInput.files[0]);
            closeModal();
        });
    }

    downloadTemplate() {
        // Create CSV template
        const headers = [
            'Bull Name', 'Breed', 'Age', 'Color', 'Weight', 'Height',
            'Owner Name', 'Owner Aadhaar', 'Owner Phone', 'Owner Email', 'Owner Address'
        ];
        
        const csvContent = headers.join(',') + '\n' +
            'Example Bull,Kangayam,4,Brown,450,150,Raj Kumar,123456789012,9876543210,raj@example.com,Madurai,Tamil Nadu';
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bull_registration_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showMessage('Template downloaded successfully!', 'success');
    }

    processBulkUpload(file) {
        // Simulate bulk upload processing
        this.showMessage('Processing bulk upload...', 'info');
        
        setTimeout(() => {
            // Simulate adding sample bulls from CSV
            const newBulls = [
                {
                    id: this.generateId('BULL'),
                    name: 'Bulk Bull 1',
                    breed: 'Kangayam',
                    age: 5,
                    ownerName: 'Bulk Owner',
                    certificateStatus: 'pending',
                    registrationStatus: 'pending'
                },
                {
                    id: this.generateId('BULL'),
                    name: 'Bulk Bull 2',
                    breed: 'Pulikulam',
                    age: 4,
                    ownerName: 'Bulk Owner',
                    certificateStatus: 'pending',
                    registrationStatus: 'pending'
                }
            ];
            
            this.bulls.push(...newBulls);
            this.saveBulls();
            this.loadBulls();
            
            this.showMessage(`Successfully added ${newBulls.length} bulls from bulk upload!`, 'success');
        }, 2000);
    }

    downloadReceipt(bull) {
        // Create receipt content
        const receiptContent = `
            JALLIX-NEX BULL REGISTRATION RECEIPT
            =====================================
            
            Receipt ID: ${this.generateId('RCPT')}
            Date: ${new Date().toLocaleDateString()}
            Time: ${new Date().toLocaleTimeString()}
            
            Bull Information:
            ----------------
            Bull ID: ${bull.id}
            Bull Name: ${bull.name}
            Breed: ${bull.breed}
            Age: ${bull.age} years
            Owner: ${bull.ownerName}
            
            Payment Details:
            ---------------
            Registration Fee: ₹2,500
            Certificate Verification: ₹500
            Total Amount: ₹3,000
            Payment Method: ${bull.paymentMethod}
            Transaction ID: ${this.generateId('TXN')}
            Status: Paid
            
            Terms & Conditions:
            ------------------
            1. This receipt confirms registration only
            2. Event participation subject to verification
            3. Fees are non-refundable
            4. Certificate valid for 1 year
            
            Contact: payments@jallixnex.com
            Phone: +91 98765 43210
            
            Thank you for registering with JALLIX-NEX!
        `;
        
        // Create download
        const blob = new Blob([receiptContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt_${bull.id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showMessage('Receipt downloaded!', 'success');
    }

    // Helper methods
    saveBulls() {
        // No longer needed with API backend
    }


    generateId(prefix) {
        return prefix + '_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    showMessage(message, type = 'info') {
        // Create message element
        const msgDiv = document.createElement('div');
        msgDiv.className = `bulls-message bulls-message-${type}`;
        msgDiv.innerHTML = `
            <div class="message-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="message-close"><i class="fas fa-times"></i></button>
        `;

        // Add to page
        const container = document.querySelector('.dashboard');
        if (container) {
            container.insertBefore(msgDiv, container.firstChild);
        }

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (msgDiv.parentNode) msgDiv.remove();
        }, 5000);
    }

    getSampleBulls() {
        return [
            {
                id: 'BULL_001',
                name: 'Vira',
                breed: 'Kangayam',
                age: 4,
                color: 'Brown',
                weight: 450,
                height: 145,
                history: 'Participated in 3 events, 2 wins',
                specialFeatures: 'White star on forehead',
                ownerName: 'Raja Kumar',
                ownerAadhaar: '123456789012',
                ownerPhone: '9876543210',
                ownerEmail: 'raja@example.com',
                ownerAddress: 'Madurai, Tamil Nadu',
                certificateStatus: 'verified',
                registrationStatus: 'active',
                registrationDate: '2023-05-15',
                lastUpdated: '2023-06-20',
                events: [
                    { id: 'EVENT_001', name: 'Madurai Championship', date: '2023-03-15', status: 'completed' }
                ]
            },
            {
                id: 'BULL_002',
                name: 'Simha',
                breed: 'Pulikulam',
                age: 5,
                color: 'Black',
                weight: 480,
                height: 150,
                history: 'Participated in 5 events, 3 wins',
                specialFeatures: 'Long curved horns',
                ownerName: 'Muthu Vel',
                ownerAadhaar: '234567890123',
                ownerPhone: '9876543211',
                ownerEmail: 'muthu@example.com',
                ownerAddress: 'Madurai, Tamil Nadu',
                certificateStatus: 'verified',
                registrationStatus: 'active',
                registrationDate: '2023-04-10',
                lastUpdated: '2023-06-18',
                events: [
                    { id: 'EVENT_001', name: 'Madurai Championship', date: '2023-03-15', status: 'completed' },
                    { id: 'EVENT_002', name: 'Alanganallur Traditional', date: '2023-01-20', status: 'completed' }
                ]
            }
        ];
    }
}

// Initialize bulls manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('bulls-page')) {
        window.bullsManager = new BullsManager();
        
        if (sessionStorage.getItem('openForm') === 'bull') {
            setTimeout(() => {
                window.bullsManager.showBullForm();
                sessionStorage.removeItem('openForm');
            }, 500);
        }
        
        // Add bulls-specific CSS
        const style = document.createElement('style');
        style.textContent = `
            /* Time Slot Booking Styles - Enhanced Design */
            .time-slot-booking {
                max-width: 700px;
                margin: 0 auto;
                padding: 10px;
                position: relative;
            }

            .modal-close-btn {
                position: absolute;
                top: 10px;
                right: 15px;
                background: none;
                border: none;
                font-size: 32px;
                font-weight: bold;
                color: #95a5a6;
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 10;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
            }

            .modal-close-btn:hover {
                color: #e74c3c;
                background: rgba(231, 76, 60, 0.1);
                transform: scale(1.1);
            }

            .booking-header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #f0f0f0;
            }

            .booking-header h4 {
                color: #2c3e50;
                margin-bottom: 8px;
                font-size: 1.6rem;
                font-weight: 700;
            }

            .booking-header p {
                color: #7f8c8d;
                margin: 0;
                font-size: 1rem;
            }

            .booking-form {
                background: #ffffff;
                border-radius: 16px;
                padding: 25px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            }

            .booking-form .form-group {
                margin-bottom: 20px;
            }

            .booking-form label {
                display: block;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 10px;
                font-size: 0.95rem;
            }

            .booking-form .form-control {
                width: 100%;
                padding: 14px 18px;
                border: 2px solid #e0e0e0;
                border-radius: 12px;
                font-size: 1rem;
                transition: all 0.3s ease;
                background: #fafafa;
            }

            .booking-form .form-control:focus {
                border-color: #e74c3c;
                background: #fff;
                box-shadow: 0 0 0 4px rgba(231, 76, 60, 0.1);
                outline: none;
            }

            .booking-form select.form-control {
                cursor: pointer;
                appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237f8c8d' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 16px center;
                padding-right: 45px;
            }

            .time-slots-section {
                margin-top: 25px;
                background: linear-gradient(135deg, #fefefe 0%, #f8f9fa 100%);
                border-radius: 16px;
                padding: 20px;
                box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.05);
            }

            .time-slots-section h5 {
                color: #2c3e50;
                margin-bottom: 20px;
                font-size: 1.1rem;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .time-slots-section h5::before {
                content: '';
                width: 4px;
                height: 20px;
                background: linear-gradient(180deg, #e74c3c, #c0392b);
                border-radius: 2px;
            }

            .time-slots-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 12px;
                margin-top: 15px;
                max-height: 320px;
                overflow-y: auto;
                padding: 5px;
            }

            .time-slots-grid::-webkit-scrollbar {
                width: 6px;
            }

            .time-slots-grid::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
            }

            .time-slots-grid::-webkit-scrollbar-thumb {
                background: #c0c0c0;
                border-radius: 3px;
            }

            .time-slot {
                background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
                border: 2px solid #e8e8e8;
                border-radius: 12px;
                padding: 16px 12px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                min-height: 70px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 6px;
                overflow: hidden;
            }

            .time-slot::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: #e8e8e8;
                transition: all 0.3s ease;
            }

            .time-slot.available {
                border-color: #27ae60;
                background: linear-gradient(145deg, #ffffff 0%, #e8f5e9 100%);
            }

            .time-slot.available::before {
                background: linear-gradient(90deg, #27ae60, #2ecc71);
            }

            .time-slot.available:hover {
                border-color: #27ae60;
                background: linear-gradient(145deg, #e8f5e9 0%, #c8e6c9 100%);
                transform: translateY(-3px) scale(1.02);
                box-shadow: 0 8px 25px rgba(39, 174, 96, 0.25);
            }

            .time-slot.booked {
                border-color: #e74c3c;
                background: linear-gradient(145deg, #fafafa 0%, #ffebee 100%);
                cursor: not-allowed;
                opacity: 0.7;
            }

            .time-slot.booked::before {
                background: #e74c3c;
            }

            .time-slot.selected {
                border-color: #e74c3c;
                background: linear-gradient(145deg, #e74c3c 0%, #c0392b 100%);
                box-shadow: 0 8px 25px rgba(231, 76, 60, 0.4);
                transform: translateY(-3px) scale(1.02);
                color: white;
            }

            .time-slot.selected::before {
                background: rgba(255, 255, 255, 0.3);
            }

            .slot-time {
                font-weight: 700;
                font-size: 1.1rem;
                color: #2c3e50;
                letter-spacing: 0.5px;
            }

            .time-slot.selected .slot-time {
                color: white;
            }

            .slot-status {
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                padding: 4px 10px;
                border-radius: 20px;
                background: rgba(39, 174, 96, 0.15);
                color: #27ae60;
            }

            .time-slot.available .slot-status {
                background: rgba(39, 174, 96, 0.15);
                color: #27ae60;
            }

            .time-slot.booked .slot-status {
                background: rgba(231, 76, 60, 0.15);
                color: #e74c3c;
            }

            .time-slot.selected .slot-status {
                background: rgba(255, 255, 255, 0.25);
                color: white;
            }

            .slot-icon {
                font-size: 18px;
                margin-bottom: 4px;
            }

            .time-slot.available .slot-icon {
                color: #27ae60;
            }

            .time-slot.booked .slot-icon {
                color: #e74c3c;
            }

            .time-slot.selected .slot-icon {
                color: white;
            }

            .booking-actions {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 30px;
                padding-top: 25px;
                border-top: 2px solid #f0f0f0;
            }

            .booking-actions .btn {
                padding: 14px 35px;
                font-size: 1rem;
                font-weight: 600;
                border-radius: 12px;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .booking-actions .btn-primary {
                background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
                border: none;
                color: white;
                box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
            }

            .booking-actions .btn-primary:hover:not(:disabled) {
                background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
            }

            .booking-actions .btn-primary:disabled {
                background: linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%);
                cursor: not-allowed;
                box-shadow: none;
            }

            .booking-actions .btn-outline {
                border: 2px solid #95a5a6;
                color: #7f8c8d;
                background: transparent;
            }

            .booking-actions .btn-outline:hover {
                border-color: #7f8c8d;
                background: #f8f9fa;
                color: #2c3e50;
            }

            /* Legend Styles */
            .slot-legend {
                display: flex;
                justify-content: center;
                gap: 30px;
                margin-bottom: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 10px;
            }

            .legend-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.85rem;
                color: #7f8c8d;
            }

            .legend-dot {
                width: 14px;
                height: 14px;
                border-radius: 4px;
            }

            .legend-dot.available {
                background: linear-gradient(145deg, #27ae60, #2ecc71);
            }

            .legend-dot.booked {
                background: linear-gradient(145deg, #e74c3c, #c0392b);
            }

            .legend-dot.selected {
                background: linear-gradient(145deg, #3498db, #2980b9);
            }

            /* Booking Confirmation Styles */
            .booking-confirmation {
                text-align: center;
                max-width: 500px;
                margin: 0 auto;
            }

            .confirmation-icon {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, var(--success), #2ecc71);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                color: white;
                font-size: 40px;
                box-shadow: 0 8px 25px rgba(39, 174, 96, 0.3);
            }

            .booking-details {
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                padding: 25px;
                border-radius: 12px;
                margin: 20px 0;
                border-left: 4px solid var(--primary);
            }

            .booking-details .detail-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid rgba(0,0,0,0.1);
            }

            .booking-details .detail-item:last-child {
                border-bottom: none;
            }

            .booking-notes {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                text-align: left;
            }

            .booking-notes h5 {
                color: #856404;
                margin-bottom: 10px;
            }

            .booking-notes ol {
                margin: 0;
                padding-left: 20px;
            }

            .booking-notes li {
                margin-bottom: 5px;
                color: #856404;
            }

            .confirmation-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
                margin-top: 25px;
                flex-wrap: wrap;
            }

            /* Time Slot Management Styles */
            .time-slot-management {
                max-width: 700px;
                margin: 0 auto;
            }

            .management-header {
                text-align: center;
                margin-bottom: 30px;
            }

            .management-header h4 {
                color: var(--primary);
                margin-bottom: 10px;
                font-size: 1.4rem;
            }

            .management-header p {
                color: var(--gray);
                margin: 0;
            }

            .bookings-list {
                margin: 20px 0;
            }

            .booking-item {
                background: white;
                border: 1px solid var(--gray-light);
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.3s ease;
            }

            .booking-item:hover {
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                border-color: var(--primary);
            }

            .booking-info {
                flex: 1;
            }

            .booking-date, .booking-time {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                font-size: 14px;
            }

            .booking-date i, .booking-time i {
                color: var(--primary);
                width: 16px;
            }

            .booking-status {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .status-confirmed {
                background: rgba(39, 174, 96, 0.1);
                color: var(--success);
                border: 1px solid var(--success);
            }

            .status-pending {
                background: rgba(243, 156, 18, 0.1);
                color: var(--warning);
                border: 1px solid var(--warning);
            }

            .status-cancelled {
                background: rgba(231, 76, 60, 0.1);
                color: var(--danger);
                border: 1px solid var(--danger);
            }

            .booking-actions {
                display: flex;
                gap: 8px;
                flex-direction: column;
            }

            .booking-actions .btn {
                padding: 6px 12px;
                font-size: 12px;
                border-radius: 6px;
            }

            .no-bookings {
                text-align: center;
                padding: 60px 20px;
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                border-radius: 12px;
                border: 2px dashed var(--gray-light);
            }

            .no-bookings i {
                font-size: 48px;
                color: var(--gray);
                margin-bottom: 15px;
            }

            .no-bookings h5 {
                color: var(--gray);
                margin-bottom: 10px;
            }

            .no-bookings p {
                color: var(--gray);
                margin-bottom: 20px;
            }

            .management-actions {
                display: flex;
                justify-content: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid var(--gray-light);
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .time-slots-grid {
                    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                    gap: 8px;
                    max-height: 250px;
                }

                .time-slot {
                    padding: 10px 6px;
                    min-height: 50px;
                }

                .slot-time {
                    font-size: 13px;
                }

                .slot-status {
                    font-size: 10px;
                }

                .booking-actions {
                    flex-direction: column;
                    gap: 10px;
                }

                .confirmation-actions {
                    flex-direction: column;
                }

                .booking-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 15px;
                }

                .booking-actions {
                    flex-direction: row;
                    width: 100%;
                    justify-content: flex-end;
                }
            }

            @media (max-width: 480px) {
                .time-slots-grid {
                    grid-template-columns: repeat(3, 1fr);
                    gap: 6px;
                }

                .time-slot {
                    padding: 8px 4px;
                    min-height: 45px;
                }

                .slot-time {
                    font-size: 12px;
                }

                .slot-status {
                    font-size: 9px;
                }
            }
            /* Make page-header bigger and more impressive */
            .page-header {
                min-height: 500px !important;
                height: 60vh;
                max-height: 700px;
            }
            
            .page-header .container {
                position: relative;
                z-index: 10;
                padding-top: 80px;
            }
            
            .page-header h1 {
                font-size: 3.5rem !important;
                font-weight: 700;
                margin-bottom: 20px;
                text-shadow: 2px 2px 10px rgba(0,0,0,0.5);
            }
            
            .page-header p {
                font-size: 1.5rem;
                font-weight: 300;
                max-width: 600px;
                text-shadow: 2px 2px 10px rgba(0,0,0,0.5);
            }
            
            /* Video Background Styles */
            .header-video-bg {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                z-index: 1;
            }
            
            .header-video-bg video {
                min-width: 100%;
                min-height: 100%;
                width: auto;
                height: auto;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                object-fit: cover;
            }
            
            .header-video-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.8) 100%);
                z-index: 2;
            }
            
            .bulls-message {
                padding: 15px;
                margin-bottom: 20px;
                border-radius: var(--radius);
                display: flex;
                justify-content: space-between;
                align-items: center;
                animation: slideDown 0.3s ease;
                box-shadow: var(--shadow);
            }
            
            .bulls-message-success {
                background-color: rgba(39, 174, 96, 0.1);
                border: 1px solid rgba(39, 174, 96, 0.3);
                color: var(--green);
            }
            
            .bulls-message-error {
                background-color: rgba(231, 76, 60, 0.1);
                border: 1px solid rgba(231, 76, 60, 0.3);
                color: var(--danger);
            }
            
            .bulls-message-info {
                background-color: rgba(52, 152, 219, 0.1);
                border: 1px solid rgba(52, 152, 219, 0.3);
                color: var(--info);
            }
            
            .bull-name {
                display: flex;
                flex-direction: column;
            }
            
            .bull-name small {
                color: var(--gray);
                font-size: 12px;
            }
            
            .owner-info {
                display: flex;
                flex-direction: column;
            }
            
            .owner-info small {
                color: var(--gray);
                font-size: 12px;
            }
            
            .action-buttons {
                display: flex;
                gap: 5px;
            }
            
            .btn-action {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: var(--transition);
            }
            
            .btn-action.view {
                background-color: rgba(52, 152, 219, 0.1);
                color: var(--info);
            }
            
            .btn-action.view:hover {
                background-color: var(--info);
                color: white;
            }
            
            .btn-action.edit {
                background-color: rgba(243, 156, 18, 0.1);
                color: var(--warning);
            }
            
            .btn-action.edit:hover {
                background-color: var(--warning);
                color: white;
            }
            
            .btn-action.verify {
                background-color: rgba(39, 174, 96, 0.1);
                color: var(--green);
            }
            
            .btn-action.verify:hover {
                background-color: var(--green);
                color: white;
            }
            
            .btn-action.book {
                background-color: rgba(155, 89, 182, 0.1);
                color: #9b59b6;
            }
            
            .btn-action.book:hover {
                background-color: #9b59b6;
                color: white;
            }
            
            .payment-info {
                background-color: var(--gray-light);
                padding: 15px;
                border-radius: var(--radius);
                margin-bottom: 20px;
            }
            
            .payment-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #ddd;
            }
            
            .payment-item.total {
                border-top: 2px solid var(--primary);
                border-bottom: none;
                margin-top: 8px;
                padding-top: 12px;
            }
            
            .price {
                font-weight: 600;
                color: var(--primary);
            }
            
            .form-section {
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 1px solid var(--gray-light);
            }
            
            .form-section h4 {
                margin-bottom: 15px;
                color: var(--primary);
            }
            
            .form-actions {
                display: flex;
                gap: 15px;
                justify-content: flex-end;
                margin-top: 30px;
            }
            
            .table-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .table-actions {
                display: flex;
                gap: 10px;
            }
            
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s;
            }
            
            .modal.show {
                opacity: 1;
                visibility: visible;
            }
            
            .modal-content {
                background: white;
                border-radius: var(--radius);
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                transform: translateY(-20px);
                transition: transform 0.3s;
            }
            
            .modal.show .modal-content {
                transform: translateY(0);
            }
            
            .bull-details {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            
            .status-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-top: 10px;
            }
            
            .status-item {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .events-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 10px;
            }
            
            .event-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background-color: white;
                border-radius: var(--radius);
            }
            
            .documents-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 10px;
            }
            
            .document-item {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px;
                background-color: white;
                border-radius: var(--radius);
            }
            
            .document-info {
                flex: 1;
            }
            
            .payment-confirmation {
                text-align: center;
                padding: 20px;
            }
            
            .confirmation-icon {
                width: 80px;
                height: 80px;
                background-color: rgba(39, 174, 96, 0.1);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                color: var(--green);
                font-size: 40px;
            }
            
            .payment-details {
                background-color: var(--gray-light);
                padding: 20px;
                border-radius: var(--radius);
                margin: 20px 0;
            }
            
            .payment-details .detail-item {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #ddd;
            }
            
            .next-steps {
                text-align: left;
                margin: 20px 0;
            }
            
            .next-steps ol {
                padding-left: 20px;
                margin-top: 10px;
            }
            
            .next-steps li {
                margin-bottom: 8px;
            }
            
            .actions {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-top: 20px;
            }
            
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
});
