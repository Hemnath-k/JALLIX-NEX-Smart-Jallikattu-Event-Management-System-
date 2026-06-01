// Global API Configuration for JALLIX-NEX
// This file sets the API base URL dynamically based on the environment

const API_CONFIG = {
    // Dynamic API URL - automatically uses production backend when deployed
    getBaseURL: function() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        } else {
            // Production backend URL
            return 'https://jallix-nex-smart-jallikattu-event.onrender.com/api';
        }
    },
    
    BASE_URL: function() {
        return this.getBaseURL();
    },
    
    // Helper method for API calls
    async fetch(endpoint, options = {}) {
        const url = `${this.getBaseURL()}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        // Add auth token if available
        const token = localStorage.getItem('jallixnex_token') || sessionStorage.getItem('jallixnex_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        return fetch(url, config);
    }
};

// For backward compatibility
const API_BASE = API_CONFIG.getBaseURL();
