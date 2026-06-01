// Payments Management for JALLIX-NEX
// Handles payment processing, tracking, and management

class PaymentsManager {
    constructor() {
        this.payments = [];
        this.currentUser = null;
        this.token = localStorage.getItem('jallixnex_token') || sessionStorage.getItem('jallixnex_token');
        this.apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:5000/api'
            : 'https://jallix-nex-smart-jallikattu-event.onrender.com/api';
        
        this.initializePayments();
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

    async initializePayments() {
        try {
            const userStr = localStorage.getItem('jallixnex_user');
            if (userStr) {
                this.currentUser = JSON.parse(userStr);
            }

            await this.loadPayments();
            this.setupEventListeners();
            this.updateFormVisibility();
        } catch (error) {
            console.error('Payments initialization error:', error);
        }
    }

    async loadPayments() {
        try {
            const response = await this.apiRequest('/payments');
            this.payments = response.data || response;
            
            if (Array.isArray(this.payments)) {
                this.displayPayments();
            }
        } catch (error) {
            console.error('Error loading payments:', error);
            this.showMessage('Error loading payments: ' + error.message, 'error');
        }
    }

    displayPayments() {
        const container = document.getElementById('paymentsContainer');
        if (!container) return;

        if (this.payments.length === 0) {
            container.innerHTML = '<p class="text-center text-muted">No payments found</p>';
            return;
        }

        container.innerHTML = this.payments.map(payment => `
            <div class="payment-card">
                <div class="payment-header">
                    <h4>Payment #${payment.id?.substring(0, 8) || 'N/A'}</h4>
                    <span class="badge badge-${payment.status === 'completed' ? 'success' : payment.status === 'pending' ? 'warning' : 'danger'}">
                        ${payment.status?.toUpperCase() || 'PENDING'}
                    </span>
                </div>
                <div class="payment-details">
                    <p><i class="fas fa-money-bill"></i> Amount: <strong>₹${payment.amount || 0}</strong></p>
                    <p><i class="fas fa-calendar"></i> Date: ${new Date(payment.created_at || payment.payment_date).toLocaleDateString()}</p>
                    <p><i class="fas fa-user"></i> User: ${payment.user?.name || 'N/A'}</p>
                </div>
                <div class="payment-info">
                    <p>Type: <strong>${payment.type || 'Entry Fee'}</strong></p>
                    <p>Method: <strong>${payment.method || 'N/A'}</strong></p>
                </div>
                <div class="payment-actions">
                    <button class="btn btn-sm btn-primary" onclick="paymentsManager.viewPayment('${payment.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    ${this.currentUser?.role === 'admin' && payment.status === 'pending' ? `
                        <button class="btn btn-sm btn-success" onclick="paymentsManager.approvePayment('${payment.id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="paymentsManager.rejectPayment('${payment.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : ''}
                    ${payment.status === 'completed' && this.currentUser?.role === 'admin' ? `
                        <button class="btn btn-sm btn-warning" onclick="paymentsManager.refundPayment('${payment.id}')">
                            <i class="fas fa-undo"></i> Refund
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => this.handlePaymentSubmit(e));
        }

        const addPaymentBtn = document.getElementById('addPaymentBtn');
        if (addPaymentBtn) {
            addPaymentBtn.addEventListener('click', () => this.togglePaymentForm());
        }

        const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');
        if (cancelPaymentBtn) {
            cancelPaymentBtn.addEventListener('click', () => this.togglePaymentForm());
        }
    }

    togglePaymentForm() {
        const formContainer = document.getElementById('paymentFormContainer');
        if (formContainer) {
            formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
        }
    }

    async handlePaymentSubmit(e) {
        e.preventDefault();

        if (!this.token) {
            this.showMessage('Please login to make a payment', 'error');
            window.location.href = 'login.html';
            return;
        }

        try {
            const paymentData = {
                amount: parseFloat(document.getElementById('paymentAmount')?.value),
                type: document.getElementById('paymentType')?.value,
                method: document.getElementById('paymentMethod')?.value,
                description: document.getElementById('paymentDescription')?.value || '',
                reference_id: document.getElementById('paymentReference')?.value || ''
            };

            if (!paymentData.amount || !paymentData.type || !paymentData.method) {
                this.showMessage('Please fill in all required fields', 'error');
                return;
            }

            const response = await this.apiRequest('/payments', {
                method: 'POST',
                body: JSON.stringify(paymentData)
            });

            this.showMessage('Payment recorded successfully!', 'success');
            document.getElementById('paymentForm').reset();
            this.togglePaymentForm();
            await this.loadPayments();

        } catch (error) {
            console.error('Error processing payment:', error);
            this.showMessage('Error processing payment: ' + error.message, 'error');
        }
    }

    async viewPayment(paymentId) {
        try {
            const payment = this.payments.find(p => p.id === paymentId);
            if (payment) {
                console.log('Payment details:', payment);
                alert(`Payment #${paymentId.substring(0, 8)}\nAmount: ₹${payment.amount}\nStatus: ${payment.status}\nType: ${payment.type}`);
            }
        } catch (error) {
            this.showMessage('Error viewing payment: ' + error.message, 'error');
        }
    }

    async approvePayment(paymentId) {
        if (!confirm('Approve this payment?')) {
            return;
        }

        try {
            await this.apiRequest(`/payments/${paymentId}/approve`, {
                method: 'PUT',
                body: JSON.stringify({ remarks: '' })
            });

            this.showMessage('Payment approved successfully', 'success');
            await this.loadPayments();
        } catch (error) {
            this.showMessage('Error approving payment: ' + error.message, 'error');
        }
    }

    async rejectPayment(paymentId) {
        const remarks = prompt('Enter rejection remarks:');
        if (remarks === null) {
            return;
        }

        try {
            await this.apiRequest(`/payments/${paymentId}/reject`, {
                method: 'PUT',
                body: JSON.stringify({ remarks })
            });

            this.showMessage('Payment rejected successfully', 'success');
            await this.loadPayments();
        } catch (error) {
            this.showMessage('Error rejecting payment: ' + error.message, 'error');
        }
    }

    async refundPayment(paymentId) {
        const remarks = prompt('Enter refund remarks:');
        if (remarks === null) {
            return;
        }

        try {
            await this.apiRequest(`/payments/${paymentId}/refund`, {
                method: 'POST',
                body: JSON.stringify({ remarks })
            });

            this.showMessage('Refund processed successfully', 'success');
            await this.loadPayments();
        } catch (error) {
            this.showMessage('Error processing refund: ' + error.message, 'error');
        }
    }

    updateFormVisibility() {
        const formContainer = document.getElementById('paymentFormContainer');
        if (formContainer) {
            formContainer.style.display = 'none';
        }
    }

    showMessage(message, type = 'info') {
        const existing = document.querySelectorAll('.message-alert');
        existing.forEach(el => el.remove());

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
        setTimeout(() => messageEl.remove(), 5000);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    window.paymentsManager = new PaymentsManager();
});
